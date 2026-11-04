/**
 * Integration tests against Postgres when DATABASE_URL or CORE_WORKFLOW_DATABASE_URL
 * is set. Skips cleanly when no credentials are available.
 *
 * Expects Phase 2 + core_workflow migrations already applied.
 * Uses service-role / direct Postgres (bypasses RLS) to assert DB constraints.
 *
 * Usage:
 *   CORE_WORKFLOW_DATABASE_URL=postgres://... node scripts/test-core-workflow-sql.mjs
 *   npm run test:core-workflow-sql
 */
import { createRequire } from "node:module";

const url =
  process.env.CORE_WORKFLOW_DATABASE_URL ||
  process.env.DATABASE_URL ||
  process.env.CAPACITY_DATABASE_URL ||
  "";

if (!url || url.includes("USER:PASSWORD") || url.includes("YOUR_")) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        skipped: true,
        reason:
          "No live DATABASE_URL / CORE_WORKFLOW_DATABASE_URL — local band tests still run via test-compliance-bands.mjs. Apply migrations then re-run this script.",
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

let pg;
try {
  const require = createRequire(import.meta.url);
  pg = require("pg");
} catch {
  console.log(
    JSON.stringify(
      {
        ok: true,
        skipped: true,
        reason:
          "pg package not installed. Optional: npm i -D pg then re-run with DATABASE_URL.",
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const { Client } = pg;
const client = new Client({ connectionString: url });

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  await client.connect();
  const results = [];

  // Band function
  const bandChecks = [
    ["2025-01-15", "2025-10-14", "green"],
    ["2025-01-15", "2025-10-15", "yellow"],
    ["2025-01-15", "2025-11-15", "red"],
  ];
  for (const [doc, asOf, expect] of bandChecks) {
    const { rows } = await client.query(
      `select public.compliance_band_from_document_date($1::date, $2::date) as band`,
      [doc, asOf],
    );
    assert(rows[0].band === expect, `band ${doc}@${asOf} got ${rows[0].band}`);
    results.push({ check: `band_${expect}`, ok: true });
  }

  await client.query("begin");
  try {
    const { rows: machines } = await client.query(
      `insert into public.machines (code, name)
       values ('TEST-CW-1', 'Core workflow test machine')
       returning id`,
    );
    const machineId = machines[0].id;

    const { rows: customers } = await client.query(
      `insert into public.customers (code, name)
       values ('TEST-CUST-1', 'Test Customer')
       returning id`,
    );
    const customerId = customers[0].id;

    // Missing compliance → activation blocked
    const { rows: hireDraft } = await client.query(
      `insert into public.hire_agreements
         (machine_id, customer_id, duration_type, planned_duration_value, status)
       values ($1, $2, 'days', 3, 'draft')
       returning id`,
      [machineId, customerId],
    );
    const hireId = hireDraft[0].id;

    let blocked = false;
    try {
      await client.query(
        `update public.hire_agreements set status = 'active', activated_at = now() where id = $1`,
        [hireId],
      );
    } catch (e) {
      blocked = String(e.message).includes("hire_activation_blocked");
    }
    assert(blocked, "expected compliance block on activate");
    results.push({ check: "block_missing_compliance", ok: true });

    // Make all three green
    for (const type of ["insurance", "fitness", "road_tracks"]) {
      await client.query(
        `insert into public.compliance_records (machine_id, document_type, document_date)
         values ($1, $2, (timezone('utc', now()))::date)`,
        [machineId, type],
      );
    }

    await client.query(
      `update public.hire_agreements set status = 'active', activated_at = now() where id = $1`,
      [hireId],
    );
    results.push({ check: "activate_when_green", ok: true });

    // Second concurrent active hire must fail (unique index / trigger)
    let conflict = false;
    try {
      await client.query(
        `insert into public.hire_agreements
           (machine_id, customer_id, duration_type, planned_duration_value, status, activated_at)
         values ($1, $2, 'days', 1, 'active', now())`,
        [machineId, customerId],
      );
    } catch {
      conflict = true;
    }
    assert(conflict, "expected conflicting active hire to fail");
    results.push({ check: "block_conflicting_hire", ok: true });

    // Close then open fixing → block new hire
    await client.query(
      `update public.hire_agreements
       set status = 'closed', closed_at = now()
       where id = $1`,
      [hireId],
    );
    await client.query(
      `insert into public.machine_fixing_jobs (machine_id, job_kind, status)
       values ($1, 'service', 'open')`,
      [machineId],
    );
    let fixingBlock = false;
    try {
      await client.query(
        `insert into public.hire_agreements
           (machine_id, customer_id, duration_type, planned_duration_value, status, activated_at)
         values ($1, $2, 'open_ended', null, 'active', now())`,
        [machineId, customerId],
      );
    } catch (e) {
      fixingBlock = String(e.message).includes("hire_activation_blocked");
    }
    assert(fixingBlock, "expected open fixing to block hire");
    results.push({ check: "block_open_fixing", ok: true });

    // Append-only compliance
    const { rows: cr } = await client.query(
      `select id from public.compliance_records where machine_id = $1 limit 1`,
      [machineId],
    );
    let appendOnly = false;
    try {
      await client.query(
        `update public.compliance_records set notes = 'x' where id = $1`,
        [cr[0].id],
      );
    } catch {
      appendOnly = true;
    }
    assert(appendOnly, "compliance must be append-only");
    results.push({ check: "compliance_append_only", ok: true });

    await client.query("rollback");
  } catch (e) {
    await client.query("rollback");
    throw e;
  }

  console.log(JSON.stringify({ ok: true, results }, null, 2));
}

main()
  .catch((err) => {
    console.error(JSON.stringify({ ok: false, error: String(err.message || err) }, null, 2));
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await client.end();
    } catch {
      /* ignore */
    }
  });
