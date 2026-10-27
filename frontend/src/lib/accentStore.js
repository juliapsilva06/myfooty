import { storage } from "./storage.js";

const HEX = /^#[0-9a-f]{6}$/i;

// A visitor's chosen color for one team, kept in their browser.
// (Reading lives in accents.js as storedAccent; this file writes.)
export function saveAccent(teamId, hex) {
  return HEX.test(hex) && storage.set(`accent:${teamId}`, hex.toUpperCase());
}

export function clearAccent(teamId) {
  storage.remove(`accent:${teamId}`);
}
