import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { CheckSquare, CornerDownLeft, FolderKanban, Plus, Search, Sparkles, ArrowRight } from "lucide-react";
import { projectService, taskService } from "../../services";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { maskId } from "../../utils/idMasker";
import { cn } from "../ui";
import { NAV } from "./navConfig";

const norm = (s) => String(s || "").toLowerCase();

/** Ctrl/Cmd+K: jump to pages, projects and tasks; run quick actions. */
export default function CommandPalette({ open, onClose, actions = [] }) {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const loadedFor = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open || !currentWorkspace?._id || loadedFor.current === currentWorkspace._id) return;
    loadedFor.current = currentWorkspace._id;
    projectService.getWorkspaceProjects(currentWorkspace._id).then((r) => setProjects(r?.data || [])).catch(() => setProjects([]));
    taskService.getWorkspaceTasks(currentWorkspace._id).then((r) => setTasks(r?.data || [])).catch(() => setTasks([]));
  }, [open, currentWorkspace?._id]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
    }
  }, [open]);

  const entries = useMemo(() => {
    const pages = NAV.flatMap((s) => s.items.map((i) => ({ group: "Go to", icon: i.icon, label: i.label, hint: s.label, run: () => navigate(i.to) })));
    const acts = actions.map((a) => ({ group: "Actions", icon: a.icon ?? Plus, label: a.label, hint: a.hint, run: a.run }));
    const aiPrompt = { group: "Actions", icon: Sparkles, label: "Ask the AI assistant", hint: "AI Mode", run: () => navigate("/ai-mode") };
    const projectEntries = projects.map((p) => ({ group: "Projects", icon: FolderKanban, label: p.name, hint: p.key, run: () => navigate(`/project/${maskId(p._id)}`) }));
    const taskEntries = tasks.slice(0, 200).map((t) => ({
      group: "Tasks",
      icon: CheckSquare,
      label: t.title,
      hint: [t.taskKey, t.project?.name].filter(Boolean).join(" · "),
      run: () => navigate(`/project/${maskId(t.project?._id ?? t.project)}/task/${maskId(t._id)}`),
    }));
    const q = norm(query).trim();
    const all = [...acts, aiPrompt, ...pages, ...projectEntries, ...taskEntries];
    if (!q) return [...acts, aiPrompt, ...pages].slice(0, 14);
    return all.filter((e) => norm(`${e.label} ${e.hint}`).includes(q)).slice(0, 30);
  }, [query, projects, tasks, actions, navigate]);

  useEffect(() => setCursor(0), [query]);
  useEffect(() => {
    listRef.current?.querySelector('[data-on="true"]')?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const choose = useCallback(
    (entry) => {
      if (!entry) return;
      onClose();
      entry.run();
    },
    [onClose]
  );

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(entries.length - 1, c + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(entries[cursor]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;

  let lastGroup = null;
  return createPortal(
    <div className="pc-overlay top" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pc-palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="pc-pal-input">
          <Search size={16} />
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKeyDown} placeholder="Search tasks, projects, pages, or run an action…" aria-label="Search" />
          <kbd className="pc-kbd">Esc</kbd>
        </div>
        <div className="pc-pal-list" ref={listRef}>
          {entries.length === 0 && <div className="pc-empty" style={{ padding: 28 }}>Nothing matches “{query}”</div>}
          {entries.map((e, i) => {
            const header = e.group !== lastGroup ? <div key={`g-${e.group}-${i}`} className="pc-pal-group">{e.group}</div> : null;
            lastGroup = e.group;
            const Icon = e.icon;
            return (
              <div key={`${e.group}-${e.label}-${i}`}>
                {header}
                <button className={cn("pc-pal-item", i === cursor && "on")} data-on={i === cursor} onMouseMove={() => setCursor(i)} onClick={() => choose(e)}>
                  <span className="pc-ico">
                    <Icon size={13} />
                  </span>
                  <span className="grow">{e.label}</span>
                  {e.hint && <small>{e.hint}</small>}
                  {i === cursor && <ArrowRight size={13} className="pc-dim" />}
                </button>
              </div>
            );
          })}
        </div>
        <div className="pc-pal-foot">
          <span>
            <kbd className="pc-kbd">↑</kbd> <kbd className="pc-kbd">↓</kbd> to move
          </span>
          <span>
            <CornerDownLeft size={11} style={{ display: "inline" }} /> to open
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
