import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { getThemePreference, resolveTheme, setThemePreference, subscribeTheme } from "../../utils/theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => resolveTheme());

  useEffect(() => subscribeTheme((pref) => setTheme(resolveTheme(pref))), []);

  const toggle = () => setThemePreference(resolveTheme(getThemePreference()) === "dark" ? "light" : "dark");

  return (
    <button className="pc-iconbtn" onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
