# EW Machine Hire — Open Questions

**Status:** All items below are **Open** until a stakeholder decision is recorded.  
Do not silently resolve these in application logic. When answered, move the decision into `docs/BUSINESS_RULES.md` / `docs/DATABASE.md` as **Confirmed** and note the date.

---

## Hiring & agreements

### Q1. Multiple machines per hire agreement?

**Question:** Can one hire agreement contain multiple machines?  
**Impact:** Schema shape (`hire_agreements` only vs `hire_items` lines), UI for assignment, billing lines, closure rules.  
**Current stance:** Proposed schema includes `hire_items` for flexibility, but workflows must **not** assume multi-machine is allowed until confirmed.

### Q4. Basis for hiring hours?

**Question:** Are hiring hours based on **operating hours** (meter) or **elapsed time** (clock/calendar), or both depending on agreement type?  
**Impact:** Readings integration, billing, open-ended hire calculation.

### Q5. Compliance expiry during active hire?

**Question:** What happens if compliance expires (or turns yellow/red) while a hire is active?  
**Impact:** Alerts, forced off-hire, grace periods, legal/ops process.

### Q7. Operator assignment?

**Question:** Are operators assigned to **machines**, to **hire agreements**, to both, or not tracked in this system?  
**Impact:** New entities, UI, permissions. (Operators are not a separate Selected module today.)

---

## Compliance & maintenance

### Q3. Meaning of “road tracks”?

**Question:** What exactly does “road tracks” mean as a compliance artefact (document type, inspection certificate, physical-track reference, roadworthiness paper, other)?  
**Impact:** Labels, upload types, validation copy.  
**Already Confirmed (do not reopen):** Insurance, fitness, and road tracks share the **same renewal cycle** and status bands; status uses each record’s actual document Date; renewals recalculate only that document and preserve prior records — see `docs/BUSINESS_RULES.md`.

### Q6. Maintenance scheduling thresholds?

**Question:** What are the exact maintenance scheduling thresholds (engine hours, calendar days, mileage, combinations)?  
**Impact:** Scheduler, alerts, settings defaults.  
**Current stance:** Keep thresholds **configurable**; do not hard-code unconfirmed numbers.

---

## Inventory, metering & finance

### Q2. Spare-parts inventory / stock control?

**Question:** Is spare-parts **inventory and stock control** required (on-hand quantities, warehouses, reorder), or only usage logging against machines/jobs?  
**Impact:** `spare_parts` / event model complexity, warehouse UX.

### Q8. Mileage tracking?

**Question:** Is mileage (odometer) tracking required in addition to operating hours?  
**Impact:** `machine_readings` shape, unit handling, maintenance triggers.

### Q9. Invoicing, payments, and balances?

**Question:** Are invoicing, payments, and customer balances included in this product scope?  
**Impact:** Entire finance subdomain; Phase plan may need an extra track if Confirmed.

### Q11. Currencies and measurement units?

**Question:** Which currencies and measurement units are required (e.g. ZMW, litres, hours, km, miles)?  
**Impact:** Validation, reporting, conversion rules (Confirmed: never combine units without explicit conversion).

---

## Organisation & scale

### Q10. Multiple branches with restricted access?

**Question:** Are there multiple branches with **restricted** data access (users only see their branch), or shared fleet visibility?  
**Impact:** RLS policies, UX filters, admin model.

### Q12. Expected scale?

**Question:** What is the expected number of machines and users (order of magnitude)?  
**Impact:** Indexing, caching, pagination, hosting sizing — not a Phase 1 blocker.  
**Free-tier note (2026-11-04):** Zero ongoing fees preference means production hosting fit depends on this answer. Bounded assumptions and gaps are recorded in [`FREE_TIER_CONSTRAINTS.md`](./FREE_TIER_CONSTRAINTS.md) until Q12 is Confirmed.  
**Working assessment (2026-11-04, not yet Confirmed):** **4 users**, **>150 machines** (measure bounds 160–200), **no attachments initially**. Local DEMO harness + headroom notes in [`FREE_TIER_CONSTRAINTS.md`](./FREE_TIER_CONSTRAINTS.md) §9. Replace with Confirmed figures when stakeholders lock scale.

---

## Notifications

### Q13. Email notifications?

**Question:** Are email notifications required (compliance expiry, hire events, maintenance due), or in-app only for v1?  
**Impact:** Provider choice, templates, notification_settings, privacy.  
**Free-tier note (2026-11-04):** Paid notification SaaS conflicts with zero ongoing fees ([`PREFERENCES.md`](./PREFERENCES.md)). Prefer in-app or existing company SMTP; see [`FREE_TIER_CONSTRAINTS.md`](./FREE_TIER_CONSTRAINTS.md).

---

## Decision log

| ID | Decision | Date | Decided by | Notes |
|----|----------|------|------------|-------|
| — | — | — | — | No decisions recorded yet |

---

## How to answer

1. Record the decision in the table above.  
2. Update `docs/BUSINESS_RULES.md` and, if needed, `docs/DATABASE.md` / `docs/PRD.md`.  
3. Open an implementation task in the appropriate development phase (`docs/DEVELOPMENT_PLAN.md`).
