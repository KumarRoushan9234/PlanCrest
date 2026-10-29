import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

/**
 * Optional second place for settings: server/config.local.json (git-ignored).
 * Same names as the environment variables. Real environment variables and
 * .env always win, so the file only fills in what is missing.
 */
const configFile = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "config.local.json");
if (fs.existsSync(configFile)) {
  try {
    const values = JSON.parse(fs.readFileSync(configFile, "utf8"));
    for (const [key, value] of Object.entries(values)) {
      if (key.startsWith("_") || value === "" || value == null) continue;
      if (process.env[key] === undefined || process.env[key] === "") process.env[key] = String(value);
    }
  } catch (error) {
    console.error(`config.local.json could not be read: ${error.message}`);
    process.exit(1);
  }
}

const REQUIRED = ["DATABASE", "JWT_SECRET"];

const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(
    `Missing required environment variables: ${missing.join(", ")}.\n` +
      "Copy server/.env.example to server/.env and fill in the values."
  );
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.warn(
    "JWT_SECRET is shorter than 32 characters. Use a long random value in production."
  );
}

export const isProduction = process.env.NODE_ENV === "production";

/**
 * Origins allowed to call the API with credentials.
 * CLIENT_URL may be a comma-separated list.
 */
export const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

export const clientUrl = allowedOrigins[0];
