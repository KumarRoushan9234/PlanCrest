import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Copy, Download, ExternalLink, Mail, MessageSquare, Share2 } from "lucide-react";
import { chatService } from "../../services/chatService";
import { Button, Field, Modal, Skeleton } from "../ui";

const isImage = (d) => d?.mimeType?.startsWith("image/");
const isPdf = (d) => d?.mimeType?.includes("pdf") && d?.provider !== "google_drive";

export function DocumentPreviewModal({ document: doc, isOpen, onClose, onShare }) {
  if (!doc) return null;
  const external = doc.provider === "google_drive";
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={doc.originalName || doc.filename}
      size="wide"
      footer={
        <>
          <Button icon={Share2} onClick={() => onShare(doc)}>Share</Button>
          <a className="pc-btn" href={doc.url} target="_blank" rel="noreferrer">{external ? <ExternalLink size={14} /> : <Download size={14} />}{external ? "Open in Drive" : "Open / download"}</a>
        </>
      }
    >
      {isImage(doc) ? (
        <img src={doc.url} alt={doc.originalName} style={{ maxWidth: "100%", maxHeight: "65vh", margin: "0 auto", borderRadius: 8, objectFit: "contain" }} />
      ) : isPdf(doc) ? (
        <iframe title={doc.originalName} src={doc.url} style={{ width: "100%", height: "65vh", border: 0, borderRadius: 8, background: "#fff" }} />
      ) : (
        <div className="pc-empty">
          <h3>No preview for this file type</h3>
          <p>{external ? "This file lives in Google Drive. Open it there." : "Open or download it to view the contents."}</p>
        </div>
      )}
    </Modal>
  );
}

export function DocumentRenameModal({ document: doc, isOpen, onClose, onSubmit, loading = false }) {
  const [name, setName] = useState("");
  useEffect(() => {
    if (doc) setName(doc.originalName || doc.filename || "");
  }, [doc]);
  if (!doc) return null;
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Rename document"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={loading} disabled={!name.trim()} onClick={() => onSubmit({ name })}>Save</Button>
        </>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) onSubmit({ name }); }}>
        <Field label="Name"><input className="pc-input" autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={200} /></Field>
      </form>
    </Modal>
  );
}

export function DocumentShareModal({ document: doc, isOpen, onClose, workspaceId }) {
  const [channels, setChannels] = useState(null);
  const [channel, setChannel] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen || !workspaceId) return;
    setChannels(null);
    chatService.getWorkspaceChannels(workspaceId).then((r) => setChannels(r.data || [])).catch(() => setChannels([]));
  }, [isOpen, workspaceId]);

  if (!doc) return null;

  const copy = async () => {
    await navigator.clipboard.writeText(doc.url).catch(() => {});
    toast.success("Link copied");
  };
  const email = () =>
    window.open(`mailto:?subject=${encodeURIComponent(`Shared: ${doc.originalName}`)}&body=${encodeURIComponent(`Here's the document:\n${doc.url}\n`)}`, "_blank");

  const toChat = async () => {
    if (!channel) return toast.error("Choose a channel");
    setBusy(true);
    try {
      await chatService.sendMessage(channel, {
        content: "",
        attachments: [{ url: doc.url, filename: doc.originalName || doc.filename, originalName: doc.originalName || doc.filename, mimeType: doc.mimeType, size: doc.size, bytes: doc.bytes, publicId: doc.publicId, resourceType: doc.resourceType, folder: doc.folder, thumbnailUrl: doc.thumbnailUrl || doc.url }],
      });
      toast.success("Shared to channel");
      onClose();
    } catch {
      toast.error("Couldn't share to the channel");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} title={`Share “${doc.originalName}”`}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button icon={Copy} onClick={copy}>Copy link</Button>
        <Button icon={Mail} onClick={email}>Email</Button>
      </div>
      <div className="pc-divider" style={{ margin: 0 }} />
      <Field label="Share to a chat channel">
        {channels === null ? <Skeleton h={34} /> : (
          <div style={{ display: "flex", gap: 8 }}>
            <select className="pc-select" value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="">Choose a channel</option>
              {channels.map((c) => <option key={c._id} value={c._id}>{c.type === "direct" ? "Direct message" : `#${c.name}`}</option>)}
            </select>
            <Button variant="primary" icon={MessageSquare} loading={busy} onClick={toChat}>Send</Button>
          </div>
        )}
      </Field>
    </Modal>
  );
}
