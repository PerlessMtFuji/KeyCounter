//! Stable, platform-independent key codes.
//!
//! Why a custom enum instead of `rdev::Key as i32`?
//! The `rdev::Key` discriminants are not part of its public API and may change
//! between releases. Persisting them would tie our database file format to a
//! specific `rdev` version. This enum gives us a stable wire format: the i32
//! values written today will mean the same thing in five years.

use rdev::Key;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[repr(i32)]
pub enum KeyCode {
    // Letters: 10..=35
    A = 10,
    B = 11,
    C = 12,
    D = 13,
    E = 14,
    F = 15,
    G = 16,
    H = 17,
    I = 18,
    J = 19,
    K = 20,
    L = 21,
    M = 22,
    N = 23,
    O = 24,
    P = 25,
    Q = 26,
    R = 27,
    S = 28,
    T = 29,
    U = 30,
    V = 31,
    W = 32,
    X = 33,
    Y = 34,
    Z = 35,

    // Top-row digits: 40..=49
    Num0 = 40,
    Num1 = 41,
    Num2 = 42,
    Num3 = 43,
    Num4 = 44,
    Num5 = 45,
    Num6 = 46,
    Num7 = 47,
    Num8 = 48,
    Num9 = 49,

    // Function keys: 50..=61
    F1 = 50,
    F2 = 51,
    F3 = 52,
    F4 = 53,
    F5 = 54,
    F6 = 55,
    F7 = 56,
    F8 = 57,
    F9 = 58,
    F10 = 59,
    F11 = 60,
    F12 = 61,

    // Modifiers: 80..=89
    ShiftLeft = 80,
    ShiftRight = 81,
    ControlLeft = 82,
    ControlRight = 83,
    AltLeft = 84,
    AltRight = 85,
    MetaLeft = 86,
    MetaRight = 87,
    CapsLock = 88,
    FunctionKey = 89,

    // Navigation: 90..=99
    Up = 90,
    Down = 91,
    Left = 92,
    Right = 93,
    Home = 94,
    End = 95,
    PageUp = 96,
    PageDown = 97,
    Insert = 98,
    Delete = 99,

    // Editing & whitespace: 100..=104
    Backspace = 100,
    Tab = 101,
    Return = 102,
    Space = 103,
    Escape = 104,

    // Punctuation: 110..=122
    BackQuote = 110,
    Minus = 111,
    Equal = 112,
    LeftBracket = 113,
    RightBracket = 114,
    BackSlash = 115,
    Semicolon = 116,
    Quote = 117,
    Comma = 118,
    Dot = 119,
    Slash = 120,
    IntlBackslash = 121,
    IntlRo = 122,

    // Numpad: 130..=145
    Kp0 = 130,
    Kp1 = 131,
    Kp2 = 132,
    Kp3 = 133,
    Kp4 = 134,
    Kp5 = 135,
    Kp6 = 136,
    Kp7 = 137,
    Kp8 = 138,
    Kp9 = 139,
    KpMinus = 140,
    KpPlus = 141,
    KpMultiply = 142,
    KpDivide = 143,
    KpReturn = 144,
    KpDelete = 145,

    // System: 150..=153
    PrintScreen = 150,
    ScrollLock = 151,
    Pause = 152,
    NumLock = 153,

    Other = 999,
}

