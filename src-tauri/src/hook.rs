//! Global keyboard hook.
//!
//! Spawns a dedicated OS thread that runs `rdev::listen`. The callback does
//! the bare minimum: timestamp + map to our stable [`KeyCode`] + push onto an
//! unbounded channel. All persistence happens on the [store thread](crate::store).

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::Sender;
use std::sync::Arc;
use std::thread;

use chrono::Utc;
use rdev::{listen, Event, EventType};

use crate::keycode::KeyCode;

/// One key-press event handed to the store thread.
#[derive(Debug, Clone, Copy)]
pub struct KeyEvent {
    /// Unix epoch milliseconds of the key press.
    pub timestamp_ms: i64,
    pub code: KeyCode,
}

/// Spawns the listener. Returns immediately; the thread runs forever.
///
/// `paused` lets the UI silently drop events without uninstalling the hook
/// (cheap toggle, no permission re-prompt on macOS).
pub fn spawn(tx: Sender<KeyEvent>, paused: Arc<AtomicBool>) {
    thread::Builder::new()
        .name("kc-hook".into())
        .spawn(move || {
            let callback = move |event: Event| {
                if paused.load(Ordering::Relaxed) {
                    return;
                }
                if let EventType::KeyPress(key) = event.event_type {
                    let code = KeyCode::from_rdev(key);
                    let ev = KeyEvent {
                        timestamp_ms: Utc::now().timestamp_millis(),
                        code,
                    };
                    // If the receiver is gone the app is shutting down; stop trying.
                    let _ = tx.send(ev);
                }
            };

            if let Err(e) = listen(callback) {
                log::error!("rdev listen error: {:?}", e);
            }
        })
        .expect("failed to spawn keyboard hook thread");
}
