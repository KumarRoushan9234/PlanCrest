import { Link, useLocation } from "react-router-dom";
import { useChat } from "../../contexts/ChatContext";
import { cn } from "../ui";
import { NAV, isActive } from "./navConfig";

export default function SideNav({ open, onNavigate }) {
  const { pathname } = useLocation();
  const { totalUnreadCount } = useChat();

  return (
    <nav className={cn("pc-side", open && "open")} aria-label="Main">
      {NAV.map((item) => {
        const active = isActive(item, pathname);
        const Icon = item.icon;
        const badge = item.badge === "chat" && totalUnreadCount > 0 ? (totalUnreadCount > 99 ? "99+" : totalUnreadCount) : null;
        return (
          <Link key={item.to} to={item.to} className={cn("pc-navitem", active && "active")} aria-current={active ? "page" : undefined} onClick={onNavigate}>
            <Icon size={15} />
            {item.label}
            {badge && <span className="badge">{badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
