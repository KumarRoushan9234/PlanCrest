import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Mail, Trash2, UserPlus, Users } from "lucide-react";
import { Layout } from "../../components/common-afterauth";
import TeamNav from "../../components/shell/TeamNav";
import { useAuth } from "../../contexts/AuthContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { taskService, workspaceService } from "../../services";
import { Avatar, Badge, Button, Card, CardHead, EmptyState, PageHead, SearchBox, Seg, Skeleton, formatDate, num } from "../../components/ui";

const ROLE_TONE = { owner: "lav", admin: "blue", employee: "", client: "amber" };
const ROLE_LABEL = { owner: "Owner", admin: "Admin", employee: "Member", client: "Client" };
const ROLE_FILTERS = [
  { value: "all", label: "All" },
  { value: "admin", label: "Admins" },
  { value: "employee", label: "Members" },
  { value: "client", label: "Clients" },
];

const TeamPage = () => {
  const { user } = useAuth();
  const { currentWorkspace, fetchWorkspaceMembers } = useWorkspace();
  const [members, setMembers] = useState(null);
  const [invites, setInvites] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");

  const workspaceId = currentWorkspace?._id;
  const me = members?.find((m) => m.user?._id === user?._id);
  const isOwner = me?.role === "owner";
  const canManage = isOwner || me?.role === "admin";

  const load = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const [m, t] = await Promise.all([workspaceService.getWorkspaceMembers(workspaceId), taskService.getWorkspaceTasks(workspaceId)]);
      setMembers(m.data || []);
      setTasks(t.data || []);
    } catch (e) {
      toast.error(e?.error || "Couldn't load the team");
      setMembers([]);
    }
  }, [workspaceId]);

  useEffect(() => {
    setMembers(null);
    load();
  }, [load]);

  useEffect(() => {
    if (!workspaceId || !canManage) return;
    workspaceService.getWorkspaceInvitations(workspaceId).then((r) => setInvites(r.data || [])).catch(() => setInvites([]));
  }, [workspaceId, canManage]);

  // Real workload per person, from the tasks they can see
  const load_ = useMemo(() => {
    const map = new Map();
    for (const t of tasks) {
      for (const a of t.assignees || []) {
        const row = map.get(a._id) || { open: 0, done: 0 };
        if (t.status === "done") row.done++;
        else if (t.status !== "cancelled") row.open++;
        map.set(a._id, row);
      }
    }
    return map;
  }, [tasks]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (members || []).filter((m) => m.user && (role === "all" || m.role === role) && (!q || `${m.user.name} ${m.user.email}`.toLowerCase().includes(q)));
  }, [members, query, role]);

  const changeRole = async (member, next) => {
    const previous = members;
    setMembers((list) => list.map((m) => (m.user._id === member.user._id ? { ...m, role: next } : m)));
    try {
      await workspaceService.updateWorkspaceMember(workspaceId, member.user._id, { role: next });
      toast.success("Role updated");
    } catch (e) {
      setMembers(previous);
      toast.error(e?.error || "Couldn't change the role");
    }
  };

  const remove = async (member) => {
    if (!window.confirm(`Remove ${member.user.name} from ${currentWorkspace.name}?`)) return;
    try {
      await workspaceService.removeWorkspaceMember(workspaceId, member.user._id);
      setMembers((list) => list.filter((m) => m.user._id !== member.user._id));
      fetchWorkspaceMembers?.(workspaceId);
      toast.success("Member removed");
    } catch (e) {
      toast.error(e?.error || "Couldn't remove the member");
    }
  };

  const cancelInvite = async (invite) => {
    try {
      await workspaceService.cancelInvitation(workspaceId, invite._id);
      setInvites((list) => list.filter((i) => i._id !== invite._id));
      toast.success("Invitation cancelled");
    } catch (e) {
      toast.error(e?.error || "Couldn't cancel the invitation");
    }
  };

  const invite = () => window.dispatchEvent(new CustomEvent("pc:modal", { detail: "invite" }));

  return (
    <Layout>
      <div className="pc-page">
        <TeamNav />
        <PageHead title="Team">
          {canManage && <Button variant="primary" icon={UserPlus} onClick={invite}>Invite people</Button>}
        </PageHead>

        <div className="pc-toolbar">
          <SearchBox value={query} onChange={setQuery} placeholder="Search by name or email" />
          <Seg value={role} onChange={setRole} options={ROLE_FILTERS} />
        </div>

        {members === null ? (
          <Skeleton h={260} />
        ) : visible.length === 0 ? (
          <Card><EmptyState icon={Users} title="No one matches" /></Card>
        ) : (
          <Card pad={false} flush>
            <div className="pc-table-wrap">
              <table className="pc-table">
                <thead>
                  <tr><th>Person</th><th>Role</th><th>Open tasks</th><th>Done</th><th>Projects</th><th>Joined</th><th className="r" /></tr>
                </thead>
                <tbody>
                  {visible.map((m) => {
                    const w = load_.get(m.user._id) || { open: 0, done: 0 };
                    const locked = m.role === "owner" || m.user._id === user?._id || (!isOwner && m.role === "admin");
                    return (
                      <tr key={m.user._id}>
                        <td>
                          <span className="inline-flex items-center gap-3">
                            <Avatar user={m.user} />
                            <span>
                              <b style={{ fontWeight: 500 }}>{m.user.name}{m.user._id === user?._id && <span className="pc-dim" style={{ fontWeight: 400 }}> (you)</span>}</b>
                              <span className="pc-dim" style={{ display: "block", fontSize: 12 }}>{m.user.title || m.user.email}</span>
                            </span>
                          </span>
                        </td>
                        <td>
                          {canManage && !locked ? (
                            <select className="pc-select" style={{ width: 120, height: 28 }} value={m.role} onChange={(e) => changeRole(m, e.target.value)} aria-label={`Role of ${m.user.name}`}>
                              {isOwner && <option value="admin">Admin</option>}
                              <option value="employee">Member</option>
                              <option value="client">Client</option>
                            </select>
                          ) : (
                            <Badge tone={ROLE_TONE[m.role]}>{ROLE_LABEL[m.role] ?? m.role}</Badge>
                          )}
                        </td>
                        <td className="pc-tabular">{num(w.open)}</td>
                        <td className="pc-tabular">{num(w.done)}</td>
                        <td className="pc-muted" title={(m.projects || []).map((p) => p.name).join(", ")}>{(m.projects || []).length || "–"}</td>
                        <td className="pc-dim">{m.joinedAt ? formatDate(m.joinedAt, { month: "short", day: "numeric", year: "numeric" }) : ""}</td>
                        <td className="r">
                          {canManage && !locked && (
                            <button className="pc-btn ghost icon sm" onClick={() => remove(m)} aria-label={`Remove ${m.user.name}`}><Trash2 size={14} /></button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {canManage && invites.length > 0 && (
          <Card pad={false} flush>
            <CardHead icon={Mail} title={`Pending invitations · ${invites.length}`} pad />
            <div className="pc-table-wrap">
              <table className="pc-table">
                <thead><tr><th>Email</th><th>Role</th><th>Invited by</th><th>Expires</th><th className="r" /></tr></thead>
                <tbody>
                  {invites.map((i) => (
                    <tr key={i._id}>
                      <td>{i.email}</td>
                      <td><Badge tone={ROLE_TONE[i.role]}>{ROLE_LABEL[i.role] ?? i.role}</Badge></td>
                      <td className="pc-muted">{i.invitedBy?.name}</td>
                      <td className="pc-dim">{i.expiresAt ? formatDate(i.expiresAt) : ""}</td>
                      <td className="r"><Button size="sm" variant="ghost" onClick={() => cancelInvite(i)}>Cancel</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default TeamPage;
