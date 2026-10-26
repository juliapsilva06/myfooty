import { storage } from "./storage.js";

// Ten bright presets. New followed teams get these in order, so two teams never start with the same color.
export const ACCENT_PRESETS = [
  { name: "Blue", hex: "#1018b0" },
  { name: "Scarlet", hex: "#FF3B3B" },
  { name: "Amber", hex: "#FFC21A" },
  { name: "Emerald", hex: "#19C37D" },
  { name: "Magenta", hex: "#FF3DA5" },
  { name: "Tangerine", hex: "#FF7A1A" },
  { name: "Royal", hex: "#4A63FF" },
  { name: "Teal", hex: "#14C8C8" },
  { name: "Violet", hex: "#8B5CFF" },
  { name: "Chalk white", hex: "#F2F6F1" },
];

const HEX = /^#[0-9a-f]{6}$/i;

export function defaultAccent(index) {
  return ACCENT_PRESETS[index % ACCENT_PRESETS.length].hex;
}

// Phase C adds the picker that writes this key; Phase A only reads it.
export function storedAccent(teamId) {
  const value = storage.get(`accent:${teamId}`);
  return value && HEX.test(value) ? value : null;
}
