// Mirror of src-tauri/src/keycode.rs — keep in sync.

export const KC = {
  A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17, I: 18,
  J: 19, K: 20, L: 21, M: 22, N: 23, O: 24, P: 25, Q: 26, R: 27,
  S: 28, T: 29, U: 30, V: 31, W: 32, X: 33, Y: 34, Z: 35,
  Num0: 40, Num1: 41, Num2: 42, Num3: 43, Num4: 44,
  Num5: 45, Num6: 46, Num7: 47, Num8: 48, Num9: 49,
  F1: 50, F2: 51, F3: 52, F4: 53, F5: 54, F6: 55,
  F7: 56, F8: 57, F9: 58, F10: 59, F11: 60, F12: 61,
  ShiftLeft: 80, ShiftRight: 81, ControlLeft: 82, ControlRight: 83,
  AltLeft: 84, AltRight: 85, MetaLeft: 86, MetaRight: 87,
  CapsLock: 88, FunctionKey: 89,
  Up: 90, Down: 91, Left: 92, Right: 93, Home: 94, End: 95,
  PageUp: 96, PageDown: 97, Insert: 98, Delete: 99,
  Backspace: 100, Tab: 101, Return: 102, Space: 103, Escape: 104,
  BackQuote: 110, Minus: 111, Equal: 112,
  LeftBracket: 113, RightBracket: 114, BackSlash: 115,
  Semicolon: 116, Quote: 117, Comma: 118, Dot: 119, Slash: 120,
  IntlBackslash: 121, IntlRo: 122,
  Kp0: 130, Kp1: 131, Kp2: 132, Kp3: 133, Kp4: 134,
  Kp5: 135, Kp6: 136, Kp7: 137, Kp8: 138, Kp9: 139,
  KpMinus: 140, KpPlus: 141, KpMultiply: 142, KpDivide: 143,
  KpReturn: 144, KpDelete: 145,
  PrintScreen: 150, ScrollLock: 151, Pause: 152, NumLock: 153,
  Other: 999,
} as const;

export type KeyCode = (typeof KC)[keyof typeof KC];

const LABELS: Record<number, string> = {
  [KC.A]: "A", [KC.B]: "B", [KC.C]: "C", [KC.D]: "D", [KC.E]: "E",
  [KC.F]: "F", [KC.G]: "G", [KC.H]: "H", [KC.I]: "I", [KC.J]: "J",
  [KC.K]: "K", [KC.L]: "L", [KC.M]: "M", [KC.N]: "N", [KC.O]: "O",
  [KC.P]: "P", [KC.Q]: "Q", [KC.R]: "R", [KC.S]: "S", [KC.T]: "T",
  [KC.U]: "U", [KC.V]: "V", [KC.W]: "W", [KC.X]: "X", [KC.Y]: "Y",
  [KC.Z]: "Z",
  [KC.Num0]: "0", [KC.Num1]: "1", [KC.Num2]: "2", [KC.Num3]: "3", [KC.Num4]: "4",
  [KC.Num5]: "5", [KC.Num6]: "6", [KC.Num7]: "7", [KC.Num8]: "8", [KC.Num9]: "9",
  [KC.F1]: "F1", [KC.F2]: "F2", [KC.F3]: "F3", [KC.F4]: "F4", [KC.F5]: "F5",
  [KC.F6]: "F6", [KC.F7]: "F7", [KC.F8]: "F8", [KC.F9]: "F9", [KC.F10]: "F10",
  [KC.F11]: "F11", [KC.F12]: "F12",
  [KC.ShiftLeft]: "Shift", [KC.ShiftRight]: "Shift",
  [KC.ControlLeft]: "Ctrl", [KC.ControlRight]: "Ctrl",
  [KC.AltLeft]: "Alt", [KC.AltRight]: "Alt",
  [KC.MetaLeft]: "Win", [KC.MetaRight]: "Win",
  [KC.CapsLock]: "Caps", [KC.FunctionKey]: "Fn",
  [KC.Up]: "↑", [KC.Down]: "↓", [KC.Left]: "←", [KC.Right]: "→",
  [KC.Home]: "Home", [KC.End]: "End",
  [KC.PageUp]: "PgUp", [KC.PageDown]: "PgDn",
  [KC.Insert]: "Ins", [KC.Delete]: "Del",
  [KC.Backspace]: "Backspace", [KC.Tab]: "Tab", [KC.Return]: "Enter",
  [KC.Space]: "Space", [KC.Escape]: "Esc",
  [KC.BackQuote]: "`", [KC.Minus]: "-", [KC.Equal]: "=",
  [KC.LeftBracket]: "[", [KC.RightBracket]: "]", [KC.BackSlash]: "\\",
  [KC.Semicolon]: ";", [KC.Quote]: "'", [KC.Comma]: ",", [KC.Dot]: ".",
  [KC.Slash]: "/", [KC.IntlBackslash]: "<>", [KC.IntlRo]: "ろ",
};

export function keyLabel(code: number): string {
  return LABELS[code] ?? `0x${code.toString(16)}`;
}
