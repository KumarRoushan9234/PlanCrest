import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Keeps the env examples honest: every variable the code reads is documented,
// and the examples never contain real secrets.

const root = path.resolve(import.meta.dirname, "../..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const walk = (dir) =>
  fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", "dist", "tests"].includes(entry.name)) return [];
    const relative = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(relative) : [relative];
  });

const matches = (files, pattern) => [...new Set(files.flatMap((file) => [...read(file).matchAll(pattern)].map((m) => m[1])))];

// Variables read through a lookup table instead of process.env.NAME
const SERVER_DYNAMIC = ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "SLACK_CLIENT_ID", "SLACK_CLIENT_SECRET", "GROQCLOUD_API_KEY", "GROQCLOUD_MODELS", "DEEPSEEK_API_KEY", "DEEPSEEK_MODELS", "OPENROUTER_MODELS"];
// Only set by tooling or tests, not by people deploying the app
const NOT_FOR_DEPLOYERS = ["NODE_ENV", "API_URL", "MONGOMS_SYSTEM_BINARY"];

const serverVars = [
  ...matches(walk("server").filter((f) => f.endsWith(".js") || f.endsWith(".mjs")), /process\.env\.([A-Z][A-Z0-9_]+)/g),
  ...SERVER_DYNAMIC,
].filter((name) => !NOT_FOR_DEPLOYERS.includes(name));
const clientVars = matches(walk("client/src").filter((f) => /\.jsx?$/.test(f)), /import\.meta\.env\.(VITE_[A-Z0-9_]+)/g);

const documented = (text, name) => new RegExp(`^#?\\s*${name}=`, "m").test(text);

describe("env examples", () => {
  it("document every server variable (root and server/)", () => {
    for (const file of [".env.example", "server/.env.example"]) {
      const text = read(file);
      const missing = serverVars.filter((name) => !documented(text, name));
      assert.deepEqual(missing, [], `${file} is missing: ${missing.join(", ")}`);
    }
  });

  it("document every client variable (root and client/)", () => {
    for (const file of [".env.example", "client/.env.example"]) {
      const text = read(file);
      const missing = clientVars.filter((name) => !documented(text, name));
      assert.deepEqual(missing, [], `${file} is missing: ${missing.join(", ")}`);
    }
  });

  it("have no inline comments (Docker env_file keeps them in the value)", () => {
    for (const file of [".env.example", "server/.env.example", "client/.env.example"]) {
      const bad = read(file).split(/\r?\n/).filter((line) => /^[A-Z][A-Z0-9_]*=.+\s#/.test(line));
      assert.deepEqual(bad, [], `${file} has inline comments`);
    }
  });

  it("contain no real secrets", () => {
    const secretLike = /sk-or-v1-|gsk_[A-Za-z0-9]{10,}|AIzaSy|GOCSPX-|keiro_[a-z0-9]{10,}|mongodb\+srv:\/\/[^<\s]+:[^@\s<]+@/;
    for (const file of [".env.example", "server/.env.example", "client/.env.example", "server/config.example.json"]) {
      assert.ok(!secretLike.test(read(file)), `${file} looks like it contains a real key`);
    }
  });

  it("keep every required variable empty or a safe default", () => {
    for (const file of [".env.example", "server/.env.example"]) {
      const text = read(file);
      assert.match(text, /^JWT_SECRET=$/m, `${file}: JWT_SECRET must be empty`);
      assert.match(text, /^DATABASE=mongodb:\/\/127\.0\.0\.1/m, `${file}: DATABASE must point at localhost`);
    }
  });
});
