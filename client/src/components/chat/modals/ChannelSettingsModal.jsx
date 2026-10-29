import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Trash2, UserMinus, UserPlus } from "lucide-react";
import { chatService } from "../../../services/chatService";
import { useWorkspace } from "../../../contexts/WorkspaceContext";
import { Avatar, Badge, Button, Field, Modal } from "../../ui";

/** Rename a channel, change its topic, manage who is in it, or delete it. */
export default function ChannelSettingsModal({ isOpen, onClose, channel, currentUserId, onUpdated, onDeleted }) {
  const { workspaceMembers } = useWorkspace();
  const [form, setForm] = useState({ name: "", topic: "", description: "" });
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState("");

  useEffect(() => {
    if (channel) setForm({ name: channel.name || "", topic: channel.topic || "", description: channel.description || "" });
  }, [channel]);

  const members = channel?.members || [];
  const memberIds = useMemo(() => new Set(members.map((m) => m._id)), [members]);
  const candidates = useMemo(() => workspaceMembers.map((m) => m.user).filter((u) => u && !memberIds.has(u._id)), [workspaceMembers, memberIds]);
  const direct = channel?.type === "direct" || channel?.category === "direct";
  const isCreator = String(channel?.createdBy?._id ?? channel?.createdBy) === String(currentUserId);

  if (!channel) return null;

  const save = async (e) => {
    e?.preventDefault();
    if (!form.name.trim()) return toast.error("A channel needs a name");
    setBusy(true);
    try {
      const res = await chatService.updateChannel(channel._id, { name: form.name.trim(), topic: form.topic, description: form.description });
      toast.success("Channel updated");
      onUpdated(res.data);
      onClose();
    } catch (err) {
      toast.error(err?.message || err?.error || "Couldn't update the channel");
    } finally {
      setBusy(false);
    }
  };

  const addMember = async () => {
    if (!adding) return;
    try {
      await chatService.addMember(channel._id, adding);
      const user = candidates.find((u) => u._id === adding);
      onUpdated({ ...channel, members: [...members, user] });
      setAdding("");
      toast.success("Member added");
    } catch (err) {
      toast.error(err?.message || "Couldn't add the member");
    }
  };

  const removeMember = async (member) => {
    try {
      await chatService.removeMember(channel._id, member._id);
      onUpdated({ ...channel, members: members.filter((m) => m._id !== member._id) });
    } catch (err) {
      toast.error(err?.message || "Couldn't remove the member");
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete #${channel.name}? Its messages will be lost.`)) return;
    try {
      await chatService.deleteChannel(channel._id);
      toast.success("Channel deleted");
      onDeleted(channel._id);
      onClose();
    } catch (err) {
      toast.error(err?.message || "Only the channel's creator can delete it");
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`${direct ? "Conversation" : `#${channel.name}`} settings`}
      footer={
        <>
          {!direct && isCreator && !channel.isDefault && <Button variant="danger" icon={Trash2} onClick={remove} style={{ marginRight: "auto" }}>Delete channel</Button>}
          <Button variant="ghost" onClick={onClose}>Close</Button>
          {!direct && <Button variant="primary" loading={busy} onClick={save}>Save</Button>}
        </>
      }
    >
      {!direct && (
        <form onSubmit={save} style={{ display: "grid", gap: 14 }}>
          <Field label="Name"><input className="pc-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} maxLength={80} /></Field>
          <Field label="Topic" hint="Shown at the top of the channel."><input className="pc-input" value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))} maxLength={200} /></Field>
          <Field label="Description"><textarea className="pc-textarea" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} maxLength={500} /></Field>
          <button type="submit" hidden />
        </form>
      )}

      <div>
        <div className="pc-label" style={{ marginBottom: 8 }}>Members · {members.length}</div>
        <ul className="pc-list" style={{ display: "grid", gap: 2, maxHeight: 220, overflowY: "auto" }}>
          {members.map((m) => (
            <li key={m._id} className="pc-row" style={{ cursor: "default" }}>
              <Avatar user={m} size="sm" />
              <span className="grow"><b>{m.name}</b><small>{m.email}</small></span>
              {String(channel.createdBy?._id ?? channel.createdBy) === String(m._id) && <Badge>Creator</Badge>}
              {!direct && m._id !== currentUserId && <button className="pc-btn ghost icon sm" onClick={() => removeMember(m)} aria-label={`Remove ${m.name}`}><UserMinus size={13} /></button>}
            </li>
          ))}
        </ul>
        {!direct && candidates.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <select className="pc-select" value={adding} onChange={(e) => setAdding(e.target.value)}>
              <option value="">Add a workspace member…</option>
              {candidates.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
            <Button icon={UserPlus} disabled={!adding} onClick={addMember}>Add</Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