impl KeyCode {
    pub fn from_rdev(key: Key) -> Self {
        use Key::*;
        match key {
            KeyA => Self::A,
            KeyB => Self::B,
            KeyC => Self::C,
            KeyD => Self::D,
            KeyE => Self::E,
            KeyF => Self::F,
            KeyG => Self::G,
            KeyH => Self::H,
            KeyI => Self::I,
            KeyJ => Self::J,
            KeyK => Self::K,
            KeyL => Self::L,
            KeyM => Self::M,
            KeyN => Self::N,
            KeyO => Self::O,
            KeyP => Self::P,
            KeyQ => Self::Q,
            KeyR => Self::R,
            KeyS => Self::S,
            KeyT => Self::T,
            KeyU => Self::U,
            KeyV => Self::V,
            KeyW => Self::W,
            KeyX => Self::X,
            KeyY => Self::Y,
            KeyZ => Self::Z,

            Num0 => Self::Num0,
            Num1 => Self::Num1,
            Num2 => Self::Num2,
            Num3 => Self::Num3,
            Num4 => Self::Num4,
            Num5 => Self::Num5,
            Num6 => Self::Num6,
            Num7 => Self::Num7,
            Num8 => Self::Num8,
            Num9 => Self::Num9,

            F1 => Self::F1,
            F2 => Self::F2,
            F3 => Self::F3,
            F4 => Self::F4,
            F5 => Self::F5,
            F6 => Self::F6,
            F7 => Self::F7,
            F8 => Self::F8,
            F9 => Self::F9,
            F10 => Self::F10,
            F11 => Self::F11,
            F12 => Self::F12,

            ShiftLeft => Self::ShiftLeft,
            ShiftRight => Self::ShiftRight,
            ControlLeft => Self::ControlLeft,
            ControlRight => Self::ControlRight,
            Alt => Self::AltLeft,
            AltGr => Self::AltRight,
            MetaLeft => Self::MetaLeft,
            MetaRight => Self::MetaRight,
            CapsLock => Self::CapsLock,
            Function => Self::FunctionKey,

            UpArrow => Self::Up,
            DownArrow => Self::Down,
            LeftArrow => Self::Left,
            RightArrow => Self::Right,
            Home => Self::Home,
            End => Self::End,
            PageUp => Self::PageUp,
            PageDown => Self::PageDown,
            Insert => Self::Insert,
            Delete => Self::Delete,

            Backspace => Self::Backspace,
            Tab => Self::Tab,
            Return => Self::Return,
            Space => Self::Space,
            Escape => Self::Escape,

            BackQuote => Self::BackQuote,
            Minus => Self::Minus,
            Equal => Self::Equal,
            LeftBracket => Self::LeftBracket,
            RightBracket => Self::RightBracket,
            BackSlash => Self::BackSlash,
            SemiColon => Self::Semicolon,
            Quote => Self::Quote,
            Comma => Self::Comma,
            Dot => Self::Dot,
            Slash => Self::Slash,
            IntlBackslash => Self::IntlBackslash,

            Kp0 => Self::Kp0,
            Kp1 => Self::Kp1,
            Kp2 => Self::Kp2,
            Kp3 => Self::Kp3,
            Kp4 => Self::Kp4,
            Kp5 => Self::Kp5,
            Kp6 => Self::Kp6,
            Kp7 => Self::Kp7,
            Kp8 => Self::Kp8,
            Kp9 => Self::Kp9,
            KpMinus => Self::KpMinus,
            KpPlus => Self::KpPlus,
            KpMultiply => Self::KpMultiply,
            KpDivide => Self::KpDivide,
            KpReturn => Self::KpReturn,
            KpDelete => Self::KpDelete,

            PrintScreen => Self::PrintScreen,
            ScrollLock => Self::ScrollLock,
            Pause => Self::Pause,
            NumLock => Self::NumLock,

            _ => Self::Other,
        }
    }

    #[allow(dead_code)]
    pub fn is_modifier(self) -> bool {
        matches!(
            self,
            Self::ShiftLeft
                | Self::ShiftRight
                | Self::ControlLeft
                | Self::ControlRight
                | Self::AltLeft
                | Self::AltRight
                | Self::MetaLeft
                | Self::MetaRight
                | Self::CapsLock
                | Self::FunctionKey
        )
    }

    pub fn modifier_group(self) -> Option<&'static str> {
        match self {
            Self::ShiftLeft | Self::ShiftRight => Some("shift"),
            Self::ControlLeft | Self::ControlRight => Some("ctrl"),
            Self::AltLeft | Self::AltRight => Some("alt"),
            Self::MetaLeft | Self::MetaRight => Some("meta"),
            _ => None,
        }
    }

    pub fn as_i32(self) -> i32 {
        self as i32
    }
}
