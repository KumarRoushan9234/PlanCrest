// `npm run dev`: API on demo data (:8000) and web app (:5173), one terminal.
import { spawn } from "node:child_process";

const run = (name, dir, script) => {
  const child = spawn("npm", ["--prefix", dir, "run", script], { stdio: ["ignore", "pipe", "pipe"], shell: true });
  const tag = (chunk) => String(chunk).split(/\r?\n/).filter(Boolean).forEach((line) => console.log(`[${name}] ${line}`));
  child.stdout.on("data", tag);
  child.stderr.on("data", tag);
  child.on("exit", (code) => {
    console.log(`[${name}] exited with ${code}`);
    process.exit(code ?? 0);
  });
  return child;
};

const children = [run("api", "server", "dev:demo"), run("web", "client", "dev")];
const stop = () => children.forEach((c) => c.kill());
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
console.log("Web http://localhost:5173  API http://localhost:8000  Login alex@plancrest.demo / PlanCrest-demo-1");
