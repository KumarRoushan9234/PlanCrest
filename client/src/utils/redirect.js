const KEY = "pc:next";

/** Remember where to send the user once they've signed in (e.g. an invite link). */
export const rememberNext = (path) => {
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    // storage unavailable: fall back to the dashboard
  }
};

/** The remembered path (only same-site paths), or the dashboard. Clears it. */
export const takeNext = () => {
  try {
    const next = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  } catch {
    // ignore
  }
  return "/dashboard";
};
