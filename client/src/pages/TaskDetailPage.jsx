import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Activity, AlertTriangle, Archive, CalendarDays, Check, ExternalLink, MessageSquare, Pencil, Plus, Send, Share2, Sparkles, Trash2, UserPlus, X } from "lucide-react";
import Layout from "../components/common-afterauth/Layout";
import TaskChatSidebar from "../components/sidebar/TaskChatSidebar";
import ActivityFeed from "../components/activity/ActivityFeed";
import { CustomFields, Dependencies, RepeatSetting, TimeTracker } from "../components/work/TaskWorkPanels";
import SendToModal from "../components/integrations/SendToModal";
import ProviderIcon from "../components/integrations/ProviderIcon";
import { aiService, taskService } from "../services";
import { projectService } from "../services/projectService";
import { useAuth } from "../contexts/AuthContext";
import { maskId, unmaskId } from "../utils/idMasker";
import {
  Avatar,
  Badge,
  Banner,
  Button,
  Card,
  CardHead,
  EmptyState,
  Menu,
  PRIORITY_META,
  Progress,
  STATUS_META,
  Skeleton,
  formatDate,
  timeAgo,
} from "../components/ui";

function Property({ label, children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "92px minmax(0, 1fr)", alignItems: "center", gap: 10, minHeight: 32 }}>
      <span className="pc-dim" style={{ fontSize: 12.5 }}>{label}</span>
      <div style={{ minWidth: 0 }}>{children}</div>
    </div>
  );
}

