import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, ChevronsUpDown, FolderPlus, CalendarPlus, ListPlus, LogOut, Menu as MenuIcon, Plus, Search, Settings, UserPlus, Users } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { Avatar, Logo, Menu } from "../ui";
import NotificationsMenu from "./NotificationsMenu";
import ThemeToggle from "./ThemeToggle";
import TimerChip from "./TimerChip";

const wsInitial = (name) => (name?.trim()?.[0] || "W").toUpperCase();

export default function TopBar({ onToggleNav, onSearch, onNewProject, onNewEvent, onNewTask, onCreateWorkspace, onInvite, onMembers }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace();
  const [wsOpen, setWsOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const signOut = async () => {
    try {
      await logout();
    } finally {
      navigate("/");
    }
  };

  return (
    <header className="pc-top">
      <div className="pc-brand">
        <button className="pc-iconbtn pc-burger" onClick={onToggleNav} aria-label="Toggle navigation">
          <MenuIcon size={17} />
        </button>
        <Link to="/dashboard" className="pc-logo">
          <Logo size={22} />
          <span>PlanCrest</span>
        </Link>
        <span className="pc-sep">/</span>
        <div className="pc-ws">
          <button onClick={() => setWsOpen((o) => !o)} aria-haspopup="menu" aria-expanded={wsOpen}>
            <span className="pc-ws-mark">{wsInitial(currentWorkspace?.name)}</span>
            <span className="name">{currentWorkspace?.name ?? "No workspace"}</span>
            <ChevronsUpDown size={13} className="pc-dim" />
          </button>
          <Menu open={wsOpen} onClose={() => setWsOpen(false)} className="down">
            <div className="label">Workspaces</div>
            {workspaces.map((w) => (
              <button key={w._id} onClick={() => switchWorkspace(w)}>
                <span className="pc-ws-mark">{wsInitial(w.name)}</span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{w.name}</span>
                {w._id === currentWorkspace?._id && <Check size={14} className="pc-dim" />}
              </button>
            ))}
            <div className="sep" />
            <button onClick={onCreateWorkspace}>
              <Plus size={14} /> New workspace
            </button>
            {currentWorkspace && (
              <>
                <button onClick={onInvite}>
                  <UserPlus size={14} /> Invite people
                </button>
                <button onClick={onMembers}>
                  <Users size={14} /> Manage members
                </button>
              </>
            )}
          </Menu>
        </div>
      </div>

      <button className="pc-searchpill" onClick={onSearch} aria-label="Search">
        <Search size={14} />
        <span>Search or jump to…</span>
        <kbd className="pc-kbd">Ctrl K</kbd>
      </button>

      <div className="pc-topright">
        <div className="pc-menubtn">
          <button className="pc-btn primary sm" onClick={() => setNewOpen((o) => !o)} aria-haspopup="menu" aria-expanded={newOpen}>
            <Plus size={14} />
            <span className="hidden sm:inline">New</span>
          </button>
          <Menu open={newOpen} onClose={() => setNewOpen(false)} align="right">
            <button onClick={onNewTask}>
              <ListPlus size={14} /> Task
            </button>
            <button onClick={onNewProject}>
              <FolderPlus size={14} /> Project
            </button>
            <button onClick={onNewEvent}>
              <CalendarPlus size={14} /> Event
            </button>
          </Menu>
        </div>
        <TimerChip />
        <ThemeToggle />
        <NotificationsMenu />
        <div className="pc-menubtn">
          <button className="pc-iconbtn" onClick={() => setUserOpen((o) => !o)} aria-label="Account menu" aria-haspopup="menu" aria-expanded={userOpen}>
            <Avatar user={user} size="sm" />
          </button>
          <Menu open={userOpen} onClose={() => setUserOpen(false)} align="right">
            <div style={{ padding: "8px 9px 6px", minWidth: 200 }}>
              <b style={{ display: "block", fontSize: 13 }}>{user?.name}</b>
              <span className="pc-dim" style={{ fontSize: 12 }}>{user?.email}</span>
            </div>
            <div className="sep" />
            <Link to="/profile-settings">
              <Settings size={14} /> Settings
            </Link>
            <button className="danger" onClick={signOut}>
              <LogOut size={14} /> Sign out
            </button>
          </Menu>
        </div>
      </div>
    </header>
  );
}
