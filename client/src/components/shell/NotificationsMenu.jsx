import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { notificationService } from "../../services";
import { Menu, timeAgo, Avatar } from "../ui";

const POLL_MS = 45000;

export default function NotificationsMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadCount = useCallback(async () => {
    try {
      const res = await notificationService.getUnreadCount();
      setUnread(res?.data?.count ?? res?.count ?? 0);
    } catch {
      /* the bell stays quiet when the API is unreachable */
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications({ limit: 15 });
      setItems(res?.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCount();
    const id = setInterval(() => document.visibilityState === "visible" && loadCount(), POLL_MS);
    return () => clearInterval(id);
  }, [loadCount]);

  useEffect(() => {
    if (open) loadList();
  }, [open, loadList]);

  const openItem = async (n) => {
    setOpen(false);
    if (!n.isRead) {
      setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
      setUnread((c) => Math.max(0, c - 1));
      notificationService.markAsRead(n._id).catch(() => {});
    }
    if (n.link) navigate(n.link.startsWith("http") ? "/dashboard" : n.link);
  };

  const markAll = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
    setUnread(0);
    notificationService.markAllAsRead().catch(() => {});
  };

  return (
    <div className="pc-menubtn">
      <button className="pc-iconbtn" onClick={() => setOpen((o) => !o)} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-haspopup="menu" aria-expanded={open}>
        <Bell size={16} />
        {unread > 0 && <span className="count">{unread > 9 ? "9+" : unread}</span>}
      </button>
      <Menu open={open} onClose={() => setOpen(false)} align="right" className="" >
        <div style={{ width: 340, maxWidth: "calc(100vw - 32px)" }} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-2 py-1.5">
            <b style={{ fontSize: 13 }}>Notifications</b>
            <button className="pc-link" style={{ fontSize: 12 }} onClick={markAll} disabled={!unread}>
              <CheckCheck size={12} style={{ display: "inline", marginRight: 4 }} />
              Mark all read
            </button>
          </div>
          <div className="pc-sep" style={{ height: 1, background: "var(--line)", margin: "2px 0 4px" }} />
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {loading && !items.length ? (
              <div className="pc-dim" style={{ padding: 18, textAlign: "center", fontSize: 12.5 }}>Loading…</div>
            ) : items.length === 0 ? (
              <div className="pc-empty" style={{ padding: "26px 12px" }}>
                <span className="pc-ico"><BellOff size={16} /></span>
                <h3 style={{ fontSize: 13.5 }}>You're all caught up</h3>
                <p style={{ fontSize: 12.5 }}>Assignments, mentions and due dates show up here.</p>
              </div>
            ) : (
              items.map((n) => (
                <button key={n._id} onClick={() => openItem(n)} style={{ height: "auto", padding: "8px 9px", alignItems: "flex-start", opacity: n.isRead ? 0.65 : 1 }}>
                  <Avatar user={n.sender} name={n.sender?.name ?? "PlanCrest"} size="sm" />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 12.5, lineHeight: 1.4, whiteSpace: "normal", color: "var(--text)" }}>{n.title || n.message}</span>
                    <span style={{ fontSize: 11.5, color: "var(--dim)" }}>{timeAgo(n.createdAt)}</span>
                  </span>
                  {!n.isRead && <span className="pc-dot" style={{ background: "var(--link)", marginTop: 6 }} />}
                </button>
              ))
            )}
          </div>
        </div>
      </Menu>
    </div>
  );
}
