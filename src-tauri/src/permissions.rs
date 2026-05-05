//! Per-OS check whether we have the OS permission required for global key
//! capture. On Windows/Linux this is always true; on macOS we ask the
//! Accessibility framework.

#[cfg(target_os = "macos")]
mod inner {
    #[link(name = "ApplicationServices", kind = "framework")]
    extern "C" {
        fn AXIsProcessTrusted() -> bool;
    }
    pub fn accessibility_granted() -> bool {
        // SAFETY: AXIsProcessTrusted is a thread-safe read with no preconditions.
        unsafe { AXIsProcessTrusted() }
    }
}

#[cfg(not(target_os = "macos"))]
mod inner {
    pub fn accessibility_granted() -> bool {
        true
    }
}

pub use inner::accessibility_granted;
