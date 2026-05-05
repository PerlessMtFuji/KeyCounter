mod hook;
mod keycode;
mod permissions;
mod state;
mod store;

use std::sync::atomic::Ordering;
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

use serde::Serialize;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    Emitter, Manager, State,
};

use crate::state::AppState;
use crate::store::{
    day_stats, lifetime_total, live_snapshot, punch_card_30d, range_stats, streak_days, today,
    today_hourly, top_keys, DayStats, LiveSnapshot, RangeStats, Store, TopKey,
};

#[derive(Serialize)]
struct AppInfo {
    name: &'static str,
    version: &'static str,
    db_path: String,
    paused: bool,
}

#[derive(Serialize)]
struct PermissionStatus {
    accessibility: bool,
}

#[derive(Serialize, Clone)]
struct LivePulse {
    delta: i64,
    total: i64,
}

fn map_err<E: std::fmt::Display>(e: E) -> String {
    e.to_string()
}

#[tauri::command]
fn app_info(state: State<'_, AppState>) -> AppInfo {
    AppInfo {
        name: "KeyCounter",
        version: env!("CARGO_PKG_VERSION"),
        db_path: state.store.db_path().to_string_lossy().into(),
        paused: state.is_paused(),
    }
}

#[tauri::command]
fn set_paused(paused: bool, state: State<'_, AppState>) {
    state.set_paused(paused);
}

#[tauri::command]
fn check_permissions() -> PermissionStatus {
    PermissionStatus {
        accessibility: permissions::accessibility_granted(),
    }
}

#[tauri::command]
fn get_today_stats(state: State<'_, AppState>) -> Result<DayStats, String> {
    let conn = state.store.reader().map_err(map_err)?;
    day_stats(&conn, &today()).map_err(map_err)
}

#[tauri::command]
fn get_day_stats(day: String, state: State<'_, AppState>) -> Result<DayStats, String> {
    let conn = state.store.reader().map_err(map_err)?;
    day_stats(&conn, &day).map_err(map_err)
}

#[tauri::command]
fn get_range_stats(
    from: String,
    to: String,
    state: State<'_, AppState>,
) -> Result<RangeStats, String> {
    let conn = state.store.reader().map_err(map_err)?;
    range_stats(&conn, &from, &to).map_err(map_err)
}

#[tauri::command]
fn get_top_keys(
    from: String,
    to: String,
    limit: i64,
    state: State<'_, AppState>,
) -> Result<Vec<TopKey>, String> {
    let conn = state.store.reader().map_err(map_err)?;
    top_keys(&conn, &from, &to, limit).map_err(map_err)
}

#[tauri::command]
fn get_live(state: State<'_, AppState>) -> Result<LiveSnapshot, String> {
    let conn = state.store.reader().map_err(map_err)?;
    live_snapshot(&conn).map_err(map_err)
}

#[tauri::command]
fn get_streak(state: State<'_, AppState>) -> Result<i64, String> {
    let conn = state.store.reader().map_err(map_err)?;
    streak_days(&conn).map_err(map_err)
}

#[tauri::command]
fn get_today_hourly(state: State<'_, AppState>) -> Result<Vec<i64>, String> {
    let conn = state.store.reader().map_err(map_err)?;
    today_hourly(&conn).map_err(map_err)
}

#[tauri::command]
fn get_punch_card(state: State<'_, AppState>) -> Result<Vec<Vec<i64>>, String> {
    let conn = state.store.reader().map_err(map_err)?;
    punch_card_30d(&conn).map_err(map_err)
}

#[tauri::command]
fn get_lifetime_total(state: State<'_, AppState>) -> Result<i64, String> {
    let conn = state.store.reader().map_err(map_err)?;
    lifetime_total(&conn).map_err(map_err)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _ = env_logger::try_init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .setup(|app| {
            let data_dir = app
                .path()
                .app_data_dir()
                .expect("app_data_dir unavailable");
            std::fs::create_dir_all(&data_dir).ok();
            let db_path = data_dir.join("keycounter.db");

            let store = Store::open(&db_path).expect("failed to open SQLite store");
            let app_state = AppState::new(store.clone());

            // Hook -> store via channel.
            let (tx, rx) = mpsc::channel();
            store.spawn_writer(rx);
            hook::spawn(tx, app_state.paused.clone(), app_state.live_counter.clone());

            // Live emitter thread: every 200 ms read the live counter delta and
            // push a `live-pulse` event to the frontend. Used for ripple/pulse
            // animations; numerical KPM still polls get_live() for accuracy.
            let app_handle = app.handle().clone();
            let live_counter = app_state.live_counter.clone();
            thread::Builder::new()
                .name("kc-emit".into())
                .spawn(move || {
                    let mut last: i64 = 0;
                    loop {
                        thread::sleep(Duration::from_millis(200));
                        let now = live_counter.load(Ordering::Relaxed);
                        let delta = now - last;
                        if delta > 0 {
                            last = now;
                            let _ = app_handle.emit(
                                "live-pulse",
                                LivePulse { delta, total: now },
                            );
                        }
                    }
                })
                .expect("failed to spawn emit thread");

            // Tray icon + menu.
            let show = MenuItem::with_id(app, "show", "Show KeyCounter", true, None::<&str>)?;
            let pause = MenuItem::with_id(app, "pause", "Pause / Resume", true, None::<&str>)?;
            let sep = PredefinedMenuItem::separator(app)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &pause, &sep, &quit])?;

            let _tray = TrayIconBuilder::with_id("kc-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("KeyCounter")
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    "pause" => {
                        let s = app.state::<AppState>();
                        let next = !s.is_paused();
                        s.set_paused(next);
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .build(app)?;

            app.manage(app_state);
            log::info!("KeyCounter started; db at {}", db_path.display());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            app_info,
            set_paused,
            check_permissions,
            get_today_stats,
            get_day_stats,
            get_range_stats,
            get_top_keys,
            get_live,
            get_streak,
            get_today_hourly,
            get_punch_card,
            get_lifetime_total,
        ])
        .run(tauri::generate_context!())
        .expect("error while running KeyCounter");
}
