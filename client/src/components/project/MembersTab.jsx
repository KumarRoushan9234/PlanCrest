import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { projectService } from "../../services/projectService";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { Avatar, Badge, Button, Card, CardHead, EmptyState, Modal, SearchBox, Skeleton } from "../ui";

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

export default function MembersTab({ project, canManage }) {
  const { currentWorkspace } = useWorkspace();
  const [members, setMembers] = useState(null);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [adding, setAdding] = useState(false);
  const [picked, setPicked] = useState([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [pm, wm] = await Promise.all([
        projectService.getProjectMembers(project._id),
        currentWorkspace?._id ? projectService.getWorkspaceMembers(currentWorkspace._id) : { data: [] },
      ]);
      setMembers(pm.data || []);
      setWorkspaceMembers(wm.data || []);
    } catch (e) {
      toast.error(e?.error || "Couldn't load members");
      setMembers([]);
    }
  }, [project._id, currentWorkspace?._id]);

  useEffect(() => {
    load();
  }, [load]);

  const memberIds = useMemo(() => new Set((members || []).map((m) => m.user?._id)), [members]);
  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return workspaceMembers
      .map((m) => m.user)
      .filter((u) => u && !memberIds.has(u._id) && (!q || `${u.name} ${u.email}`.toLowerCase().includes(q)));
  }, [workspaceMembers, memberIds, query]);

  const changeRole = async (member, role) => {
    const prev = members;
    setMembers((list) => list.map((m) => (m._id === member._id ? { ...m, role } : m)));
    try {
      await projectService.updateProjectMember(project._id, member.user._id, { role });
    } catch (e) {
      setMembers(prev);
      toast.error(e?.error || "Couldn't change the role");
    }
  };

  const remove = async (member) => {
    if (!window.confirm(`Remove ${member.user?.name} from this project?`)) return;
    try {
      await projectService.removeProjectMember(project._id, member.user._id);
      setMembers((list) => list.filter((m) => m._id !== member._id));
      toast.success("Member removed");
    } catch (e) {
      toast.error(e?.error || "Couldn't remove the member");
    }
  };

  const add = async () => {
    if (!picked.length) return;
    setBusy(true);
    try {
      await projectService.addProjectMembers(project._id, picked);
      toast.success(`Added ${picked.length} ${picked.length === 1 ? "member" : "members"}`);
      setAdding(false);
      setPicked([]);
      setQuery("");
      load();
    } catch (e) {
      toast.error(e?.error || "Couldn't add members");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card pad={false} flush>
      <CardHead icon={UserPlus} title={`Members${members ? ` · ${members.length}` : ""}`} pad>
        {canManage && (
          <Button size="sm" variant="primary" icon={Plus} onClick={() => setAdding(true)}>Add members</Button>
        )}
      </CardHead>
      {members === null ? (
        <div style={{ padding: 16 }}><Skeleton h={120} /></div>
      ) : members.length === 0 ? (
        <EmptyState icon={UserPlus} title="No members yet" />
      ) : (
        <div className="pc-table-wrap">
          <table className="pc-table">
            <thead>
              <tr><th>Person</th><th>Role</th><th className="r" /></tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m._id}>
                  <td>
                    <span className="inline-flex items-center gap-3">
                      <Avatar user={m.user} />
                      <span>
                        <b style={{ fontWeight: 500 }}>{m.user?.name}</b>
                        <span className="pc-dim" style={{ display: "block", fontSize: 12 }}>{m.user?.email}</span>
                      </span>
                    </span>
                  </td>
                  <td>
                    {canManage ? (
                      <select className="pc-select" style={{ width: 120, height: 28 }} value={m.role} onChange={(e) => changeRole(m, e.target.value)} aria-label={`Role of ${m.user?.name}`}>
                        {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    ) : (
                      <Badge>{ROLES.find((r) => r.value === m.role)?.label ?? m.role}</Badge>
                    )}
                  </td>
                  <td className="r">
                    {canManage && (
                      <button className="pc-btn ghost icon sm" onClick={() => remove(m)} aria-label={`Remove ${m.user?.name}`}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add members"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            <Button variant="primary" loading={busy} disabled={!picked.length} onClick={add}>Add {picked.length || ""}</Button>
          </>
        }
      >
        <SearchBox value={query} onChange={setQuery} placeholder="Search workspace members" autoFocus />
        <div style={{ display: "grid", gap: 2, maxHeight: 320, overflowY: "auto" }}>
          {candidates.length === 0 ? (
            <p className="pc-muted" style={{ margin: "12px 0", textAlign: "center" }}>Everyone in the workspace is already on this project.</p>
          ) : (
            candidates.map((u) => (
              <label key={u._id} className="pc-row" style={{ cursor: "pointer" }}>
                <input type="checkbox" className="pc-check" style={{ accentColor: "var(--blue)" }} checked={picked.includes(u._id)} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, u._id] : p.filter((id) => id !== u._id)))} />
                <Avatar user={u} size="sm" />
                <span className="grow">
                  <b>{u.name}</b>
                  <small>{u.email}</small>
                </span>
              </label>
            ))
          )}
        </div>
      </Modal>
    </Card>
  );
}
