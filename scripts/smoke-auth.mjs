/**
 * Auth / staging smoke helper (presence + optional HTTP).
 * Never prints secret values.
 *
 * Usage:
 *   node scripts/smoke-auth.mjs
 *   node scripts/smoke-auth.mjs --url https://<site>.netlify.app
 *   npm run smoke:auth
 *
 * Exit 0 = checks that were requested all passed.
 * Exit 1 = missing local env and/or failed HTTP probe / staging bypass on.
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

const argvUrl = (() => {
  const idx = process.argv.indexOf("--url");
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return null;
})();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bypass = process.env.DEV_ALLOW_UNCONFIGURED_SHELL === "true";
const appUrl =
  argvUrl ||
  process.env.SMOKE_APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  null;

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

// Probe when --url or SMOKE_APP_URL is set. Local NEXT_PUBLIC_APP_URL alone
// (often localhost) is reported but not required to pass HTTP.
const probeTarget = argvUrl || process.env.SMOKE_APP_URL || null;

const http = {
  probed: false,
  base: probeTarget,
  login: null,
  ready: null,
};

async function probe(base) {
  if (!base || isPlaceholder(base, ["YOUR_", "example.com"])) {
    return;
  }
  const origin = base.replace(/\/$/, "");
  http.probed = true;
  http.base = origin;

  try {
    const loginRes = await fetch(`${origin}/login`, {
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
    });
    http.login = {
      status: loginRes.status,
      ok: loginRes.status >= 200 && loginRes.status < 400,
    };
  } catch (err) {
    http.login = { status: null, ok: false, error: String(err.message || err) };
  }

  try {
    const readyRes = await fetch(`${origin}/api/health/ready`, {
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
    });
    let body = null;
    try {
      body = await readyRes.json();
    } catch {
      body = null;
    }
    http.ready = {
      status: readyRes.status,
      ok: readyRes.status === 200,
      supabaseConfigured: body?.supabase?.configured ?? null,
      allowUnconfiguredShell: body?.supabase?.allowUnconfiguredShell ?? null,
      warnings: body?.warnings ?? [],
    };
  } catch (err) {
    http.ready = { status: null, ok: false, error: String(err.message || err) };
  }
}

await probe(probeTarget);

const report = {
  localEnv: {
    configured,
    urlSet,
    clientKeySet,
    clientKeySource,
    serviceRoleSet,
    allowUnconfiguredShell: bypass,
    appUrlReported: appUrl,
  },
  http,
  unverified: [
    "Email invite / password-reset delivery (Titan SMTP) — UNTESTED",
    "Company-PC backup restore drill — UNTESTED",
    "Machines / compliance / hire writes — DEMO stubs only (no tables yet)",
  ],
  nextHumanSteps: [
    "Netlify Free Git import + env — docs/STAGING_DEPLOY.md §1",
    "Apply Phase 2 migration — npm run check:migrations",
    "Supabase Auth Site URL + redirect for *.netlify.app",
    "Sign in as admin; open /users and confirm live RBAC catalogue",
    "docs/STAGING_VERIFY.md checklist",
  ],
  note: "Values intentionally omitted. Titan login issues do not block this smoke.",
};

console.log(JSON.stringify(report, null, 2));

let exitCode = 0;
if (!configured) exitCode = 1;
if (http.probed) {
  if (!http.login?.ok || !http.ready?.ok) exitCode = 1;
  if (http.ready?.allowUnconfiguredShell === true) exitCode = 1;
  if (http.ready?.supabaseConfigured === false) exitCode = 1;
}

process.exit(exitCode);
