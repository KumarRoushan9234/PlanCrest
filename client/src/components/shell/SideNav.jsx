import { Link, useLocation } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useChat } from "../../contexts/ChatContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { cn } from "../ui";
import { NAV, isActive } from "./navConfig";

export default function SideNav({ open, onNavigate, onInvite }) {
  const { pathname } = useLocation();
  const { totalUnreadCount } = useChat();
  const { currentWorkspace, workspaceMembers } = useWorkspace();

  return (
    <nav className={cn("pc-side", open && "open")} aria-label="Main">
      {NAV.map((section) => (
        <div key={section.label} className="pc-navsec">
          <div className="pc-navlabel">{section.label}</div>
          {section.items.map((item) => {
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
        </div>
      ))}

      {currentWorkspace && (
        <div className="pc-side-foot">
          <div className="pc-sidecard">
            <div>
              <b>{currentWorkspace.name}</b>
              <div className="pc-dim" style={{ fontSize: 11.5 }}>
                {workspaceMembers.length || 1} {workspaceMembers.length === 1 ? "member" : "members"}
              </div>
            </div>
            <button className="pc-btn sm" onClick={onInvite}>
              <UserPlus size={13} />
              Invite teammates
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
