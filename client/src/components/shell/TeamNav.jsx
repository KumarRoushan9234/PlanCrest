import { Link, useLocation } from "react-router-dom";
import { TEAM_TABS } from "./navConfig";

/** Switcher shared by the four Team views. */
export default function TeamNav() {
  const { pathname } = useLocation();
  return (
    <div className="pc-tabs" role="tablist" aria-label="Team">
      {TEAM_TABS.map((t) => (
        <Link key={t.to} to={t.to} role="tab" aria-selected={pathname === t.to} className={pathname === t.to ? "on" : ""}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}
