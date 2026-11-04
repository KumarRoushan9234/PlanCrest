import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Archive, CloudOff, Code2, Download, Eye, File, FileText, Image as ImageIcon, LayoutGrid, List, MoreHorizontal, Pencil, Share2, Trash2, Upload } from "lucide-react";
import { Layout } from "../components/common-afterauth";
import { useAuth } from "../contexts/AuthContext";
import { useProject } from "../contexts/ProjectContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { uploadService } from "../services";
import { DocumentPreviewModal, DocumentRenameModal, DocumentShareModal } from "../components/documents/DocumentModals";
import { Avatar, Badge, Banner, Button, Card, EmptyState, Menu, PageHead, Progress, SearchBox, Seg, Skeleton, formatDate } from "../components/ui";

const TYPES = [
  { value: "all", label: "All" },
  { value: "image", label: "Images" },
  { value: "pdf", label: "PDFs" },
  { value: "doc", label: "Docs" },
  { value: "other", label: "Other" },
];

const kindOf = (d) => {
  const m = d.mimeType || "";
  if (m.startsWith("image/")) return "image";
  if (m.includes("pdf")) return "pdf";
  if (/(word|document|text|sheet|excel|presentation|powerpoint|csv)/.test(m)) return "doc";
  return "other";
};

const iconOf = (d) => ({ image: ImageIcon, pdf: FileText, doc: FileText, other: /zip/.test(d.mimeType || "") ? Archive : /(json|code|javascript)/.test(d.mimeType || "") ? Code2 : File })[kindOf(d)];

