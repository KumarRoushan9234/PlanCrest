// Light/dark theme: "system" follows the OS, "light"/"dark" are explicit.
const KEY = "pc:theme";
const listeners = new Set();

export const getThemePreference = () => {
  try {
    return localStorage.getItem(KEY) || "system";
  } catch {
    return "system";
  }
};

const systemTheme = () => (window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark");

export const resolveTheme = (pref = getThemePreference()) => (pref === "system" ? systemTheme() : pref);

export const applyTheme = (pref = getThemePreference()) => {
  document.documentElement.dataset.theme = resolveTheme(pref);
};

export const setThemePreference = (pref) => {
  try {
    localStorage.setItem(KEY, pref);
  } catch {
    /* storage unavailable: the choice just won't persist */
  }
  applyTheme(pref);
  listeners.forEach((fn) => fn(pref));
};

export const subscribeTheme = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

// Keep "system" in sync when the OS theme changes
if (typeof window !== "undefined") {
  window.matchMedia?.("(prefers-color-scheme: light)").addEventListener?.("change", () => {
    if (getThemePreference() === "system") applyTheme("system");
  });
}
