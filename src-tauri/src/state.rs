use std::sync::atomic::{AtomicBool, AtomicI64, Ordering};
use std::sync::Arc;

use crate::store::Store;

pub struct AppState {
    pub store: Store,
    pub paused: Arc<AtomicBool>,
    /// Lifetime-of-process counter, bumped from the hook callback. Used by
    /// the emitter thread to derive a tick rate without hitting the database.
    pub live_counter: Arc<AtomicI64>,
}

impl AppState {
    pub fn new(store: Store) -> Self {
        Self {
            store,
            paused: Arc::new(AtomicBool::new(false)),
            live_counter: Arc::new(AtomicI64::new(0)),
        }
    }

    pub fn is_paused(&self) -> bool {
        self.paused.load(Ordering::Relaxed)
    }

    pub fn set_paused(&self, v: bool) {
        self.paused.store(v, Ordering::Relaxed);
    }
}
