/**
 * Local unit tests for Confirmed compliance bands (no DB required).
 * Mirrors src/lib/compliance/bands.ts and SQL compliance_band_from_document_date.
 *
 * Usage: node scripts/test-compliance-bands.mjs
 */
function addCalendarMonths(date, months) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  const target = new Date(Date.UTC(y, m + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target;
}

function parseUtcDateOnly(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) throw new Error(`Invalid date ${value}`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

function band(documentDate, asOf) {
  if (!documentDate) return "missing";
  const doc = parseUtcDateOnly(documentDate);
  const today = parseUtcDateOnly(asOf);
  const nine = addCalendarMonths(doc, 9);
  const ten = addCalendarMonths(doc, 10);
  if (today < nine) return "green";
  if (today < ten) return "yellow";
  return "red";
}

const cases = [
  // document 2025-01-15
  { doc: "2025-01-15", asOf: "2025-01-15", expect: "green" },
  { doc: "2025-01-15", asOf: "2025-10-14", expect: "green" }, // day before +9mo
  { doc: "2025-01-15", asOf: "2025-10-15", expect: "yellow" }, // exactly +9mo
  { doc: "2025-01-15", asOf: "2025-11-14", expect: "yellow" }, // day before +10mo
  { doc: "2025-01-15", asOf: "2025-11-15", expect: "red" }, // exactly +10mo
  { doc: "2025-01-15", asOf: "2026-12-01", expect: "red" },
  { doc: null, asOf: "2025-01-15", expect: "missing" },
];

let failed = 0;
for (const c of cases) {
  const got = band(c.doc, c.asOf);
  const ok = got === c.expect;
  if (!ok) failed += 1;
  console.log(
    `${ok ? "PASS" : "FAIL"} doc=${c.doc} asOf=${c.asOf} => ${got} (want ${c.expect})`,
  );
}

if (failed) {
  console.error(JSON.stringify({ ok: false, failed }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, passed: cases.length }, null, 2));
