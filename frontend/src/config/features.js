// Switches for the site. Edit and save; the page reloads by itself.

// Picture behind the whole site. Put the file in frontend/public. null = no picture.
export const PAGE_BACKGROUND = "/background.png";
export const PAGE_SCRIM = 0.88; // 0 = picture at full strength, 1 = hidden. Raise it if text is hard to read.

// Behind each team's countdown: the visitor's own picture, else this file (null = plain dark panel).
export const HERO_DEFAULT_IMAGE = null;
export const HERO_SCRIM = 0.55;

// Where player and match links search: "google" or "youtube".
export const SEARCH_PROVIDER = "google";

// The AI assistant is a paid feature. false hides every "Ask" button and the chat panel.
export const ASSISTANT_ENABLED = false;
