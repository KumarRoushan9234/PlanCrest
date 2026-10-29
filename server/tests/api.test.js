import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.JWT_SECRET = "test-secret-test-secret-test-secret-1234";
process.env.NODE_ENV = "test";
process.env.EMAIL_USER = "";
process.env.EMAIL_PASS = "";

let mongod;
let app;
let User;
let signSessionToken;

const makeUser = (name) =>
  User.create({ name, email: `${name.toLowerCase()}@example.com`, password: "Passw0rd!123", isVerified: true });
const as = (user) => ({ Authorization: `Bearer ${signSessionToken(user)}` });

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri("plancrest-test"));
  ({ default: app } = await import("../app.js"));
  ({ default: User } = await import("../models/user.js"));
  ({ signSessionToken } = await import("../utils/session.js"));
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe("API basics", () => {
  it("reports health", async () => {
    const res = await request(app).get("/api/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "ok");
  });

  it("requires sign-in for workspaces", async () => {
    const res = await request(app).get("/api/workspaces");
    assert.equal(res.status, 401);
  });

  it("rejects unknown API routes", async () => {
    const res = await request(app).get("/api/nope");
    assert.ok([401, 404].includes(res.status));
  });
});

describe("Workspaces, projects and tasks", () => {
  let owner;
  let outsider;
  let workspace;
  let project;
  let task;

  before(async () => {
    owner = await makeUser("Owner");
    outsider = await makeUser("Outsider");
  });

  it("creates a workspace", async () => {
    const res = await request(app).post("/api/workspaces").set(as(owner)).send({ name: "Acme" });
    assert.equal(res.status, 201);
    workspace = res.body.data;
    assert.equal(workspace.name, "Acme");
  });

  it("creates a project and a task", async () => {
    const p = await request(app).post(`/api/workspaces/${workspace._id}/projects`).set(as(owner)).send({ name: "Website", key: "WEB" });
    assert.equal(p.status, 201);
    project = p.body.data;
    const t = await request(app).post(`/api/projects/${project._id}/tasks`).set(as(owner)).send({ title: "Ship it" });
    assert.equal(t.status, 201);
    task = t.body.data;
    assert.equal(task.taskKey, "WEB-1");
  });

  it("hides workspace data from non-members", async () => {
    const ws = await request(app).get(`/api/workspaces/${workspace._id}`).set(as(outsider));
    assert.equal(ws.status, 403);
    const tk = await request(app).get(`/api/tasks/${task._id}`).set(as(outsider));
    assert.ok([403, 404].includes(tk.status));
  });

  it("tracks time and stops the timer", async () => {
    const start = await request(app).post(`/api/tasks/${task._id}/time/start`).set(as(owner));
    assert.equal(start.status, 201);
    const running = await request(app).get("/api/time/running").set(as(owner));
    assert.ok(running.body.data?.isRunning);
    await request(app).post("/api/time/stop").set(as(owner));
    const log = await request(app).get(`/api/tasks/${task._id}/time`).set(as(owner));
    assert.equal(log.body.data.entries.length, 1);
    assert.equal(log.body.data.entries[0].isRunning, false);
  });

  it("blocks completing a task that is waiting on another", async () => {
    const other = await request(app).post(`/api/projects/${project._id}/tasks`).set(as(owner)).send({ title: "First" });
    const blocker = other.body.data;
    const dep = await request(app).post(`/api/tasks/${task._id}/dependencies`).set(as(owner)).send({ blockedBy: blocker._id });
    assert.equal(dep.status, 201);
    const blocked = await request(app).put(`/api/tasks/${task._id}/status`).set(as(owner)).send({ status: "done" });
    assert.equal(blocked.status, 409);
    const cycle = await request(app).post(`/api/tasks/${blocker._id}/dependencies`).set(as(owner)).send({ blockedBy: task._id });
    assert.equal(cycle.status, 400);
    await request(app).put(`/api/tasks/${blocker._id}/status`).set(as(owner)).send({ status: "done" });
    const ok = await request(app).put(`/api/tasks/${task._id}/status`).set(as(owner)).send({ status: "done" });
    assert.equal(ok.status, 200);
  });
});

describe("AI Mode (OpenRouter)", () => {
  let server;
  let owner;
  let workspace;
  const seen = [];

  before(async () => {
    const http = await import("node:http");
    // A stand-in for OpenRouter: first asks to call a tool, then answers.
    server = http.createServer((req, res) => {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        const payload = JSON.parse(body);
        seen.push({ auth: req.headers.authorization, model: payload.model, tools: payload.tools?.length || 0 });
        const calledTool = payload.messages.some((m) => m.role === "tool");
        const message = calledTool
          ? { role: "assistant", content: "You have 1 project." }
          : { role: "assistant", content: null, tool_calls: [{ id: "call_1", type: "function", function: { name: "list_projects", arguments: "{}" } }] };
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ choices: [{ message, finish_reason: calledTool ? "stop" : "tool_calls" }], usage: { prompt_tokens: 10, completion_tokens: 5 } }));
      });
    });
    await new Promise((r) => server.listen(0, r));
    process.env.OPENROUTER_BASE_URL = `http://127.0.0.1:${server.address().port}`;
    process.env.OPENROUTER_API_KEY = "test-key";
    process.env.OPENROUTER_MODEL = "vendor/test-model";
    // client.js reads the base URL at import time, so load a fresh app instance
    owner = await makeUser("Aiowner");
    const ws = await request(app).post("/api/workspaces").set(as(owner)).send({ name: "AI Co" });
    workspace = ws.body.data;
    await request(app).post(`/api/workspaces/${workspace._id}/projects`).set(as(owner)).send({ name: "Docs", key: "DOC" });
  });

  after(() => server?.close());

  it("reports the model from the environment", async () => {
    const res = await request(app).get("/api/ai/status").set(as(owner));
    assert.equal(res.body.enabled, true);
    assert.equal(res.body.model, "vendor/test-model");
  });

  it("runs the tool loop and returns the final answer", async () => {
    const res = await request(app).post(`/api/ai/workspaces/${workspace._id}/chat`).set(as(owner)).send({ messages: [{ role: "user", content: "How many projects?" }] });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.reply, "You have 1 project.");
    assert.equal(seen[0].auth, "Bearer test-key");
    assert.equal(seen[0].model, "vendor/test-model");
    assert.ok(seen[0].tools > 0);
  });
});
