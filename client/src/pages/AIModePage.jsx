import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Bot, CalendarCheck, ListTree, Send, Sparkles, Trash2 } from "lucide-react";
import Layout from "../components/common-afterauth/Layout";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { aiService, taskService } from "../services";
import { formatFullMessage } from "../utils/messageFormatter";
import { maskId } from "../utils/idMasker";
import { Badge, Banner, Button, Card, CardHead, EmptyState, KpiStrip, PageHead, Skeleton, Tabs } from "../components/ui";

const SUGGESTED_PROMPTS = [
  "What's overdue across my projects?",
  "Summarize the open work in each project",
  "Which high-priority tasks are due this week?",
  "Create a task to review the launch checklist",
];

/** Assistant markdown, escaped and sanitized by the formatter. */
const Markdown = ({ text }) => (
  <div className="pc-md" style={{ fontSize: 13, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: formatFullMessage(text, "markdown") }} />
);

const Assistant = ({ workspaceId, onActivity }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const send = async (text) => {
    const content = text.trim();
    if (!content || sending) return;
    const history = [...messages, { role: "user", content }];
    setMessages(history);
    setInput("");
    setSending(true);
    try {
      const { reply, actions, model } = await aiService.chat(workspaceId, history.map(({ role, content: c }) => ({ role, content: c })));
      setMessages([...history, { role: "assistant", content: reply, actions, model }]);
      if (actions?.length) toast.success(`Created ${actions.length} task${actions.length > 1 ? "s" : ""}`);
      onActivity();
    } catch (error) {
      toast.error(error.error || "The assistant couldn't respond");
      setMessages(history.slice(0, -1));
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card pad={false} style={{ display: "flex", flexDirection: "column", height: "60vh", minHeight: 440 }}>
      <CardHead icon={Bot} title="Assistant" pad>
        {messages.length > 0 && <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setMessages([])}>Clear</Button>}
      </CardHead>

      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "grid", alignContent: messages.length ? "start" : "center", gap: 12 }}>
        {messages.length === 0 && (
          <EmptyState icon={Sparkles} title="Ask about your work">

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 14 }}>
              {SUGGESTED_PROMPTS.map((p) => <button key={p} className="pc-chip" onClick={() => send(p)}>{p}</button>)}
            </div>
          </EmptyState>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div
              style={{
                maxWidth: "85%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid var(--line)",
                background: m.role === "user" ? "var(--blue, #4d8dff)" : "var(--panel2, var(--panel))",
                color: m.role === "user" ? "#fff" : "var(--text)",
                fontSize: 13,
              }}
            >
              {m.role === "user" ? <span style={{ whiteSpace: "pre-wrap" }}>{m.content}</span> : <Markdown text={m.content} />}
              {m.model && <div className="pc-dim" style={{ fontSize: 11, marginTop: 6 }}>{m.model}</div>}
              {m.actions?.map((a) => (
                <Link key={a.taskId} className="pc-link" style={{ display: "block", marginTop: 6, fontSize: 12 }} to={`/project/${maskId(a.projectId)}/task/${maskId(a.taskId)}`}>
                  Created {a.taskKey}: {a.title}
                </Link>
              ))}
            </div>
          </div>
        ))}

        {sending && <span className="pc-dim" style={{ fontSize: 12 }}>Thinking…</span>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid var(--line)" }}>
        <input className="pc-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask the assistant…" maxLength={4000} />
        <Button variant="primary" icon={Send} type="submit" disabled={sending || !input.trim()} aria-label="Send" />
      </form>
    </Card>
  );
};

const PlanDay = ({ workspaceId, onActivity }) => {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      setPlan(await aiService.planDay(workspaceId));
      onActivity();
    } catch (error) {
      toast.error(error.error || "Couldn't build a plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHead icon={CalendarCheck} title="Plan my day" />
      <p className="pc-muted" style={{ marginTop: 0 }}>Looks at the open tasks assigned to you and suggests what to focus on today.</p>
      <Button variant="primary" icon={CalendarCheck} loading={loading} onClick={generate}>{plan ? "Regenerate plan" : "Plan my day"}</Button>
      {plan && (
        <div style={{ marginTop: 16, padding: 14, border: "1px solid var(--line)", borderRadius: 8 }}>
          <Badge>Based on {plan.taskCount} open tasks</Badge>
          <div style={{ marginTop: 8 }}><Markdown text={plan.reply} /></div>
        </div>
      )}
    </Card>
  );
};

