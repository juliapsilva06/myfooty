// Safe wrapper around localStorage. Settings (theme, saved teams, team pictures) live in the visitor's browser.
// If storage is blocked (private mode, full disk), everything still works, it just isn't remembered.
// set() returns true when the value was saved and false when it wasn't.
export const storage = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};
