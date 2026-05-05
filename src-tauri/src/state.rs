use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use crate::store::Store;

pub struct AppState {
    pub store: Store,
    pub paused: Arc<AtomicBool>,
}

impl AppState {
    pub fn new(store: Store) -> Self {
        Self {
            store,
            paused: Arc::new(AtomicBool::new(false)),
        }
    }

    pub fn is_paused(&self) -> bool {
        self.paused.load(Ordering::Relaxed)
    }

    pub fn set_paused(&self, v: bool) {
        self.paused.store(v, Ordering::Relaxed);
    }
}
