// Standard touch-typing finger assignment. Index 0..9, left-to-right:
// 0=L pinky, 1=L ring, 2=L middle, 3=L index, 4=L thumb,
// 5=R thumb, 6=R index, 7=R middle, 8=R ring, 9=R pinky.

import { KC } from "@/lib/keycode";

export const FINGER_NAMES = [
  "L pinky", "L ring", "L middle", "L index", "L thumb",
  "R thumb", "R index", "R middle", "R ring", "R pinky",
] as const;

const M = new Map<number, number>();

// Left pinky: ` 1 q a z + Tab Caps Shift Ctrl
[KC.BackQuote, KC.Num1, KC.Q, KC.A, KC.Z,
 KC.Tab, KC.CapsLock, KC.ShiftLeft, KC.ControlLeft, KC.Escape]
  .forEach((k) => M.set(k, 0));

// Left ring: 2 w s x
[KC.Num2, KC.W, KC.S, KC.X].forEach((k) => M.set(k, 1));

// Left middle: 3 e d c
[KC.Num3, KC.E, KC.D, KC.C].forEach((k) => M.set(k, 2));

// Left index: 4 5 r t f g v b
[KC.Num4, KC.Num5, KC.R, KC.T, KC.F, KC.G, KC.V, KC.B,
 KC.AltLeft, KC.MetaLeft].forEach((k) => M.set(k, 3));

// Thumbs (space): split — count both sides equally
M.set(KC.Space, 4); // counted as left thumb in v1; could split

// Right index: 6 7 y u h j n m
[KC.Num6, KC.Num7, KC.Y, KC.U, KC.H, KC.J, KC.N, KC.M,
 KC.AltRight, KC.MetaRight].forEach((k) => M.set(k, 6));

// Right middle: 8 i k ,
[KC.Num8, KC.I, KC.K, KC.Comma].forEach((k) => M.set(k, 7));

// Right ring: 9 o l .
[KC.Num9, KC.O, KC.L, KC.Dot].forEach((k) => M.set(k, 8));

// Right pinky: 0 - = p [ ] \ ; ' / Enter Backspace ShiftRight CtrlRight
[KC.Num0, KC.Minus, KC.Equal, KC.P, KC.LeftBracket, KC.RightBracket,
 KC.BackSlash, KC.Semicolon, KC.Quote, KC.Slash,
 KC.Return, KC.Backspace, KC.ShiftRight, KC.ControlRight].forEach((k) =>
  M.set(k, 9),
);

export function fingerOf(code: number): number | null {
  const f = M.get(code);
  return f === undefined ? null : f;
}

export function fingerLoad(
  counts: { code: number; count: number }[],
): number[] {
  const load = new Array(10).fill(0);
  for (const k of counts) {
    const f = fingerOf(k.code);
    if (f !== null) load[f] += k.count;
  }
  return load;
}