const Breakdown = ({ workspaceId, onActivity }) => {
  const [tasks, setTasks] = useState([]);
  const [taskId, setTaskId] = useState("");
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    taskService.getWorkspaceTasks(workspaceId).then((res) => setTasks((res.data || []).filter((t) => t.status !== "done"))).catch(() => setTasks([]));
  }, [workspaceId]);

  const suggest = async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const { subtasks } = await aiService.breakdownTask(taskId);
      setSuggestions(subtasks);
      onActivity();
    } catch (error) {
      toast.error(error.error || "Couldn't break down this task");
    } finally {
      setLoading(false);
    }
  };

  // Save exactly the suggestions shown, through the regular subtask API
  const addAll = async () => {
    setLoading(true);
    try {
      for (const s of suggestions) await taskService.createSubtask(taskId, { title: s.title, description: s.description });
      toast.success(`Added ${suggestions.length} subtasks`);
      setSuggestions(null);
    } catch (error) {
      toast.error(error.error || "Couldn't add the subtasks");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHead icon={ListTree} title="Task breakdown" />
      <p className="pc-muted" style={{ marginTop: 0 }}>Pick a task and get a suggested list of subtasks.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select className="pc-select" style={{ flex: 1, minWidth: 220 }} value={taskId} onChange={(e) => { setTaskId(e.target.value); setSuggestions(null); }}>
          <option value="">Select a task…</option>
          {tasks.map((t) => <option key={t._id} value={t._id}>{t.taskKey ? `${t.taskKey} · ` : ""}{t.title}</option>)}
        </select>
        <Button variant="primary" icon={ListTree} loading={loading} disabled={!taskId} onClick={suggest}>Suggest subtasks</Button>
      </div>
      {suggestions && (
        <div style={{ marginTop: 16, padding: 14, border: "1px solid var(--line)", borderRadius: 8, display: "grid", gap: 10 }}>
          <ol style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8, fontSize: 13 }}>
            {suggestions.map((s, i) => <li key={i}><b>{s.title}</b><div className="pc-dim">{s.description}</div></li>)}
          </ol>
          <div><Button variant="primary" loading={loading} onClick={addAll}>Add these as subtasks</Button></div>
        </div>
      )}
    </Card>
  );
};

const AIModePage = () => {
  const { currentWorkspace } = useWorkspace();
  const [status, setStatus] = useState(null);
  const [usage, setUsage] = useState(null);
  const [tab, setTab] = useState("assistant");
  const workspaceId = currentWorkspace?._id;

  useEffect(() => {
    aiService.getStatus().then(setStatus).catch(() => setStatus({ enabled: false }));
  }, []);

  const loadUsage = useCallback(() => {
    if (!workspaceId) return;
    aiService.getUsage(workspaceId).then(setUsage).catch(() => {});
  }, [workspaceId]);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  return (
    <Layout>
      <div className="pc-page">
        <PageHead title="AI Mode">
          {status?.enabled && (
            <Badge tone="blue" title={(status.providers || []).map((p) => `${p.name}: ${p.models.join(", ")}`).join(" | ")}>
              <Sparkles size={11} /> {(status.providers || []).map((p) => p.name).join(" → ") || status.model}
            </Badge>
          )}
        </PageHead>

        {status === null || !workspaceId ? (
          <Skeleton h={300} />
        ) : !status.enabled ? (
          <Banner tone="warn" icon={Sparkles}>
            AI Mode isn't set up yet. Add an API key and model list for OpenRouter, GroqCloud or DeepSeek in <code>server/.env</code> (see <code>.env.example</code>) and restart the server.
          </Banner>
        ) : (
          <>
            {usage && (
              <KpiStrip
                items={[
                  { label: "Interactions · 30d", value: usage.interactions, hl: true },
                  { label: "Tasks created", value: usage.tasksCreated },
                  { label: "Day plans", value: usage.plans },
                  { label: "Breakdowns", value: usage.breakdowns },
                ]}
              />
            )}
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { value: "assistant", label: "Assistant", icon: <Bot size={13} /> },
                { value: "plan", label: "Plan my day", icon: <CalendarCheck size={13} /> },
                { value: "breakdown", label: "Task breakdown", icon: <ListTree size={13} /> },
              ]}
            />
            {/* Keep the assistant mounted so the conversation survives tab switches */}
            <div style={{ display: tab === "assistant" ? "block" : "none" }}><Assistant workspaceId={workspaceId} onActivity={loadUsage} /></div>
            {tab === "plan" && <PlanDay workspaceId={workspaceId} onActivity={loadUsage} />}
            {tab === "breakdown" && <Breakdown workspaceId={workspaceId} onActivity={loadUsage} />}
          </>
        )}
      </div>
    </Layout>
  );
};

export default AIModePage;