const size = (bytes = 0) => {
  if (!bytes) return "–";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`;
};

function RowMenu({ doc, canEdit, onPreview, onShare, onRename, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-block" }} onClick={(e) => e.stopPropagation()}>
      <button className="pc-btn ghost icon sm" onClick={() => setOpen((o) => !o)} aria-label={`Actions for ${doc.originalName}`} aria-haspopup="menu"><MoreHorizontal size={15} /></button>
      <Menu open={open} onClose={() => setOpen(false)} align="right">
        <button onClick={onPreview}><Eye size={14} /> Preview</button>
        <button onClick={onShare}><Share2 size={14} /> Share</button>
        <a href={doc.url} target="_blank" rel="noreferrer"><Download size={14} /> {doc.provider === "google_drive" ? "Open in Drive" : "Download"}</a>
        {canEdit && (
          <>
            <div className="sep" />
            <button onClick={onRename}><Pencil size={14} /> Rename</button>
            <button className="danger" onClick={onDelete}><Trash2 size={14} /> Delete</button>
          </>
        )}
      </Menu>
    </span>
  );
}

const DocumentsPage = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { projects = [] } = useProject();
  const [docs, setDocs] = useState(null);
  const [canManageAll, setCanManageAll] = useState(false);
  const [storage, setStorage] = useState(null);
  const [uploads, setUploads] = useState({});
  const [dragging, setDragging] = useState(false);
  const [project, setProject] = useState("all");
  const [type, setType] = useState("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState(() => localStorage.getItem("pc:docsView") || "grid");
  const [preview, setPreview] = useState(null);
  const [share, setShare] = useState(null);
  const [rename, setRename] = useState(null);
  const [renaming, setRenaming] = useState(false);
  const input = useRef(null);
  const workspaceId = currentWorkspace?._id;

  useEffect(() => localStorage.setItem("pc:docsView", view), [view]);
  useEffect(() => {
    uploadService.getStatus().then((s) => setStorage(s.enabled)).catch(() => setStorage(false));
  }, []);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const r = await uploadService.listDocuments(workspaceId, project !== "all" ? project : undefined);
      setDocs(r.data || []);
      setCanManageAll(Boolean(r.canManageAll));
    } catch (e) {
      toast.error(e.response?.data?.message || "Couldn't load documents");
      setDocs([]);
    }
  }, [workspaceId, project]);

  useEffect(() => {
    setDocs(null);
    load();
  }, [load]);

  const upload = async (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    if (!storage) return toast.error("File storage isn't configured on this server");
    await Promise.allSettled(
      list.map(async (file) => {
        setUploads((u) => ({ ...u, [file.name]: 0 }));
        try {
          await uploadService.uploadDocument({ file, workspaceId, projectId: project !== "all" ? project : undefined }, (e) => e?.total && setUploads((u) => ({ ...u, [file.name]: Math.round((e.loaded / e.total) * 100) })));
          toast.success(`Uploaded ${file.name}`);
        } catch (e) {
          toast.error(e.response?.data?.message || `Couldn't upload ${file.name}`);
        } finally {
          setUploads((u) => {
            const { [file.name]: _done, ...rest } = u;
            return rest;
          });
        }
      })
    );
    load();
  };

  const remove = async (doc) => {
    if (!window.confirm(`Delete “${doc.originalName}”? This can't be undone.`)) return;
    try {
      await uploadService.deleteDocument(doc._id);
      setDocs((l) => l.filter((d) => d._id !== doc._id));
      toast.success("Deleted");
    } catch (e) {
      toast.error(e.response?.data?.message || "Couldn't delete");
    }
  };

  const saveName = async ({ name }) => {
    setRenaming(true);
    try {
      await uploadService.updateDocument(rename._id, { name });
      setRename(null);
      toast.success("Renamed");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Couldn't rename");
    } finally {
      setRenaming(false);
    }
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (docs || []).filter((d) => (type === "all" || kindOf(d) === type) && (!q || (d.originalName || "").toLowerCase().includes(q)));
  }, [docs, type, query]);

  const canEdit = (d) => canManageAll || String(d.uploadedBy?._id ?? d.uploadedBy) === String(user?._id);
  const uploading = Object.entries(uploads);

  const rowProps = (d) => ({ doc: d, canEdit: canEdit(d), onPreview: () => setPreview(d), onShare: () => setShare(d), onRename: () => setRename(d), onDelete: () => remove(d) });

  return (
    <Layout>
      <div
        className="pc-page"
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => e.currentTarget === e.target && setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files); }}
        style={dragging ? { outline: "2px dashed var(--link)", outlineOffset: -8, borderRadius: 12 } : undefined}
      >
        <PageHead title="Documents">
          <input ref={input} type="file" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
          <Button variant="primary" icon={Upload} disabled={!storage} onClick={() => input.current?.click()}>Upload</Button>
        </PageHead>

        {storage === false && (
          <Banner tone="warn" icon={CloudOff}>
            File uploads are off because Cloudinary isn't configured on this server. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to server/.env. You can still link files from Google Drive in Integrations.
          </Banner>
        )}

        {uploading.length > 0 && (
          <Card>
            <div style={{ display: "grid", gap: 10 }}>
              {uploading.map(([name, pct]) => (
                <div key={name} style={{ display: "grid", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}><span>{name}</span><span className="pc-dim">{pct}%</span></div>
                  <Progress value={pct} />
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="pc-toolbar">
          <SearchBox value={query} onChange={setQuery} placeholder="Search files" />
          <select className="pc-select" style={{ width: "auto" }} value={project} onChange={(e) => setProject(e.target.value)} aria-label="Filter by project">
            <option value="all">All projects</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <Seg value={type} onChange={setType} options={TYPES} />
          <span style={{ flex: 1 }} />
          <Seg value={view} onChange={setView} options={[{ value: "grid", label: "Grid", icon: <LayoutGrid size={13} /> }, { value: "list", label: "List", icon: <List size={13} /> }]} />
        </div>

        {docs === null ? (
          <div className="pc-grid pc-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} h={170} />)}</div>
        ) : visible.length === 0 ? (
          <Card>
            <EmptyState icon={FileText} title={docs.length ? "No files match" : "No documents yet"} action={!docs.length && storage ? <Button variant="primary" icon={Upload} onClick={() => input.current?.click()}>Upload your first file</Button> : null}>
              {docs.length ? "Try a different search or filter." : "Upload files or drag them anywhere on this page. They're shared with your workspace."}
            </EmptyState>
          </Card>
        ) : view === "grid" ? (
          <div className="pc-grid pc-cols-4">
            {visible.map((d) => {
              const Icon = iconOf(d);
              return (
                <div key={d._id} className="pc-card hover" style={{ cursor: "pointer", overflow: "hidden" }} onClick={() => setPreview(d)}>
                  <div style={{ height: 110, display: "grid", placeItems: "center", background: "var(--inset)", borderBottom: "1px solid var(--line)" }}>
                    {kindOf(d) === "image" ? <img src={d.thumbnailUrl || d.url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Icon size={32} className="pc-dim" />}
                  </div>
                  <div style={{ padding: "10px 12px", display: "grid", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <b style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={d.originalName}>{d.originalName}</b>
                      <RowMenu {...rowProps(d)} />
                    </div>
                    <div className="pc-dim" style={{ fontSize: 11.5, display: "flex", gap: 6, alignItems: "center" }}>
                      <Avatar user={d.uploadedBy} size="sm" /> {size(d.size)} · {formatDate(d.createdAt)}
                      {d.provider === "google_drive" && <Badge>Drive</Badge>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Card pad={false} flush>
            <div className="pc-table-wrap">
              <table className="pc-table">
                <thead><tr><th>Name</th><th>Project</th><th>Size</th><th>Uploaded by</th><th>Date</th><th className="r" /></tr></thead>
                <tbody>
                  {visible.map((d) => {
                    const Icon = iconOf(d);
                    return (
                      <tr key={d._id} className="click" onClick={() => setPreview(d)}>
                        <td><span className="inline-flex items-center gap-2"><Icon size={15} className="pc-dim" />{d.originalName}{d.provider === "google_drive" && <Badge>Drive</Badge>}</span></td>
                        <td className="pc-muted">{d.project?.name || "Workspace"}</td>
                        <td className="pc-muted pc-tabular">{size(d.size)}</td>
                        <td><span className="inline-flex items-center gap-2"><Avatar user={d.uploadedBy} size="sm" />{d.uploadedBy?.name}</span></td>
                        <td className="pc-dim">{formatDate(d.createdAt, { month: "short", day: "numeric", year: "numeric" })}</td>
                        <td className="r"><RowMenu {...rowProps(d)} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <DocumentPreviewModal document={preview} isOpen={Boolean(preview)} onClose={() => setPreview(null)} onShare={(d) => { setPreview(null); setShare(d); }} />
      <DocumentRenameModal document={rename} isOpen={Boolean(rename)} onClose={() => setRename(null)} onSubmit={saveName} loading={renaming} />
      <DocumentShareModal document={share} isOpen={Boolean(share)} onClose={() => setShare(null)} workspaceId={workspaceId} />
    </Layout>
  );
};

export default DocumentsPage;