const TaskDetailPage = () => {
  const { maskedTaskId, maskedProjectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const taskId = unmaskId(maskedTaskId);

  const [task, setTask] = useState(null);
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [desc, setDesc] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [suggesting, setSuggesting] = useState(false);
  const commentRef = useRef(null);

  const canManage = project?.userRole === "owner" || project?.userRole === "admin";

  const load = useCallback(async () => {
    try {
      const res = await taskService.getTask(taskId);
      setTask(res.data);
      return res.data;
    } catch (e) {
      setError(e?.error || "This task doesn't exist or you don't have access to it.");
      return null;
    }
  }, [taskId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const t = await load();
      if (!t || !alive) return setLoading(false);
      const pid = maskedProjectId ? unmaskId(maskedProjectId) : t.project?._id;
      const [p, m, c, a] = await Promise.allSettled([
        projectService.getProject(pid),
        projectService.getProjectMembers(pid),
        projectService.getTaskComments(taskId),
        taskService.getTaskActivity(taskId),
      ]);
      if (!alive) return;
      if (p.status === "fulfilled") setProject(p.value.data);
      if (m.status === "fulfilled") setMembers((m.value.data || []).map((x) => x.user).filter(Boolean));
      if (c.status === "fulfilled") setComments(c.value.data || []);
      if (a.status === "fulfilled") setActivity(a.value.data || []);
      setLoading(false);
    })();
    aiService.getStatus().then((s) => alive && setAiEnabled(Boolean(s.enabled))).catch(() => {});
    return () => {
      alive = false;
    };
  }, [taskId, maskedProjectId, load]);

  const refreshActivity = () => taskService.getTaskActivity(taskId).then((r) => setActivity(r.data || [])).catch(() => {});

  const patch = async (changes, { silent = false } = {}) => {
    const previous = task;
    setTask((t) => ({ ...t, ...changes }));
    try {
      await taskService.updateTask(taskId, changes);
      if (!silent) toast.success("Saved", { duration: 1200 });
      refreshActivity();
    } catch (e) {
      setTask(previous);
      toast.error(e?.error || "Couldn't save the change");
    }
  };

  const setStatus = async (status) => {
    const previous = task;
    setTask((t) => ({ ...t, status }));
    try {
      await taskService.updateTaskStatus(taskId, status);
      refreshActivity();
    } catch (e) {
      setTask(previous);
      toast.error(e?.error || "Couldn't change the status");
    }
  };

  const saveTitle = async () => {
    setEditingTitle(false);
    const next = title.trim();
    if (next && next !== task.title) await patch({ title: next });
  };

  const saveDesc = async () => {
    setEditingDesc(false);
    if (desc !== (task.description || "")) await patch({ description: desc });
  };

  // subtasks
  const subtasks = task?.subtasks || [];
  const done = subtasks.filter((s) => s.isCompleted).length;

  const toggleSubtask = async (s) => {
    setTask((t) => ({ ...t, subtasks: t.subtasks.map((x) => (x._id === s._id ? { ...x, isCompleted: !x.isCompleted } : x)) }));
    try {
      await taskService.updateSubtask(s._id, { isCompleted: !s.isCompleted });
    } catch (e) {
      load();
      toast.error(e?.error || "Couldn't update the subtask");
    }
  };

  const addSubtask = async (e) => {
    e?.preventDefault();
    const text = newSubtask.trim();
    if (!text) return;
    setNewSubtask("");
    try {
      const res = await taskService.createSubtask(taskId, { title: text });
      setTask((t) => ({ ...t, subtasks: [...(t.subtasks || []), res.data] }));
    } catch (err) {
      setNewSubtask(text);
      toast.error(err?.error || "Couldn't add the subtask");
    }
  };

  const removeSubtask = async (s) => {
    setTask((t) => ({ ...t, subtasks: t.subtasks.filter((x) => x._id !== s._id) }));
    try {
      await taskService.deleteSubtask(s._id);
    } catch (e) {
      load();
      toast.error(e?.error || "Couldn't delete the subtask");
    }
  };

  const suggest = async () => {
    setSuggesting(true);
    try {
      const res = await aiService.breakdownTask(taskId);
      setSuggestions(res.subtasks);
    } catch (e) {
      toast.error(e?.error || "The assistant couldn't suggest subtasks");
    } finally {
      setSuggesting(false);
    }
  };

  const addSuggestions = async () => {
    try {
      for (const s of suggestions) await taskService.createSubtask(taskId, { title: s.title, description: s.description });
      setSuggestions(null);
      toast.success("Subtasks added");
      load();
    } catch (e) {
      toast.error(e?.error || "Couldn't add the subtasks");
    }
  };

  // assignees
  const assignments = task?.assignments || [];
  const assignedIds = useMemo(() => new Set(assignments.map((a) => a.user?._id)), [assignments]);

  const assign = async (member) => {
    setAssignOpen(false);
    try {
      await taskService.assignTask(taskId, { userId: member._id, role: "assignee" });
      await load();
      refreshActivity();
    } catch (e) {
      toast.error(e?.error || "Couldn't assign that person");
    }
  };

  const unassign = async (assignment) => {
    setTask((t) => ({ ...t, assignments: t.assignments.filter((a) => a._id !== assignment._id) }));
    try {
      await taskService.unassignTask(assignment._id);
    } catch (e) {
      load();
      toast.error(e?.error || "Couldn't unassign");
    }
  };

  // comments
  const postComment = async () => {
    const content = newComment.trim();
    if (!content) return;
    setNewComment("");
    try {
      const res = await projectService.createTaskComment(taskId, { content });
      setComments((c) => [...c, res.data]);
      refreshActivity();
    } catch (e) {
      setNewComment(content);
      toast.error(e?.error || "Couldn't post the comment");
    }
  };

  const deleteComment = async (c) => {
    setComments((list) => list.filter((x) => x._id !== c._id));
    try {
      await projectService.deleteTaskComment(c._id);
    } catch (e) {
      toast.error(e?.error || "Couldn't delete the comment");
      projectService.getTaskComments(taskId).then((r) => setComments(r.data || []));
    }
  };

  const archive = async () => {
    if (!window.confirm("Archive this task? It will be removed from boards and lists.")) return;
    try {
      await taskService.deleteTask(taskId);
      toast.success("Task archived");
      navigate(project ? `/project/${maskId(project._id)}` : "/projects", { replace: true });
    } catch (e) {
      toast.error(e?.error || "Couldn't archive the task");
    }
  };

  if (error) {
    return (
      <Layout>
        <div className="pc-page narrow">
          <Banner tone="error" icon={AlertTriangle} action={<Button size="sm" onClick={() => navigate("/projects")}>Back to projects</Button>}>{error}</Banner>
        </div>
      </Layout>
    );
  }

  if (loading || !task) {
    return (
      <Layout>
        <div className="pc-page">
          <Skeleton h={24} w="30%" />
          <div className="pc-split">
            <Skeleton h={420} />
            <Skeleton h={320} />
          </div>
        </div>
      </Layout>
    );
  }

  const overdue = task.dueDate && task.status !== "done" && new Date(task.dueDate) < new Date();
  const candidates = members.filter((m) => !assignedIds.has(m._id));

  return (
    <Layout>
      <div className="pc-page">
        <nav className="pc-crumbs" aria-label="Breadcrumb">
          <a href="/projects" onClick={(e) => { e.preventDefault(); navigate("/projects"); }}>Projects</a>
          <span>/</span>
          {project && <a href={`/project/${maskId(project._id)}`} onClick={(e) => { e.preventDefault(); navigate(`/project/${maskId(project._id)}`); }}>{project.name}</a>}
          <span>/</span>
          <span className="pc-mono">{task.taskKey}</span>
        </nav>

        <div className="pc-split">
          <div className="pc-stack">
            <Card>
              {editingTitle ? (
                <input
                  className="pc-input lg"
                  style={{ fontSize: 20, fontWeight: 600, height: 46 }}
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                    if (e.key === "Escape") setEditingTitle(false);
                  }}
                  maxLength={200}
                />
              ) : (
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.015em", cursor: "text", display: "flex", gap: 10, alignItems: "flex-start" }} onClick={() => { setTitle(task.title); setEditingTitle(true); }} title="Click to edit">
                  <span style={{ flex: 1, overflowWrap: "anywhere" }}>{task.title}</span>
                  <Pencil size={14} className="pc-dim" style={{ marginTop: 8 }} />
                </h1>
              )}

              <div style={{ marginTop: 16 }}>
                <div className="pc-label" style={{ marginBottom: 6 }}>Description</div>
                {editingDesc ? (
                  <div style={{ display: "grid", gap: 8 }}>
                    <textarea className="pc-textarea" style={{ minHeight: 140 }} autoFocus value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Add more detail, links, or acceptance criteria" />
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button size="sm" variant="primary" onClick={saveDesc}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingDesc(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => { setDesc(task.description || ""); setEditingDesc(true); }} style={{ cursor: "text", padding: "8px 10px", margin: "0 -10px", borderRadius: 8, whiteSpace: "pre-wrap", lineHeight: 1.6, color: task.description ? "var(--text)" : "var(--dim)", minHeight: 40 }} className="hover:bg-white/5">
                    {task.description || "Click to add a description"}
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <CardHead icon={Check} title={`Subtasks${subtasks.length ? ` · ${done}/${subtasks.length}` : ""}`}>
                {aiEnabled && (
                  <Button size="sm" icon={Sparkles} loading={suggesting} onClick={suggest}>Suggest with AI</Button>
                )}
              </CardHead>
              {subtasks.length > 0 && <Progress value={(done / subtasks.length) * 100} className="mb-2" />}
              <ul className="pc-list" style={{ margin: "0 -8px" }}>
                {subtasks.map((s) => (
                  <li key={s._id} className="pc-row" style={{ cursor: "default" }}>
                    <input type="checkbox" checked={Boolean(s.isCompleted)} onChange={() => toggleSubtask(s)} style={{ accentColor: "var(--blue)", width: 15, height: 15 }} aria-label={`Mark “${s.title}” ${s.isCompleted ? "incomplete" : "complete"}`} />
                    <span className="grow" style={{ textDecoration: s.isCompleted ? "line-through" : "none", color: s.isCompleted ? "var(--dim)" : "var(--text)" }}>
                      <b style={{ whiteSpace: "normal", fontWeight: 400 }}>{s.title}</b>
                    </span>
                    <button className="pc-btn ghost icon sm" onClick={() => removeSubtask(s)} aria-label={`Delete “${s.title}”`}>
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
              <form onSubmit={addSubtask} style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input className="pc-input" value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} placeholder="Add a subtask" maxLength={200} />
                <Button type="submit" icon={Plus} disabled={!newSubtask.trim()}>Add</Button>
              </form>

              {suggestions && (
                <div className="pc-banner info" style={{ marginTop: 12, flexDirection: "column", alignItems: "stretch", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Sparkles size={14} /> <b style={{ fontWeight: 600 }}>Suggested subtasks</b>
                    <span style={{ flex: 1 }} />
                    <button className="pc-btn ghost icon sm" onClick={() => setSuggestions(null)} aria-label="Dismiss"><X size={14} /></button>
                  </div>
                  <ol style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6, color: "var(--text)" }}>
                    {suggestions.map((s, i) => (
                      <li key={i}>
                        <b style={{ fontWeight: 500 }}>{s.title}</b>
                        <div className="pc-muted" style={{ fontSize: 12.5 }}>{s.description}</div>
                      </li>
                    ))}
                  </ol>
                  <div><Button size="sm" variant="primary" onClick={addSuggestions}>Add all {suggestions.length}</Button></div>
                </div>
              )}
            </Card>

            <Card>
              <CardHead icon={MessageSquare} title={`Comments${comments.length ? ` · ${comments.length}` : ""}`}>
                <Button size="sm" onClick={() => setChatOpen(true)}>Open discussion</Button>
              </CardHead>
              {comments.length === 0 ? (
                <p className="pc-muted" style={{ margin: "0 0 12px", fontSize: 13 }}>No comments yet. Start the conversation.</p>
              ) : (
                <ul className="pc-list" style={{ display: "grid", gap: 14, marginBottom: 14 }}>
                  {comments.map((c) => (
                    <li key={c._id} style={{ display: "flex", gap: 10 }}>
                      <Avatar user={c.author} size="sm" />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                          <b style={{ fontSize: 13, fontWeight: 600 }}>{c.author?.name}</b>
                          <span className="pc-dim" style={{ fontSize: 12 }}>{timeAgo(c.createdAt)}</span>
                          {(c.author?._id === user?._id || canManage) && (
                            <button className="pc-link" style={{ marginLeft: "auto", color: "var(--dim)", fontSize: 12 }} onClick={() => deleteComment(c)}>Delete</button>
                          )}
                        </div>
                        <div style={{ fontSize: 13.5, lineHeight: 1.55, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{c.content}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <Avatar user={user} size="sm" />
                <div style={{ flex: 1, display: "grid", gap: 8 }}>
                  <textarea
                    ref={commentRef}
                    className="pc-textarea"
                    style={{ minHeight: 64 }}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => (e.ctrlKey || e.metaKey) && e.key === "Enter" && postComment()}
                    placeholder="Write a comment…  (Ctrl+Enter to send)"
                  />
                  <div><Button size="sm" variant="primary" icon={Send} disabled={!newComment.trim()} onClick={postComment}>Comment</Button></div>
                </div>
              </div>
            </Card>
          </div>

          <div className="pc-stack">
            <Card>
              <CardHead title="Details" />
              <div style={{ display: "grid", gap: 6 }}>
                <Property label="Status">
                  <select className="pc-select" style={{ height: 30 }} value={task.status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
                    {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </Property>
                <Property label="Priority">
                  <select className="pc-select" style={{ height: 30 }} value={task.priority} onChange={(e) => patch({ priority: e.target.value })} aria-label="Priority">
                    {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </Property>
                <Property label="Due date">
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="date" className="pc-input" style={{ height: 30 }} value={task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""} onChange={(e) => patch({ dueDate: e.target.value || null })} aria-label="Due date" />
                    {overdue && <Badge tone="red">Overdue</Badge>}
                  </div>
                </Property>
                <Property label="Assignees">
                  <div style={{ display: "grid", gap: 6 }}>
                    {assignments.map((a) => (
                      <span key={a._id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar user={a.user} size="sm" />
                        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13 }}>{a.user?.name}</span>
                        <button className="pc-btn ghost icon sm" onClick={() => unassign(a)} aria-label={`Unassign ${a.user?.name}`}><X size={13} /></button>
                      </span>
                    ))}
                    <div style={{ position: "relative" }}>
                      <Button size="sm" icon={UserPlus} onClick={() => setAssignOpen((o) => !o)} disabled={candidates.length === 0}>Assign</Button>
                      <Menu open={assignOpen} onClose={() => setAssignOpen(false)}>
                        {candidates.map((m) => (
                          <button key={m._id} onClick={() => assign(m)}>
                            <Avatar user={m} size="sm" /> {m.name}
                          </button>
                        ))}
                      </Menu>
                    </div>
                  </div>
                </Property>
                <Property label="Repeats"><RepeatSetting key={task._id + (task.recurrence?.frequency || "")} task={task} onChanged={load} /></Property>
                <Property label="Project"><span style={{ fontSize: 13 }}>{project?.name ?? task.project?.name}</span></Property>
                <Property label="Created">
                  <span className="pc-muted" style={{ fontSize: 13 }}>{formatDate(task.createdAt, { month: "short", day: "numeric", year: "numeric" })} by {task.createdBy?.name}</span>
                </Property>
                {task.dueDate && <Property label="Due on"><span className="inline-flex items-center gap-2 pc-muted" style={{ fontSize: 13 }}><CalendarDays size={13} />{formatDate(task.dueDate, { weekday: "long", month: "long", day: "numeric" })}</span></Property>}
              </div>
            </Card>

            <CustomFields task={task} project={project} onChanged={load} />
            <TimeTracker taskId={taskId} />
            <Dependencies taskId={taskId} projectId={project?._id ?? task.project?._id ?? task.project} onChanged={load} />

            <Card>
              <CardHead icon={Activity} title="Activity" />
              {activity.length === 0 ? <EmptyState icon={Activity} title="No activity yet" /> : <ActivityFeed items={activity.slice(0, 12)} />}
            </Card>

            {task.externalLinks?.length > 0 && (
              <Card>
                <CardHead icon={ExternalLink} title="Linked items" />
                <ul className="pc-list" style={{ margin: "0 -8px" }}>
                  {task.externalLinks.map((l) => (
                    <li key={l.externalId}>
                      <a className="pc-row" href={l.url} target="_blank" rel="noreferrer">
                        <ProviderIcon id={l.provider} size={22} />
                        <span className="grow"><b>{l.key || l.title}</b><small>{l.title}</small></span>
                        <ExternalLink size={13} />
                      </a>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Button icon={Share2} onClick={() => setSendOpen(true)}>Send to GitHub, Jira or Trello</Button>

            {(canManage || task.createdBy?._id === user?._id) && (
              <Button variant="danger" icon={Archive} onClick={archive}>Archive task</Button>
            )}
          </div>
        </div>
      </div>

      <SendToModal open={sendOpen} onClose={() => setSendOpen(false)} task={task} workspaceId={project?.workspace?._id ?? project?.workspace} onSent={load} />
      <TaskChatSidebar isOpen={chatOpen} onClose={() => setChatOpen(false)} task={task} />
    </Layout>
  );
};

export default TaskDetailPage;
