// Physical-remap layouts: keys stay where they are physically, only the
// printed label changes. This matches what users actually see when they
// switch layouts in the OS.

import { KC } from "@/lib/keycode";

export type LayoutId = "qwerty" | "qwertz" | "dvorak" | "colemak";

export const LAYOUT_NAMES: Record<LayoutId, string> = {
  qwerty: "QWERTY",
  qwertz: "QWERTZ (DE)",
  dvorak: "Dvorak",
  colemak: "Colemak",
};

// Override map: physical KC.X → printed glyph for non-QWERTY layouts.
// Anything not in the map falls back to QWERTY label from `keycode.ts`.
const QWERTZ: Record<number, string> = {
  [KC.Y]: "Z",
  [KC.Z]: "Y",
};

const DVORAK: Record<number, string> = {
  [KC.Q]: "'", [KC.W]: ",", [KC.E]: ".", [KC.R]: "P", [KC.T]: "Y",
  [KC.Y]: "F", [KC.U]: "G", [KC.I]: "C", [KC.O]: "R", [KC.P]: "L",
  [KC.LeftBracket]: "/", [KC.RightBracket]: "=",
  [KC.A]: "A", [KC.S]: "O", [KC.D]: "E", [KC.F]: "U", [KC.G]: "I",
  [KC.H]: "D", [KC.J]: "H", [KC.K]: "T", [KC.L]: "N",
  [KC.Semicolon]: "S", [KC.Quote]: "-",
  [KC.Z]: ";", [KC.X]: "Q", [KC.C]: "J", [KC.V]: "K", [KC.B]: "X",
  [KC.N]: "B", [KC.M]: "M",
  [KC.Comma]: "W", [KC.Dot]: "V", [KC.Slash]: "Z",
};

const COLEMAK: Record<number, string> = {
  [KC.Q]: "Q", [KC.W]: "W", [KC.E]: "F", [KC.R]: "P", [KC.T]: "G",
  [KC.Y]: "J", [KC.U]: "L", [KC.I]: "U", [KC.O]: "Y",
  [KC.P]: ";",
  [KC.A]: "A", [KC.S]: "R", [KC.D]: "S", [KC.F]: "T", [KC.G]: "D",
  [KC.H]: "H", [KC.J]: "N", [KC.K]: "E", [KC.L]: "I",
  [KC.Semicolon]: "O",
};

export const LAYOUT_OVERRIDES: Record<LayoutId, Record<number, string>> = {
  qwerty: {},
  qwertz: QWERTZ,
  dvorak: DVORAK,
  colemak: COLEMAK,
};
