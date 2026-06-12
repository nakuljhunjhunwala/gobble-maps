/**
 * Loads .env.local into the environment, then runs the Next.js CLI.
 *
 *   node scripts/with-env.mjs dev
 *   node scripts/with-env.mjs start
 *
 * Needed because Next only reads .env files *after* the HTTP server
 * binds, so PORT in .env.local is ignored by `next dev` / `next start`
 * unless it is already in the process environment. (node's own
 * --env-file flag can't be used: `next dev` re-spawns itself and
 * forwards CLI flags via NODE_OPTIONS, where that flag is forbidden.)
 */
import { existsSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { parseEnv } from "node:util";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");
const fileEnv = existsSync(envPath)
  ? parseEnv(readFileSync(envPath, "utf8"))
  : {};

const nextBin = resolve(root, "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBin, ...process.argv.slice(2)], {
  stdio: "inherit",
  // Real environment variables win over .env.local values.
  env: { ...fileEnv, ...process.env },
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
