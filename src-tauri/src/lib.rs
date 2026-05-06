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
    image::Image,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    Emitter, LogicalPosition, Manager, State,
};

const TRAY_IDLE: &[u8] = include_bytes!("../icons/tray-idle.png");
const TRAY_PULSE_A: &[u8] = include_bytes!("../icons/tray-pulse-a.png");
const TRAY_PULSE_B: &[u8] = include_bytes!("../icons/tray-pulse-b.png");

use crate::state::AppState;
use crate::store::{
    calendar, day_stats, export_json, lifetime_total, live_snapshot, punch_card_30d, range_stats,
    reset_all, streak_days, today, today_hourly, top_keys, DayStats, DayTotal, LiveSnapshot,
    RangeStats, Store, TopKey,
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

#[tauri::command]
fn get_calendar(days: i64, state: State<'_, AppState>) -> Result<Vec<DayTotal>, String> {
    let conn = state.store.reader().map_err(map_err)?;
    calendar(&conn, days).map_err(map_err)
}

#[tauri::command]
fn reset_database(state: State<'_, AppState>) -> Result<(), String> {
    let mut conn = rusqlite::Connection::open(state.store.db_path()).map_err(map_err)?;
    reset_all(&mut conn).map_err(map_err)
}

#[tauri::command]
fn export_data(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let conn = state.store.reader().map_err(map_err)?;
    export_json(&conn).map_err(map_err)
}

#[tauri::command]
fn open_widget(app: tauri::AppHandle) -> Result<(), String> {
    // The widget window is declared in tauri.conf.json with visible: false,
    // so it's already created and validated at startup. We just toggle
    // visibility — far more reliable than building a window dynamically.
    let w = app
        .get_webview_window("widget")
        .ok_or_else(|| "widget window not found".to_string())?;
    w.show().map_err(|e| e.to_string())?;
    w.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn snap_widget_to_taskbar(app: tauri::AppHandle) -> Result<(), String> {
    let widget = app
        .get_webview_window("widget")
        .ok_or_else(|| "widget window not found".to_string())?;

    // Use the monitor that currently contains the widget (or primary as
    // fallback). If we can't get a monitor we fail silently — better than
    // moving the widget off-screen.
    let monitor = widget
        .current_monitor()
        .map_err(|e| e.to_string())?
        .or_else(|| app.primary_monitor().ok().flatten())
        .ok_or_else(|| "no monitor available".to_string())?;

    let scale = monitor.scale_factor();
    let m_size = monitor.size();
    let m_pos = monitor.position();
    let widget_size = widget.outer_size().map_err(|e| e.to_string())?;

    // Convert physical coords to logical (DPI-aware). LogicalPosition::set
    // takes f64, lets the OS handle DPI scaling.
    let screen_w = m_size.width as f64 / scale;
    let screen_h = m_size.height as f64 / scale;
    let screen_x = m_pos.x as f64 / scale;
    let screen_y = m_pos.y as f64 / scale;
    let ww = widget_size.width as f64 / scale;
    let wh = widget_size.height as f64 / scale;

    // Place above the typical Windows 11 taskbar with a small gap.
    // 48 px is the Win 11 default; users with custom taskbars will see
    // the widget hover slightly higher / lower but still in the
    // bottom-right corner area.
    let taskbar_h: f64 = 48.0;
    let margin_x: f64 = 8.0;
    let margin_y: f64 = 8.0;

    let x = screen_x + screen_w - ww - margin_x;
    let y = screen_y + screen_h - wh - taskbar_h - margin_y;

    widget
        .set_position(LogicalPosition::new(x, y))
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn show_main(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.unminimize();
        let _ = w.set_focus();
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _ = env_logger::try_init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
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

            // Tray icon + menu.
            let show = MenuItem::with_id(app, "show", "Show KeyCounter", true, None::<&str>)?;
            let widget =
                MenuItem::with_id(app, "widget", "Open floating widget", true, None::<&str>)?;
            let pause = MenuItem::with_id(app, "pause", "Pause / Resume", true, None::<&str>)?;
            let sep = PredefinedMenuItem::separator(app)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &widget, &pause, &sep, &quit])?;

            let idle_icon = Image::from_bytes(TRAY_IDLE).expect("decode tray-idle");
            let _tray = TrayIconBuilder::with_id("kc-tray")
                .icon(idle_icon)
                .tooltip("KeyCounter")
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.unminimize();
                            let _ = w.set_focus();
                        }
                    }
                    "widget" => {
                        let _ = open_widget(app.clone());
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

            // Live emitter thread: every 200 ms read the live counter delta and
            // push a `live-pulse` event to the frontend. Also drives the tray
            // icon "breathing" animation while the user is actively typing.
            let app_handle = app.handle().clone();
            let live_counter = app_state.live_counter.clone();
            let pulse_a = Image::from_bytes(TRAY_PULSE_A).expect("decode tray-pulse-a");
            let pulse_b = Image::from_bytes(TRAY_PULSE_B).expect("decode tray-pulse-b");
            let idle = Image::from_bytes(TRAY_IDLE).expect("decode tray-idle");
            thread::Builder::new()
                .name("kc-emit".into())
                .spawn(move || {
                    let mut last: i64 = 0;
                    let mut idle_ticks: u32 = 0;
                    let mut pulse_phase: u32 = 0;
                    loop {
                        thread::sleep(Duration::from_millis(200));
                        let now = live_counter.load(Ordering::Relaxed);
                        let delta = now - last;
                        if delta > 0 {
                            last = now;
                            idle_ticks = 0;
                            pulse_phase = pulse_phase.wrapping_add(1);
                            let _ = app_handle
                                .emit("live-pulse", LivePulse { delta, total: now });
                        } else {
                            idle_ticks = idle_ticks.saturating_add(1);
                        }

                        // Tray icon: alternate between two pulse frames while
                        // typing, snap to the dim "idle" frame after ~1 second
                        // of inactivity.
                        if let Some(tray) =
                            app_handle.tray_by_id("kc-tray")
                        {
                            let frame = if idle_ticks > 5 {
                                &idle
                            } else if pulse_phase % 2 == 0 {
                                &pulse_a
                            } else {
                                &pulse_b
                            };
                            let _ = tray.set_icon(Some(frame.clone()));
                        }
                    }
                })
                .expect("failed to spawn emit thread");

            // Hide-on-close for both windows. Without this, clicking the
            // OS close button on the main window destroys it; subsequent
            // "Show KeyCounter" from the tray finds no window and is a
            // silent no-op. With this, windows go to the tray on close
            // and re-show reliably. Quit happens via the tray "Quit"
            // item which calls app.exit() and bypasses window events.
            for label in ["main", "widget"] {
                if let Some(w) = app.get_webview_window(label) {
                    let w_clone = w.clone();
                    w.on_window_event(move |event| {
                        if let tauri::WindowEvent::CloseRequested { api, .. } =
                            event
                        {
                            api.prevent_close();
                            let _ = w_clone.hide();
                        }
                    });
                }
            }

            // Explicitly hide the widget window after setup. The
            // `visible: false` in tauri.conf.json is sometimes ignored
            // on Windows once the webview finishes loading and
            // auto-shows the window. This is the only fully reliable
            // way to keep the widget tucked away until the user asks
            // for it via the sidebar / tray.
            if let Some(widget) = app.get_webview_window("widget") {
                let _ = widget.hide();
            }

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
            get_calendar,
            reset_database,
            export_data,
            open_widget,
            show_main,
            snap_widget_to_taskbar,
        ])
        .run(tauri::generate_context!())
        .expect("error while running KeyCounter");
}
