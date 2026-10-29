/**
 * Zero-setup development: runs the API against a throwaway in-memory MongoDB
 * seeded with demo data. Nothing is written to any real database.
 *
 *   npm run dev:demo
 */
import fs from "fs";
import os from "os";
import path from "path";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// Reuse a mongod binary that is already downloaded, if one is around.
const cacheDirs = [
  path.join(process.cwd(), "node_modules", ".cache", "mongodb-memory-server"),
  path.join(process.cwd(), "tests", "node_modules", ".cache", "mongodb-memory-server"),
  path.join(os.homedir(), ".cache", "mongodb-binaries"),
];
for (const dir of cacheDirs) {
  if (process.env.MONGOMS_SYSTEM_BINARY || !fs.existsSync(dir)) continue;
  const bin = fs.readdirSync(dir).find((f) => /^mongod(-[\w.-]+)?(\.exe)?$/.test(f));
  if (bin) process.env.MONGOMS_SYSTEM_BINARY = path.join(dir, bin);
}

const mongod = await MongoMemoryServer.create();
process.env.DATABASE = mongod.getUri("plancrest-demo");
process.env.JWT_SECRET ||= "demo-secret-demo-secret-demo-secret-1234";
process.env.NODE_ENV = "development";
// Never send real email from a demo run
process.env.EMAIL_USER = "";
process.env.EMAIL_PASS = "";

await mongoose.connect(process.env.DATABASE);
const { seedDemo } = await import("./seed-demo.js");
await seedDemo();
await mongoose.disconnect();

const stop = async () => {
  await mongod.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

await import("../server.js");
