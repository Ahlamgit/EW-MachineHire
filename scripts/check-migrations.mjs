/**
 * Migration readiness checklist (no DB credentials required).
 * Lists committed SQL under supabase/migrations/ and prints apply steps.
 *
 * Usage: node scripts/check-migrations.mjs
 *        npm run check:migrations
 */
import { readdirSync, existsSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const migrationsDir = resolve(process.cwd(), "supabase/migrations");

if (!existsSync(migrationsDir)) {
  console.error(
    JSON.stringify(
      { ok: false, error: "supabase/migrations/ missing" },
      null,
      2,
    ),
  );
  process.exit(1);
}

const files = readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort();

const details = files.map((name) => {
  const full = join(migrationsDir, name);
  const st = statSync(full);
  return { name, bytes: st.size };
});

const phase2 = files.find((f) => f.includes("phase2_auth_rbac"));

const report = {
  ok: files.length > 0,
  migrationCount: files.length,
  files: details,
  phase2AuthRbacPresent: Boolean(phase2),
  phase2File: phase2 ?? null,
  apply: [
    "npx supabase login",
    "npx supabase link --project-ref YOUR_PROJECT_REF",
    "npx supabase db push",
    "Or paste each .sql file in order in the Supabase SQL editor (staging/dev project only).",
  ],
  afterApply: [
    "Create/invite admin user; insert user_roles admin — docs/AUTH_SETUP.md §4",
    "Set Auth Site URL + /auth/callback for the Netlify origin — docs/STAGING_DEPLOY.md",
    "npm run smoke:auth (optional HTTP probe against NEXT_PUBLIC_APP_URL)",
  ],
  note: "This script does not connect to Postgres. Live apply remains a human/CLI step.",
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok && report.phase2AuthRbacPresent ? 0 : 1);
