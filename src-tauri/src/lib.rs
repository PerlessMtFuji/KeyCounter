mod hook;
mod keycode;
mod state;
mod store;

use std::sync::mpsc;

use serde::Serialize;
use tauri::{Manager, State};

use crate::state::AppState;
use crate::store::{
    day_stats, live_snapshot, range_stats, streak_days, today, top_keys, DayStats, LiveSnapshot,
    RangeStats, Store, TopKey,
};

#[derive(Serialize)]
struct AppInfo {
    name: &'static str,
    version: &'static str,
    db_path: String,
    paused: bool,
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _ = env_logger::try_init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Resolve a writable per-user data dir for the SQLite database.
            let data_dir = app
                .path()
                .app_data_dir()
                .expect("app_data_dir unavailable");
            std::fs::create_dir_all(&data_dir).ok();
            let db_path = data_dir.join("keycounter.db");

            let store = Store::open(&db_path).expect("failed to open SQLite store");
            let app_state = AppState::new(store.clone());

            // Wire hook -> store via an MPSC channel.
            let (tx, rx) = mpsc::channel();
            store.spawn_writer(rx);
            hook::spawn(tx, app_state.paused.clone());

            app.manage(app_state);
            log::info!("KeyCounter started; db at {}", db_path.display());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            app_info,
            set_paused,
            get_today_stats,
            get_day_stats,
            get_range_stats,
            get_top_keys,
            get_live,
            get_streak,
        ])
        .run(tauri::generate_context!())
        .expect("error while running KeyCounter");
}
