import { KC, type KeyCode } from "@/lib/keycode";

export interface KeyDef {
  code: KeyCode | KeyCode[]; // grouped (e.g. left+right Shift share a slot? No — separate keys)
  label: string;
  width?: number; // multiples of 1u; default 1
}

// 60% ANSI layout, 5 rows. Sums per row = 15u.
export const KEYBOARD_60: KeyDef[][] = [
  [
    { code: KC.BackQuote, label: "`" },
    { code: KC.Num1, label: "1" },
    { code: KC.Num2, label: "2" },
    { code: KC.Num3, label: "3" },
    { code: KC.Num4, label: "4" },
    { code: KC.Num5, label: "5" },
    { code: KC.Num6, label: "6" },
    { code: KC.Num7, label: "7" },
    { code: KC.Num8, label: "8" },
    { code: KC.Num9, label: "9" },
    { code: KC.Num0, label: "0" },
    { code: KC.Minus, label: "-" },
    { code: KC.Equal, label: "=" },
    { code: KC.Backspace, label: "⌫", width: 2 },
  ],
  [
    { code: KC.Tab, label: "Tab", width: 1.5 },
    { code: KC.Q, label: "Q" },
    { code: KC.W, label: "W" },
    { code: KC.E, label: "E" },
    { code: KC.R, label: "R" },
    { code: KC.T, label: "T" },
    { code: KC.Y, label: "Y" },
    { code: KC.U, label: "U" },
    { code: KC.I, label: "I" },
    { code: KC.O, label: "O" },
    { code: KC.P, label: "P" },
    { code: KC.LeftBracket, label: "[" },
    { code: KC.RightBracket, label: "]" },
    { code: KC.BackSlash, label: "\\", width: 1.5 },
  ],
  [
    { code: KC.CapsLock, label: "Caps", width: 1.75 },
    { code: KC.A, label: "A" },
    { code: KC.S, label: "S" },
    { code: KC.D, label: "D" },
    { code: KC.F, label: "F" },
    { code: KC.G, label: "G" },
    { code: KC.H, label: "H" },
    { code: KC.J, label: "J" },
    { code: KC.K, label: "K" },
    { code: KC.L, label: "L" },
    { code: KC.Semicolon, label: ";" },
    { code: KC.Quote, label: "'" },
    { code: KC.Return, label: "Enter", width: 2.25 },
  ],
  [
    { code: KC.ShiftLeft, label: "⇧", width: 2.25 },
    { code: KC.Z, label: "Z" },
    { code: KC.X, label: "X" },
    { code: KC.C, label: "C" },
    { code: KC.V, label: "V" },
    { code: KC.B, label: "B" },
    { code: KC.N, label: "N" },
    { code: KC.M, label: "M" },
    { code: KC.Comma, label: "," },
    { code: KC.Dot, label: "." },
    { code: KC.Slash, label: "/" },
    { code: KC.ShiftRight, label: "⇧", width: 2.75 },
  ],
  [
    { code: KC.ControlLeft, label: "Ctrl", width: 1.25 },
    { code: KC.MetaLeft, label: "⌘", width: 1.25 },
    { code: KC.AltLeft, label: "Alt", width: 1.25 },
    { code: KC.Space, label: "", width: 6.25 },
    { code: KC.AltRight, label: "Alt", width: 1.25 },
    { code: KC.MetaRight, label: "⌘", width: 1.25 },
    { code: KC.ControlRight, label: "Ctrl", width: 1.5 },
  ],
];
