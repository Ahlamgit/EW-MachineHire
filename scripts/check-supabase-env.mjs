/**
 * Presence-only Supabase env check.
 * Prints whether keys are set / which client-key name resolved — never prints values.
 *
 * Usage (on the machine that has .env.local):
 *   node scripts/check-supabase-env.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

function isPlaceholder(value, needles) {
  if (!value) return true;
  return needles.some((n) => value.includes(n));
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bypass = process.env.DEV_ALLOW_UNCONFIGURED_SHELL === "true";

let clientKeySource = "none";
let clientKeySet = false;
if (anon && !isPlaceholder(anon, ["YOUR_SUPABASE", "YOUR_ANON"])) {
  clientKeySource = "anon";
  clientKeySet = true;
} else if (
  publishable &&
  !isPlaceholder(publishable, ["YOUR_SUPABASE", "YOUR_PUBLISHABLE"])
) {
  clientKeySource = "publishable";
  clientKeySet = true;
}

const urlSet = Boolean(url && !isPlaceholder(url, ["YOUR_PROJECT_REF"]));
const serviceRoleSet = Boolean(
  serviceRole && !isPlaceholder(serviceRole, ["YOUR_SUPABASE", "YOUR_SERVICE"]),
);
const configured = urlSet && clientKeySet;

const report = {
  configured,
  urlSet,
  clientKeySet,
  clientKeySource,
  serviceRoleSet,
  allowUnconfiguredShell: bypass,
  note: "Values intentionally omitted. Run on the host that has .env.local.",
};

console.log(JSON.stringify(report, null, 2));
process.exit(configured ? 0 : 1);
