#!/usr/bin/env node
/**
 * Measure free-tier usage indicators without printing secrets.
 *
 * Modes:
 * 1) Local / DATABASE_URL Postgres — reports demo_capacity + DB sizes via SQL
 * 2) Supabase Management API (optional) — when SUPABASE_ACCESS_TOKEN + project ref
 *    are set, fetches project usage/stats (never logs the token)
 * 3) Docs-only fallback — prints free ceilings + how to measure when no DB
 *
 * Usage:
 *   DATABASE_URL=postgresql://... node scripts/measure-usage.mjs
 *   node scripts/measure-usage.mjs --from-seed-json=scripts/capacity/last-measurement.json
 *
 * Service-role / access tokens are never printed. Never import this into client bundles.
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const FREE = {
  supabaseDbBytes: 500 * 1024 * 1024,
  supabaseStorageBytes: 1 * 1024 * 1024 * 1024,
  supabaseEgressBytes: 5 * 1024 * 1024 * 1024,
  supabaseMau: 50000,
  netlifyCredits: 300,
  assessedUsers: 4,
  assessedMachinesLow: 160,
  assessedMachinesHigh: 200,
  attachments: "none initially",
};

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
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
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(resolve(ROOT, ".env.local"));
loadEnvFile(resolve(ROOT, ".env"));

function redactUrl(url) {
  try {
    const u = new URL(url);
    if (u.password) u.password = "***";
    return u.toString();
  } catch {
    return "[set]";
  }
}

function projectRefFromUrl(url) {
  if (!url) return null;
  try {
    const host = new URL(url).hostname; // xxx.supabase.co
    const ref = host.split(".")[0];
    return ref && ref !== "YOUR_PROJECT_REF" ? ref : null;
  } catch {
    return null;
  }
}

function runPsql(databaseUrl, sql) {
  const result = spawnSync(
    "psql",
    [databaseUrl, "-v", "ON_ERROR_STOP=1", "-X", "-q", "-t", "-A", "-c", sql],
    { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
  );
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "psql failed").slice(0, 400));
  }
  return (result.stdout || "").trim();
}

function measureLocal(databaseUrl) {
  const schemaExists = runPsql(
    databaseUrl,
    `select exists(select 1 from pg_namespace where nspname='demo_capacity');`,
  );
  if (schemaExists !== "t") {
    return {
      mode: "database",
      connection: redactUrl(databaseUrl),
      demoCapacityPresent: false,
      hint: "Run: node scripts/seed-capacity-demo.mjs",
    };
  }

  const bytes = Number(
    runPsql(
      databaseUrl,
      `select coalesce(sum(pg_total_relation_size(c.oid)),0)
       from pg_class c join pg_namespace n on n.oid=c.relnamespace
       where n.nspname='demo_capacity' and c.relkind='r';`,
    ),
  );
  const dbBytes = Number(
    runPsql(databaseUrl, `select pg_database_size(current_database());`),
  );
  const machines = Number(
    runPsql(databaseUrl, `select count(*) from demo_capacity.machines;`),
  );
  const storagePaths = Number(
    runPsql(
      databaseUrl,
      `select count(storage_path) from demo_capacity.compliance_records;`,
    ),
  );
  const counts = JSON.parse(
    runPsql(
      databaseUrl,
      `select json_object_agg(entity, cnt) from (
         select 'machines'::text as entity, count(*)::int as cnt from demo_capacity.machines
         union all select 'fuel_events', count(*)::int from demo_capacity.fuel_events
         union all select 'machine_readings', count(*)::int from demo_capacity.machine_readings
         union all select 'hire_agreements', count(*)::int from demo_capacity.hire_agreements
         union all select 'compliance_records', count(*)::int from demo_capacity.compliance_records
         union all select 'audit_logs', count(*)::int from demo_capacity.audit_logs
         union all select 'profiles', count(*)::int from demo_capacity.profiles
       ) s;`,
    ),
  );

  return {
    mode: "database",
    connection: redactUrl(databaseUrl),
    demoCapacityPresent: true,
    machines,
    complianceRowsWithStoragePath: storagePaths,
    demoCapacityBytes: bytes,
    demoCapacityPretty: `${(bytes / (1024 * 1024)).toFixed(2)} MB`,
    databaseBytes: dbBytes,
    databasePretty: `${(dbBytes / (1024 * 1024)).toFixed(2)} MB`,
    pctOfSupabaseFree500MB: Number(((100 * bytes) / FREE.supabaseDbBytes).toFixed(3)),
    headroomPctOf500MB: Number(
      (100 * (1 - bytes / FREE.supabaseDbBytes)).toFixed(3),
    ),
    counts,
  };
}

async function measureSupabaseManagement() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const ref =
    process.env.SUPABASE_PROJECT_REF ||
    projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);

  if (!token || token.includes("YOUR_") || !ref) {
    return {
      mode: "supabase_management",
      available: false,
      reason:
        "Set SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF (or a real NEXT_PUBLIC_SUPABASE_URL) to query live project usage. Token never printed.",
    };
  }

  const url = `https://api.supabase.com/v1/projects/${encodeURIComponent(ref)}/database/filesize`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) {
      return {
        mode: "supabase_management",
        available: false,
        projectRef: ref,
        httpStatus: res.status,
        reason:
          "Management API filesize endpoint unavailable or unauthorized. Use Dashboard → Project Settings → Usage, or DATABASE_URL + measure-queries.sql.",
      };
    }
    const body = await res.json();
    // Response shape may vary; never echo secrets — only numeric-ish fields
    return {
      mode: "supabase_management",
      available: true,
      projectRef: ref,
      filesize: body,
      note: "Interpret against Free 500 MB DB / 1 GB Storage ceilings in docs/FREE_TIER_CONSTRAINTS.md",
    };
  } catch (err) {
    return {
      mode: "supabase_management",
      available: false,
      projectRef: ref,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

function hostingEstimate() {
  // Explicit assumptions for 4 internal users, metadata-only, modest SSR
  const assumptions = {
    users: FREE.assessedUsers,
    sessionsPerUserPerDay: 2,
    pageViewsPerSession: 25,
    workingDaysPerMonth: 22,
    avgResponseBytes: 80_000, // HTML/JSON average incl. assets amortized
    productionDeploysPerMonth: 4,
    ssrGbHoursPerMonth: 0.5,
    netlifyCreditCosts: {
      productionDeploy: 15,
      bandwidthPerGb: 20,
      requestsPer10k: 2,
      computePerGbHour: 10,
    },
  };

  const monthlyRequests =
    assumptions.users *
    assumptions.sessionsPerUserPerDay *
    assumptions.pageViewsPerSession *
    assumptions.workingDaysPerMonth;

  const bandwidthGb =
    (monthlyRequests * assumptions.avgResponseBytes) / (1024 * 1024 * 1024);

  const credits = {
    deploys: assumptions.productionDeploysPerMonth * 15,
    bandwidth: bandwidthGb * 20,
    requests: (monthlyRequests / 10000) * 2,
    compute: assumptions.ssrGbHoursPerMonth * 10,
  };
  const creditsTotal = Object.values(credits).reduce((a, b) => a + b, 0);

  return {
    assumptions,
    monthlyRequests: Math.round(monthlyRequests),
    bandwidthGb: Number(bandwidthGb.toFixed(3)),
    netlifyCreditsEstimated: {
      ...Object.fromEntries(
        Object.entries(credits).map(([k, v]) => [k, Number(v.toFixed(2))]),
      ),
      total: Number(creditsTotal.toFixed(2)),
      freeCeiling: FREE.netlifyCredits,
      headroomPct: Number(
        (100 * (1 - creditsTotal / FREE.netlifyCredits)).toFixed(1),
      ),
    },
    supabaseAuthMau: {
      estimated: FREE.assessedUsers,
      freeCeiling: FREE.supabaseMau,
      headroomPct: Number(
        (100 * (1 - FREE.assessedUsers / FREE.supabaseMau)).toFixed(3),
      ),
    },
  };
}

function growthEstimate(demoBytesAt200) {
  // Monthly growth assumptions — metadata only, no attachments
  const assumptions = {
    newMachinesPerMonth: 2,
    bytesPerNewMachineBundle: demoBytesAt200
      ? Math.round(demoBytesAt200 / 200)
      : 40_000,
    extraAuditEventsPerMonth: 2000,
    bytesPerAuditEvent: 400,
    fuelEventsPerExistingMachinePerMonth: 3,
    bytesPerFuelEvent: 200,
    fleetSizeForGrowth: 200,
    attachmentsEnabled: false,
  };

  const monthlyBytes =
    assumptions.newMachinesPerMonth * assumptions.bytesPerNewMachineBundle +
    assumptions.extraAuditEventsPerMonth * assumptions.bytesPerAuditEvent +
    assumptions.fleetSizeForGrowth *
      assumptions.fuelEventsPerExistingMachinePerMonth *
      assumptions.bytesPerFuelEvent;

  return {
    assumptions,
    estimatedMonthlyGrowthBytes: monthlyBytes,
    estimatedMonthlyGrowthPretty: `${(monthlyBytes / (1024 * 1024)).toFixed(2)} MB`,
    note: "Not a failure-date forecast. Headroom changes if attachments or denser logging are enabled.",
  };
}

async function main() {
  const fromSeed = process.argv
    .find((a) => a.startsWith("--from-seed-json="))
    ?.slice("--from-seed-json=".length);

  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.CAPACITY_DATABASE_URL ||
    "postgresql://ewm_capacity:ewm_capacity_local@127.0.0.1:5432/ewm_capacity_demo";

  let local = null;
  let seedSnapshot = null;

  if (fromSeed && existsSync(resolve(ROOT, fromSeed))) {
    seedSnapshot = JSON.parse(readFileSync(resolve(ROOT, fromSeed), "utf8"));
  }

  const psqlOk = spawnSync("psql", ["--version"], { encoding: "utf8" }).status === 0;
  if (psqlOk) {
    try {
      local = measureLocal(databaseUrl);
    } catch (err) {
      local = {
        mode: "database",
        available: false,
        connection: redactUrl(databaseUrl),
        error: err instanceof Error ? err.message : String(err),
      };
    }
  } else {
    local = {
      mode: "database",
      available: false,
      reason: "psql not on PATH",
    };
  }

  const management = await measureSupabaseManagement();
  const hosting = hostingEstimate();

  const bytes200 =
    local?.demoCapacityBytes ||
    seedSnapshot?.results?.find((r) => r.machineCount === 200)?.demoCapacityBytes ||
    seedSnapshot?.results?.[seedSnapshot.results.length - 1]?.demoCapacityBytes ||
    null;

  const growth = growthEstimate(bytes200);

  const limiting = (() => {
    const dbPct = local?.pctOfSupabaseFree500MB ??
      seedSnapshot?.results?.find((r) => r.machineCount === 200)?.pctOfSupabaseFree500MB ??
      null;
    const netlifyUsedPct = 100 - hosting.netlifyCreditsEstimated.headroomPct;
    const ranked = [
      {
        resource: "supabase_db_500mb",
        usedPct: dbPct,
        headroomPct: dbPct == null ? null : Number((100 - dbPct).toFixed(3)),
        note: "Metadata-only DEMO harness vs Free DB ceiling",
      },
      {
        resource: "supabase_storage_1gb",
        usedPct: 0,
        headroomPct: 100,
        note: "No attachments initially — unused until uploads enabled",
      },
      {
        resource: "netlify_credits_300",
        usedPct: Number(netlifyUsedPct.toFixed(2)),
        headroomPct: hosting.netlifyCreditsEstimated.headroomPct,
        note: "Estimated from 4-user traffic assumptions (not live Netlify metrics)",
      },
      {
        resource: "supabase_mau_50k",
        usedPct: Number(
          ((100 * FREE.assessedUsers) / FREE.supabaseMau).toFixed(4),
        ),
        headroomPct: hosting.supabaseAuthMau.headroomPct,
        note: "4 staff users",
      },
    ]
      .filter((c) => c.headroomPct != null)
      .sort((a, b) => a.headroomPct - b.headroomPct);
    return {
      likelyLimiting: ranked[0] || null,
      ranked,
      operationalRiskNotQuota:
        "Supabase Free ~7-day inactivity pause and lack of automatic backups remain operational risks even with high quota headroom.",
    };
  })();

  const report = {
    measuredAt: new Date().toISOString(),
    freeCeilings: FREE,
    local,
    seedSnapshotSummary: seedSnapshot
      ? {
          measuredAt: seedSnapshot.measuredAt,
          results: seedSnapshot.results?.map((r) => ({
            machineCount: r.machineCount,
            demoCapacityPretty: r.demoCapacityPretty,
            pctOfSupabaseFree500MB: r.pctOfSupabaseFree500MB,
            headroomPctOf500MB: r.headroomPctOf500MB,
          })),
        }
      : null,
    supabaseManagement: management,
    hostingConsumptionEstimate: hosting,
    monthlyGrowthEstimate: growth,
    limitingResource: limiting,
    secretsPrinted: false,
  };

  console.log(JSON.stringify(report, null, 2));

  const outDir = resolve(ROOT, "scripts/capacity");
  mkdirSync(outDir, { recursive: true });
  const outFile = resolve(outDir, "usage-report.json");
  writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.error(JSON.stringify({ wrote: "scripts/capacity/usage-report.json" }));
}

main().catch((err) => {
  console.error(
    JSON.stringify({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }),
  );
  process.exit(1);
});
