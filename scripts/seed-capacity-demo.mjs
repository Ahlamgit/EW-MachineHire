#!/usr/bin/env node
/**
 * Seed DEMO capacity data for free-tier size measurement.
 *
 * - Creates demo_capacity schema (scripts/capacity/schema.sql)
 * - Inserts clearly labeled DEMO rows: users, machines, hire/reading/fuel/
 *   maintenance/compliance *metadata* (no file blobs)
 * - Default machine counts: 160 and 200 (override with --machines=N)
 * - Never prints connection secrets
 *
 * Usage:
 *   DATABASE_URL=postgresql://ewm_capacity:ewm_capacity_local@127.0.0.1:5432/ewm_capacity_demo \
 *     node scripts/seed-capacity-demo.mjs
 *   node scripts/seed-capacity-demo.mjs --machines=180 --reset
 *
 * Requires: `psql` on PATH.
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

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

function parseArgs(argv) {
  const out = { machines: null, reset: false, historyMonths: 12, outJson: null };
  for (const a of argv) {
    if (a === "--reset") out.reset = true;
    else if (a.startsWith("--machines=")) out.machines = Number(a.slice(11));
    else if (a.startsWith("--history-months="))
      out.historyMonths = Number(a.slice(17));
    else if (a.startsWith("--out=")) out.outJson = a.slice(6);
  }
  return out;
}

function sqlLiteral(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value instanceof Date) return `'${value.toISOString()}'`;
  return `'${String(value).replace(/'/g, "''")}'`;
}

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function redactUrl(url) {
  try {
    const u = new URL(url);
    if (u.password) u.password = "***";
    return u.toString();
  } catch {
    return "[unparseable DATABASE_URL]";
  }
}

function runPsql(databaseUrl, sql, { file } = {}) {
  const args = [
    databaseUrl,
    "-v",
    "ON_ERROR_STOP=1",
    "-X",
    "-q",
    "-t",
    "-A",
  ];
  if (file) {
    args.push("-f", file);
  } else {
    args.push("-c", sql);
  }
  const result = spawnSync("psql", args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || "").trim();
    throw new Error(`psql failed (exit ${result.status}): ${err.slice(0, 800)}`);
  }
  return (result.stdout || "").trim();
}

function buildSeedSql({ machineCount, historyMonths, reset }) {
  const types = [
    ["excavator", "Excavator"],
    ["loader", "Loader"],
    ["roller", "Roller"],
    ["generator", "Generator"],
    ["crane", "Crane"],
  ];
  const statuses = ["available", "on_hire", "in_repair", "out_of_service"];
  const docTypes = ["insurance", "roadworthy", "permit", "inspection"];
  const users = [
    ["demo.admin@ew-machinehire.local", "DEMO Admin", "admin"],
    ["demo.ops@ew-machinehire.local", "DEMO Operations", "operations"],
    ["demo.workshop@ew-machinehire.local", "DEMO Workshop", "workshop"],
    ["demo.compliance@ew-machinehire.local", "DEMO Compliance", "compliance"],
  ];

  const lines = [];
  lines.push("BEGIN;");
  lines.push("-- DEMO seed — labeled disposable capacity data");
  if (reset) {
    lines.push("drop schema if exists demo_capacity cascade;");
  }
  lines.push("COMMIT;");

  // schema applied separately; seed assumes schema exists
  const seed = [];
  seed.push("BEGIN;");
  seed.push("truncate table");
  seed.push("  demo_capacity.audit_logs,");
  seed.push("  demo_capacity.compliance_records,");
  seed.push("  demo_capacity.maintenance_records,");
  seed.push("  demo_capacity.tyre_events,");
  seed.push("  demo_capacity.fuel_events,");
  seed.push("  demo_capacity.machine_readings,");
  seed.push("  demo_capacity.hire_events,");
  seed.push("  demo_capacity.hire_items,");
  seed.push("  demo_capacity.hire_agreements,");
  seed.push("  demo_capacity.customers,");
  seed.push("  demo_capacity.machines,");
  seed.push("  demo_capacity.machine_types,");
  seed.push("  demo_capacity.branches,");
  seed.push("  demo_capacity.user_roles,");
  seed.push("  demo_capacity.roles,");
  seed.push("  demo_capacity.profiles");
  seed.push("RESTART IDENTITY CASCADE;");

  const roleIds = {
    admin: randomUUID(),
    operations: randomUUID(),
    workshop: randomUUID(),
    compliance: randomUUID(),
  };
  seed.push(
    `insert into demo_capacity.roles (id, key, label) values
      (${sqlLiteral(roleIds.admin)}, 'admin', 'DEMO Administrator'),
      (${sqlLiteral(roleIds.operations)}, 'operations', 'DEMO Operations'),
      (${sqlLiteral(roleIds.workshop)}, 'workshop', 'DEMO Workshop'),
      (${sqlLiteral(roleIds.compliance)}, 'compliance', 'DEMO Compliance');`,
  );

  const profileIds = [];
  for (const [email, name, roleKey] of users) {
    const id = randomUUID();
    profileIds.push(id);
    seed.push(
      `insert into demo_capacity.profiles (id, email, full_name, is_demo) values
        (${sqlLiteral(id)}, ${sqlLiteral(email)}, ${sqlLiteral(name)}, true);`,
    );
    seed.push(
      `insert into demo_capacity.user_roles (user_id, role_id) values
        (${sqlLiteral(id)}, ${sqlLiteral(roleIds[roleKey])});`,
    );
  }

  const branchIds = [randomUUID(), randomUUID()];
  seed.push(
    `insert into demo_capacity.branches (id, code, name, is_demo) values
      (${sqlLiteral(branchIds[0])}, 'DEMO-NDOLA', 'DEMO Ndola Yard', true),
      (${sqlLiteral(branchIds[1])}, 'DEMO-KITWE', 'DEMO Kitwe Yard', true);`,
  );

  const typeIds = {};
  for (const [key, label] of types) {
    const id = randomUUID();
    typeIds[key] = id;
    seed.push(
      `insert into demo_capacity.machine_types (id, key, label) values
        (${sqlLiteral(id)}, ${sqlLiteral(key)}, ${sqlLiteral(label)});`,
    );
  }

  const customerCount = Math.max(20, Math.round(machineCount / 4));
  const customerIds = [];
  for (let i = 1; i <= customerCount; i++) {
    const id = randomUUID();
    customerIds.push(id);
    seed.push(
      `insert into demo_capacity.customers (id, code, name, contact_email, is_demo) values
        (${sqlLiteral(id)}, ${sqlLiteral(`DEMO-CUST-${String(i).padStart(3, "0")}`)},
         ${sqlLiteral(`DEMO Customer ${i}`)},
         ${sqlLiteral(`demo.customer${i}@example.invalid`)}, true);`,
    );
  }

  const machineIds = [];
  const typeKeys = Object.keys(typeIds);
  for (let i = 1; i <= machineCount; i++) {
    const id = randomUUID();
    machineIds.push(id);
    const typeKey = typeKeys[(i - 1) % typeKeys.length];
    const status = statuses[(i - 1) % statuses.length];
    const branchId = branchIds[(i - 1) % branchIds.length];
    seed.push(
      `insert into demo_capacity.machines
        (id, code, name, type_id, branch_id, status, serial_number, notes, is_demo)
       values
        (${sqlLiteral(id)},
         ${sqlLiteral(`DEMO-${typeKey.slice(0, 3).toUpperCase()}-${String(i).padStart(4, "0")}`)},
         ${sqlLiteral(`DEMO ${typeKey} unit ${i}`)},
         ${sqlLiteral(typeIds[typeKey])},
         ${sqlLiteral(branchId)},
         ${sqlLiteral(status)},
         ${sqlLiteral(`SN-DEMO-${100000 + i}`)},
         ${sqlLiteral("DEMO capacity seed — not a real asset")},
         true);`,
    );
  }

  // History density assumptions (documented in report):
  // ~2.5 closed hires + optional active / machine over historyMonths
  // ~1.5 readings/month, ~3 fuel/month, ~0.25 tyre/month
  // ~0.25 maintenance/month, 4 compliance metadata rows, ~8 audit events/machine
  let hireSeq = 1;
  for (let mi = 0; mi < machineIds.length; mi++) {
    const machineId = machineIds[mi];
    const closedHires = 2 + (mi % 2); // 2 or 3
    for (let h = 0; h < closedHires; h++) {
      const agreementId = randomUUID();
      const itemId = randomUUID();
      const start = daysAgo(30 * (h + 1) * 2 + (mi % 10));
      const end = daysAgo(30 * (h + 1) * 2 + (mi % 10) - 14);
      const customerId = customerIds[mi % customerIds.length];
      const num = `DEMO-HA-${String(hireSeq++).padStart(6, "0")}`;
      seed.push(
        `insert into demo_capacity.hire_agreements
          (id, agreement_number, customer_id, status, started_at, ended_at, notes, is_demo)
         values
          (${sqlLiteral(agreementId)}, ${sqlLiteral(num)}, ${sqlLiteral(customerId)},
           'closed', ${sqlLiteral(start)}, ${sqlLiteral(end)},
           ${sqlLiteral("DEMO closed hire")}, true);`,
      );
      seed.push(
        `insert into demo_capacity.hire_items
          (id, agreement_id, machine_id, status, assigned_at, returned_at, is_demo)
         values
          (${sqlLiteral(itemId)}, ${sqlLiteral(agreementId)}, ${sqlLiteral(machineId)},
           'returned', ${sqlLiteral(start)}, ${sqlLiteral(end)}, true);`,
      );
      for (const [etype, when] of [
        ["opened", start],
        ["assigned", start],
        ["closed", end],
      ]) {
        seed.push(
          `insert into demo_capacity.hire_events
            (id, agreement_id, machine_id, event_type, occurred_at, payload, is_demo)
           values
            (${sqlLiteral(randomUUID())}, ${sqlLiteral(agreementId)}, ${sqlLiteral(machineId)},
             ${sqlLiteral(etype)}, ${sqlLiteral(when)},
             ${sqlLiteral(JSON.stringify({ demo: true, event: etype }))}::jsonb, true);`,
        );
      }
    }

    // Active hire for ~25% of fleet
    if (mi % 4 === 0) {
      const agreementId = randomUUID();
      const start = daysAgo(10 + (mi % 7));
      const customerId = customerIds[mi % customerIds.length];
      const num = `DEMO-HA-${String(hireSeq++).padStart(6, "0")}`;
      seed.push(
        `insert into demo_capacity.hire_agreements
          (id, agreement_number, customer_id, status, started_at, ended_at, notes, is_demo)
         values
          (${sqlLiteral(agreementId)}, ${sqlLiteral(num)}, ${sqlLiteral(customerId)},
           'active', ${sqlLiteral(start)}, NULL,
           ${sqlLiteral("DEMO active hire")}, true);`,
      );
      seed.push(
        `insert into demo_capacity.hire_items
          (id, agreement_id, machine_id, status, assigned_at, returned_at, is_demo)
         values
          (${sqlLiteral(randomUUID())}, ${sqlLiteral(agreementId)}, ${sqlLiteral(machineId)},
           'on_hire', ${sqlLiteral(start)}, NULL, true);`,
      );
      seed.push(
        `insert into demo_capacity.hire_events
          (id, agreement_id, machine_id, event_type, occurred_at, payload, is_demo)
         values
          (${sqlLiteral(randomUUID())}, ${sqlLiteral(agreementId)}, ${sqlLiteral(machineId)},
           'opened', ${sqlLiteral(start)}, '{"demo":true}'::jsonb, true);`,
      );
    }

    const readingCount = Math.round(historyMonths * 1.5);
    for (let r = 0; r < readingCount; r++) {
      seed.push(
        `insert into demo_capacity.machine_readings
          (id, machine_id, reading_hours, occurred_at, notes, is_demo)
         values
          (${sqlLiteral(randomUUID())}, ${sqlLiteral(machineId)},
           ${sqlLiteral(1000 + mi * 10 + r * 40)},
           ${sqlLiteral(daysAgo(Math.round((r * 30) / 1.5)))},
           ${sqlLiteral("DEMO hours reading")}, true);`,
      );
    }

    const fuelCount = historyMonths * 3;
    for (let f = 0; f < fuelCount; f++) {
      seed.push(
        `insert into demo_capacity.fuel_events
          (id, machine_id, litres, occurred_at, odometer_hours, notes, is_demo)
         values
          (${sqlLiteral(randomUUID())}, ${sqlLiteral(machineId)},
           ${sqlLiteral(40 + (f % 30))},
           ${sqlLiteral(daysAgo(f * 10))},
           ${sqlLiteral(1000 + mi * 10 + f * 15)},
           ${sqlLiteral("DEMO fuel")}, true);`,
      );
    }

    const tyreCount = Math.max(2, Math.round(historyMonths * 0.25));
    for (let t = 0; t < tyreCount; t++) {
      seed.push(
        `insert into demo_capacity.tyre_events
          (id, machine_id, event_type, occurred_at, notes, is_demo)
         values
          (${sqlLiteral(randomUUID())}, ${sqlLiteral(machineId)},
           ${sqlLiteral(t % 2 === 0 ? "replace" : "inspect")},
           ${sqlLiteral(daysAgo(t * 90 + 5))},
           ${sqlLiteral("DEMO tyre event")}, true);`,
      );
    }

    const maintCount = Math.max(2, Math.round(historyMonths * 0.25));
    for (let m = 0; m < maintCount; m++) {
      const completed = daysAgo(m * 100 + 3);
      seed.push(
        `insert into demo_capacity.maintenance_records
          (id, machine_id, kind, status, scheduled_at, completed_at, summary, is_demo)
         values
          (${sqlLiteral(randomUUID())}, ${sqlLiteral(machineId)},
           ${sqlLiteral(m % 2 === 0 ? "service" : "repair")},
           'completed', ${sqlLiteral(daysAgo(m * 100 + 10))}, ${sqlLiteral(completed)},
           ${sqlLiteral("DEMO maintenance metadata")}, true);`,
      );
    }

    for (const docType of docTypes) {
      seed.push(
        `insert into demo_capacity.compliance_records
          (id, machine_id, document_type, status, issued_at, expires_at, storage_path, notes, is_demo)
         values
          (${sqlLiteral(randomUUID())}, ${sqlLiteral(machineId)},
           ${sqlLiteral(docType)},
           ${sqlLiteral(mi % 7 === 0 ? "expiring" : "valid")},
           ${sqlLiteral(daysAgo(200).toISOString().slice(0, 10))},
           ${sqlLiteral(daysAgo(-180).toISOString().slice(0, 10))},
           NULL,
           ${sqlLiteral("DEMO compliance metadata — no attachment blob")},
           true);`,
      );
    }

    for (let a = 0; a < 8; a++) {
      seed.push(
        `insert into demo_capacity.audit_logs
          (id, actor_id, entity_type, entity_id, action, payload, occurred_at, is_demo)
         values
          (${sqlLiteral(randomUUID())},
           ${sqlLiteral(profileIds[a % profileIds.length])},
           'machine', ${sqlLiteral(machineId)},
           ${sqlLiteral(["view", "update", "reading", "fuel"][a % 4])},
           ${sqlLiteral(JSON.stringify({ demo: true, i: a }))}::jsonb,
           ${sqlLiteral(daysAgo(a * 12))}, true);`,
      );
    }
  }

  seed.push("COMMIT;");
  return { preamble: lines.join("\n"), seedSql: seed.join("\n") };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.CAPACITY_DATABASE_URL ||
    "postgresql://ewm_capacity:ewm_capacity_local@127.0.0.1:5432/ewm_capacity_demo";

  const machineTargets = args.machines
    ? [args.machines]
    : [160, 200];

  const schemaPath = resolve(ROOT, "scripts/capacity/schema.sql");
  if (!existsSync(schemaPath)) {
    console.error("Missing schema:", schemaPath);
    process.exit(1);
  }

  const psqlCheck = spawnSync("psql", ["--version"], { encoding: "utf8" });
  if (psqlCheck.status !== 0) {
    console.error(
      JSON.stringify({
        ok: false,
        error: "psql not found on PATH. Install PostgreSQL client or run measure-queries.sql manually.",
      }),
    );
    process.exit(1);
  }

  const results = [];

  for (const machineCount of machineTargets) {
    if (args.reset || machineTargets.length > 1 || machineCount === machineTargets[0]) {
      // Always reset between targets when measuring multiple sizes
      runPsql(databaseUrl, "drop schema if exists demo_capacity cascade;");
      runPsql(databaseUrl, undefined, { file: schemaPath });
    }

    const { seedSql } = buildSeedSql({
      machineCount,
      historyMonths: args.historyMonths,
      reset: false,
    });

    const tmpSql = resolve(ROOT, "scripts/capacity/.tmp-seed.sql");
    writeFileSync(tmpSql, seedSql, "utf8");
    try {
      runPsql(databaseUrl, undefined, { file: tmpSql });
    } finally {
      try {
        // keep disk clean; seed SQL can be large
        spawnSync("rm", ["-f", tmpSql]);
      } catch {
        /* ignore */
      }
    }

    const measurePath = resolve(ROOT, "scripts/capacity/measure-queries.sql");
    const measureOut = spawnSync(
      "psql",
      [databaseUrl, "-v", "ON_ERROR_STOP=1", "-X", "-f", measurePath],
      { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
    );
    if (measureOut.status !== 0) {
      throw new Error(
        `measure queries failed: ${(measureOut.stderr || "").slice(0, 500)}`,
      );
    }

    const sizeRow = runPsql(
      databaseUrl,
      `select coalesce(sum(pg_total_relation_size(c.oid)),0)
       from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname='demo_capacity' and c.relkind='r';`,
    );
    const dbSize = runPsql(
      databaseUrl,
      `select pg_database_size(current_database());`,
    );
    const countsRaw = runPsql(
      databaseUrl,
      `select json_object_agg(entity, cnt) from (
         select 'machines' as entity, count(*)::int as cnt from demo_capacity.machines
         union all select 'profiles', count(*)::int from demo_capacity.profiles
         union all select 'hire_agreements', count(*)::int from demo_capacity.hire_agreements
         union all select 'hire_items', count(*)::int from demo_capacity.hire_items
         union all select 'hire_events', count(*)::int from demo_capacity.hire_events
         union all select 'machine_readings', count(*)::int from demo_capacity.machine_readings
         union all select 'fuel_events', count(*)::int from demo_capacity.fuel_events
         union all select 'tyre_events', count(*)::int from demo_capacity.tyre_events
         union all select 'maintenance_records', count(*)::int from demo_capacity.maintenance_records
         union all select 'compliance_records', count(*)::int from demo_capacity.compliance_records
         union all select 'audit_logs', count(*)::int from demo_capacity.audit_logs
         union all select 'customers', count(*)::int from demo_capacity.customers
       ) s;`,
    );

    const bytes = Number(sizeRow);
    const FREE_DB = 524288000;
    const summary = {
      label: "DEMO_CAPACITY",
      machineCount,
      historyMonths: args.historyMonths,
      attachments: "none (storage_path null)",
      users: 4,
      demoCapacityBytes: bytes,
      demoCapacityPretty: `${(bytes / (1024 * 1024)).toFixed(2)} MB`,
      databaseBytes: Number(dbSize),
      databasePretty: `${(Number(dbSize) / (1024 * 1024)).toFixed(2)} MB`,
      pctOfSupabaseFree500MB: Number(((100 * bytes) / FREE_DB).toFixed(3)),
      headroomPctOf500MB: Number((100 * (1 - bytes / FREE_DB)).toFixed(3)),
      counts: JSON.parse(countsRaw),
      connection: redactUrl(databaseUrl),
      assumptions: {
        closedHiresPerMachine: "2–3 over history window",
        activeHireShare: "~25% of fleet",
        readingsPerMonth: 1.5,
        fuelEventsPerMonth: 3,
        tyreEventsPerMonth: 0.25,
        maintenancePerMonth: 0.25,
        complianceDocsPerMachine: 4,
        auditEventsPerMachine: 8,
        noFileBlobs: true,
      },
    };
    results.push(summary);
    console.log(JSON.stringify(summary, null, 2));
  }

  const outPath =
    args.outJson ||
    resolve(ROOT, "scripts/capacity/last-measurement.json");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        measuredAt: new Date().toISOString(),
        note: "DEMO data only. Secrets redacted. Free DB limit assumed 500 MB.",
        results,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({ wrote: outPath.replace(ROOT, "."), resultCount: results.length }),
  );
}

try {
  main();
} catch (err) {
  console.error(
    JSON.stringify({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }),
  );
  process.exit(1);
}
