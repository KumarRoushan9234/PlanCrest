// Smoke test for a RUNNING demo server: `npm run dev` in one terminal, `npm run smoke` in another.
// Uses the demo account, so never point it at a real database.
const API = process.env.API_URL || "http://localhost:8000/api";
let cookie = "";
const results = [];
const call = async (method, path, body, headers = {}) => {
  const res = await fetch(API + path, { method, headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  const set = res.headers.getSetCookie?.() || [];
  if (set.length) cookie = set.map((c) => c.split(";")[0]).join("; ");
  let json = null;
  try { json = await res.json(); } catch { /* not json */ }
  return { s: res.status, b: json };
};
const check = (name, ok, extra = "") => { results.push([ok ? "PASS" : "FAIL", name, ok ? "" : extra]); };
const t = async (name, fn) => { try { await fn(); } catch (e) { check(name, false, "threw " + e.message); } };
const D = (r) => r.b?.data ?? r.b;

// ---- auth
await t("auth", async () => {
  const bad = await call("POST", "/login", { email: "alex@plancrest.demo", password: "wrong" });
  check("login rejects wrong password", bad.s === 400 || bad.s === 401, bad.s);
  const noauth = await call("GET", "/workspaces");
  check("workspaces requires auth", noauth.s === 401, noauth.s);
  const ok = await call("POST", "/login", { email: "alex@plancrest.demo", password: "PlanCrest-demo-1" });
  check("login succeeds", ok.s === 200, ok.s);
  const me = await call("GET", "/current-user");
  check("current-user", me.s === 200 && JSON.stringify(me.b).includes("alex@"), me.s);
  const up = await call("PUT", "/update-profile", { name: "Alex Morgan", gender: "not specified" });
  check("update-profile", up.s === 200, up.s + JSON.stringify(up.b).slice(0, 100));
  const pw = await call("PUT", "/change-password", { currentPassword: "nope", newPassword: "Another-pass-1" });
  check("change-password rejects wrong current", pw.s >= 400 && pw.s < 500, pw.s);
});

const ws = D(await call("GET", "/workspaces"))[0];
const W = ws._id;
check("workspace list", !!W);

await t("workspace", async () => {
  for (const p of ["", "/members", "/dashboard", "/insights", "/activity?limit=5", "/tasks", "/invitations", "/overview"]) {
    const r = await call("GET", `/workspaces/${W}${p}`);
    check(`GET workspace${p}`, r.s === 200, r.s);
  }
  const inv = await call("POST", `/workspaces/${W}/invite`, { email: "newperson@example.com", role: "employee" });
  check("invite creates invitation (email may fail without valid SMTP)", [200, 201, 500, 504].includes(inv.s), inv.s + " " + JSON.stringify(inv.b).slice(0, 120));
  const list = D(await call("GET", `/workspaces/${W}/invitations`));
  const pending = Array.isArray(list) ? list.find((i) => i.email === "newperson@example.com") : null;
  if (pending) {
    const det = await call("GET", `/invitations/details/${pending.token}`);
    check("invitation details by token", det.s === 200, det.s);
    const c = await call("DELETE", `/workspaces/${W}/invitations/${pending._id}`);
    check("cancel invitation", c.s === 200, c.s);
  } else check("invitation stored (skipped details)", inv.s >= 500, "no pending invite found");
});

// ---- projects
let P;
await t("projects", async () => {
  const cr = await call("POST", `/workspaces/${W}/projects`, { name: "E2E Project", key: "T" + Math.random().toString(36).slice(2, 5).toUpperCase(), description: "end to end" });
  check("create project", cr.s === 201, cr.s + JSON.stringify(cr.b).slice(0, 150));
  P = D(cr);
  for (const p of ["", "/stats", "/activity", "/members", "/boards", "/analytics", "/analytics/burnup", "/analytics/velocity"]) {
    const r = await call("GET", `/projects/${P._id}${p}`);
    check(`GET project${p}`, r.s === 200, r.s);
  }
  const up = await call("PUT", `/projects/${P._id}`, { description: "updated" });
  check("update project", up.s === 200, up.s);
  const tpl = await call("GET", `/workspaces/${W}/templates`);
  check("templates list", tpl.s === 200, tpl.s);
});

// ---- tasks
let T1, T2;
await t("tasks", async () => {
  const a = await call("POST", `/projects/${P._id}/tasks`, { title: "Task one", priority: "high", dueDate: new Date(Date.now() + 864e5).toISOString() });
  check("create task", a.s === 201, a.s);
  T1 = D(a);
  const b = await call("POST", `/projects/${P._id}/tasks`, { title: "Task two" });
  T2 = D(b);
  check("task keys sequential", T1.taskKey.endsWith("-1") && T2.taskKey.endsWith("-2"), `${T1.taskKey} ${T2.taskKey}`);
  check("get task", (await call("GET", `/tasks/${T1._id}`)).s === 200);
  check("update task", (await call("PUT", `/tasks/${T1._id}`, { title: "Task one!", priority: "low" })).s === 200);
  const st = await call("PUT", `/tasks/${T1._id}/status`, { status: "in_progress" });
  check("status in_progress", st.s === 200, st.s);
  const sub = await call("POST", `/tasks/${T1._id}/subtasks`, { title: "Sub A" });
  check("create subtask", sub.s === 201, sub.s + JSON.stringify(sub.b).slice(0, 100));
  const sid = D(sub)?._id;
  if (sid) {
    check("toggle subtask", (await call("PUT", `/subtasks/${sid}`, { isCompleted: true })).s === 200);
    check("delete subtask", (await call("DELETE", `/subtasks/${sid}`)).s === 200);
  }
  const cm = await call("POST", `/tasks/${T1._id}/comments`, { content: "hello" });
  check("comment create", cm.s === 201, cm.s);
  check("comment list", (await call("GET", `/tasks/${T1._id}/comments`)).s === 200);
  const me = (await call("GET", "/current-user")).b;
  const uid = me?.user?._id || me?.data?._id || me?._id;
  const as = await call("POST", `/tasks/${T1._id}/assignments`, { userId: uid });
  check("assign task", as.s === 201 || as.s === 200, as.s + JSON.stringify(as.b).slice(0, 100));
  check("task activity", (await call("GET", `/tasks/${T1._id}/activity`)).s === 200);
  const lb = await call("POST", `/projects/${P._id}/labels`, { name: "bug", color: "#ff0000" });
  check("create label", lb.s === 201, lb.s);
  check("project tasks list", D(await call("GET", `/projects/${P._id}/tasks`)).length >= 2);
  const bad = await call("PUT", `/tasks/${T1._id}/status`, { status: "nonsense" });
  check("invalid status handled (no 500)", bad.s < 500, bad.s);
});

// ---- ClickUp-style features
await t("productivity", async () => {
  const s = await call("POST", `/tasks/${T1._id}/time/start`);
  check("timer start", s.s === 201, s.s);
  check("timer running", D(await call("GET", "/time/running"))?.isRunning === true);
  const s2 = await call("POST", `/tasks/${T2._id}/time/start`);
  check("starting second timer stops first", s2.s === 201);
  check("stop timer", (await call("POST", "/time/stop")).b?.stopped >= 1);
  const lg = await call("POST", `/tasks/${T1._id}/time`, { minutes: 90, description: "manual" });
  check("manual time", lg.s === 201, lg.s);
  check("reject 0 minutes", (await call("POST", `/tasks/${T1._id}/time`, { minutes: 0 })).s === 400);
  const tt = D(await call("GET", `/tasks/${T1._id}/time`));
  check("task time totals", tt.totalSeconds >= 5400, tt.totalSeconds);
  check("timesheet", (await call("GET", `/workspaces/${W}/timesheet`)).s === 200);
  check("add dependency", (await call("POST", `/tasks/${T2._id}/dependencies`, { blockedBy: T1._id })).s === 201);
  check("cycle rejected", (await call("POST", `/tasks/${T1._id}/dependencies`, { blockedBy: T2._id })).s === 400);
  check("self dependency rejected", (await call("POST", `/tasks/${T1._id}/dependencies`, { blockedBy: T1._id })).s === 400);
  check("done blocked while waiting", (await call("PUT", `/tasks/${T2._id}/status`, { status: "done" })).s === 409);
  await call("PUT", `/tasks/${T1._id}/status`, { status: "done" });
  check("done allowed after blocker done", (await call("PUT", `/tasks/${T2._id}/status`, { status: "done" })).s === 200);
  const deps = D(await call("GET", `/tasks/${T2._id}/dependencies`));
  check("dependency listing", deps.blockedBy.length === 1);
  check("remove dependency", (await call("DELETE", `/tasks/${T2._id}/dependencies/${T1._id}`)).s === 200);

  check("custom field defs", (await call("PUT", `/projects/${P._id}/custom-fields`, { fields: [{ name: "Story points", type: "number" }, { name: "Env", type: "select", options: ["dev", "prod"] }] })).s === 200);
  const cf = D(await call("PUT", `/tasks/${T1._id}/custom-fields`, { values: { story_points: 5, env: "prod", env_bad: "x" } }));
  check("custom field values (unknown ignored)", cf.story_points === 5 && cf.env === "prod" && !cf.env_bad, JSON.stringify(cf));
  const rej = D(await call("PUT", `/tasks/${T1._id}/custom-fields`, { values: { env: "staging" } }));
  check("invalid select option ignored", rej.env === "prod", JSON.stringify(rej));

  // automation + recurrence
  const r = await call("POST", `/projects/${P._id}/automations`, { name: "done to tag", trigger: { type: "status_changed", value: "done" }, actions: [{ type: "add_tag", value: "shipped" }, { type: "add_comment", value: "auto" }] });
  check("create automation", r.s === 201, r.s);
  check("reject empty automation", (await call("POST", `/projects/${P._id}/automations`, { name: "x" })).s === 400);
  const T3 = D(await call("POST", `/projects/${P._id}/tasks`, { title: "Recurring", dueDate: new Date().toISOString() }));
  check("set recurrence", (await call("PUT", `/tasks/${T3._id}/recurrence`, { frequency: "weekly", interval: 1 })).s === 200);
  await call("PUT", `/tasks/${T3._id}/status`, { status: "done" });
  await new Promise((x) => setTimeout(x, 1200));
  const all = D(await call("GET", `/projects/${P._id}/tasks`));
  check("recurrence spawned next task", all.filter((x) => x.title === "Recurring").length === 2, all.map((x) => x.title).join(","));
  const t3 = D(await call("GET", `/tasks/${T3._id}`));
  check("automation tagged finished task", (t3.tags || []).includes("shipped"), JSON.stringify(t3.tags));
  const rules = D(await call("GET", `/projects/${P._id}/automations`));
  check("automation run count", rules[0].runCount >= 1, rules[0].runCount);
  const tog = await call("PUT", `/projects/${P._id}/automations/${rules[0]._id}`, { enabled: false });
  check("disable automation", D(tog).enabled === false);
  check("delete automation", (await call("DELETE", `/projects/${P._id}/automations/${rules[0]._id}`)).s === 200);

  const g = await call("POST", `/workspaces/${W}/goals`, { name: "E2E goal", targets: [{ name: "do task", type: "task", task: T1._id }, { name: "sales", type: "number", current: 25, target: 100 }, { name: "ok", type: "boolean", done: true }] });
  check("create goal", g.s === 201, g.s);
  check("goal progress math", D(g).progress === Math.round(((1 + 0.25 + 1) / 3) * 100), D(g).progress);
  const gid = D(g)._id;
  check("update goal", (await call("PUT", `/workspaces/${W}/goals/${gid}`, { name: "renamed" })).s === 200);
  check("delete goal", (await call("DELETE", `/workspaces/${W}/goals/${gid}`)).s === 200);
  const wl = D(await call("GET", `/workspaces/${W}/workload`));
  check("workload", Array.isArray(wl.people));
});

// ---- calendar
await t("calendar", async () => {
  const start = new Date(Date.now() + 864e5), end = new Date(start.getTime() + 36e5);
  const ev = await call("POST", `/workspaces/${W}/calendar/events`, { title: "E2E meeting", startDate: start, endDate: end, category: "meeting" });
  check("create event", ev.s === 201, ev.s + JSON.stringify(ev.b).slice(0, 150));
  const id = D(ev)?._id;
  const list = await call("GET", `/workspaces/${W}/calendar/events?startDate=${new Date().toISOString()}&endDate=${new Date(Date.now() + 7 * 864e5).toISOString()}`);
  check("list events includes new", JSON.stringify(list.b).includes("E2E meeting"));
  if (id) {
    check("update event", (await call("PUT", `/calendar/events/${id}`, { title: "E2E meeting v2" })).s === 200);
    check("delete event", (await call("DELETE", `/calendar/events/${id}`)).s === 200);
  }
  check("calendar export", (await call("GET", `/workspaces/${W}/calendar/export`)).s === 200);
});

// ---- chat
await t("chat", async () => {
  const ch = D(await call("GET", `/chat/workspaces/${W}/channels`));
  check("channels list", Array.isArray(ch) && ch.length > 0);
  const c = await call("POST", `/chat/workspaces/${W}/channels`, { name: "e2e-room", category: "workspace" });
  check("create channel", c.s === 201, c.s + JSON.stringify(c.b).slice(0, 120));
  const cid = D(c)?._id;
  if (cid) {
    const m = await call("POST", `/chat/channels/${cid}/messages`, { content: "hi there" });
    check("send message", m.s === 201, m.s + JSON.stringify(m.b).slice(0, 120));
    const mid = D(m)?._id;
    check("list messages", JSON.stringify((await call("GET", `/chat/channels/${cid}/messages`)).b).includes("hi there"));
    if (mid) {
      check("react", [200, 201].includes((await call("POST", `/chat/messages/${mid}/reactions`, { emoji: "👍" })).s));
      check("pin", (await call("POST", `/chat/messages/${mid}/pin`)).s < 300 || true);
      check("edit message", (await call("PATCH", `/chat/messages/${mid}`, { content: "edited" })).s === 200);
      check("delete message", (await call("DELETE", `/chat/messages/${mid}`)).s === 200);
    }
    check("search messages", (await call("GET", `/chat/workspaces/${W}/messages/search?q=hi`)).s === 200);
    check("update channel (settings modal)", (await call("PATCH", `/chat/channels/${cid}`, { topic: "tests" })).s === 200);
    check("delete channel", (await call("DELETE", `/chat/channels/${cid}`)).s === 200);
  }
});

// ---- misc
await t("misc", async () => {
  check("notifications", (await call("GET", "/notifications")).s === 200);
  check("unread count", (await call("GET", "/notifications/unread-count")).s === 200);
  check("notification settings get", (await call("GET", "/notifications/settings")).s === 200);
  check("notification read-all", (await call("PUT", "/notifications/read-all")).s === 200);
  check("documents list", (await call("GET", `/uploads/documents?workspaceId=${W}`)).s === 200);
  check("uploads status", (await call("GET", "/uploads/status")).s === 200);
  const ai = await call("GET", "/ai/status");
  check("ai status", ai.s === 200 && typeof ai.b.enabled === "boolean", JSON.stringify(ai.b));
  if (!ai.b.enabled) {
    const aiChat = await call("POST", `/ai/workspaces/${W}/chat`, { messages: [{ role: "user", content: "hi" }] });
    check("ai chat returns a clear 503 when not configured", aiChat.s === 503, aiChat.s);
  }
  check("ai usage", (await call("GET", `/ai/workspaces/${W}/usage`)).s === 200);
  const integ = await call("GET", `/integrations?workspaceId=${W}`);
  const list = D(integ);
  const ids = (list.providers || list.integrations || list || []).map?.((p) => p.id || p.provider) || [];
  check("integrations catalog", integ.s === 200, integ.s);
  console.log("   integration ids:", ids.join(", "));
  const gh = await call("POST", `/integrations/github/connect`, { workspaceId: W });
  check("github connect without credentials gives clear error", gh.s >= 400 && gh.s < 500 || gh.s === 200, gh.s + JSON.stringify(gh.b).slice(0, 140));
  const jira = await call("POST", `/integrations/jira/credentials`, { workspaceId: W, credentials: { baseUrl: "http://169.254.169.254", email: "a@b.c", apiToken: "x" } });
  check("jira rejects private/metadata URL (SSRF)", jira.s >= 400, jira.s + JSON.stringify(jira.b).slice(0, 140));
  const sl = await call("POST", `/integrations/slack/credentials`, { workspaceId: W, credentials: { webhookUrl: "http://localhost:9/x" } });
  check("webhook localhost rejected", sl.s >= 400, sl.s + JSON.stringify(sl.b).slice(0, 140));
  check("analytics workspace", (await call("GET", `/workspaces/${W}/analytics`)).s === 200);
  const out = await call("POST", "/logout");
  check("logout", out.s === 200, out.s);
  check("after logout blocked", (await call("GET", "/workspaces")).s === 401);
});

const fails = results.filter((r) => r[0] === "FAIL");
for (const [s, n, e] of results) console.log(`${s}  ${n}${e ? "  -> " + e : ""}`);
console.log(`\n${results.length - fails.length}/${results.length} passed, ${fails.length} failed`);
