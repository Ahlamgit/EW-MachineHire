# EW Machine Hire — Business Rules

**Status legend:** **Confirmed** | **Proposed** | **Open**

Do not invent rules. Unresolved items belong in `docs/OPEN_QUESTIONS.md` and must not be silently “resolved” in code.

---

## 1. Compliance (Confirmed)

1. Compliance records must retain their **actual document dates** and expiry-related information.
2. Status calculation bands (based on age / elapsed period from document context as defined by stakeholders):
   - **Green:** less than 9 months
   - **Yellow:** 9 months or more, but less than 10 months
   - **Red:** 10 months or more
3. **Missing** required compliance documents must be clearly identified in the UI and hiring checks.
4. Do **not** calculate compliance using invented dates or assumptions.

### Open (compliance)

- Exact definition of “road tracks” in compliance requirements — see `OPEN_QUESTIONS.md`.
- Behaviour when compliance expires **during** an active hire — see `OPEN_QUESTIONS.md`.

---

## 2. Hiring restrictions (Confirmed)

A machine **cannot** be hired if any of the following are true:

1. It is **already hired**.
2. It is **undergoing fixing or repair**.
3. Any **required** compliance status is **missing**, **yellow**, or **red**.

Additional Confirmed rules:

4. Prevent two users from hiring the same machine simultaneously — enforce at the **database level** where appropriate (constraints / transactional checks), not only in the frontend.
5. A hire must have an **explicit closure** process (no silent or implicit end without a recorded closure event).
6. Preserve the **full hiring history** for every machine.

### Open (hiring)

- Whether one hire agreement may contain **multiple machines** — **do not assume** until confirmed.
- Whether hiring hours are based on **operating hours** or **elapsed time**.
- Billing / invoicing / deposits / customer balances — not confirmed in scope.
- Operator assignment model (machine vs hire agreement).

---

## 3. Machine history (Confirmed)

Maintain a **permanent**, append-only history of machine activity, including at least:

- Hiring (agreements / events)
- Readings / operating hours
- Fuel events
- Tyre events
- Spare parts usage
- Maintenance / servicing
- Breakdowns and repairs
- Documents
- Changes made by users (audit)

**Rule:** Do **not** overwrite historical event records when a new event is recorded. Corrections, if ever allowed, must be **Proposed** as compensating entries or explicit amendment records — not silent edits of history (decision Open until approved).

---

## 4. Hire durations (Confirmed support; calculation Open)

The system must be able to represent:

- Hourly
- Daily
- Monthly
- Open-ended

**Open:** Exact billing and time-calculation rules (pro-rata, overtime, minimum periods, etc.). Do not hard-code unconfirmed pricing logic.

---

## 5. Maintenance & workshop (Confirmed scope; thresholds Open)

Confirmed capability areas:

- Maintenance schedules
- Servicing records
- Breakdowns
- Repairs
- Spare parts used on jobs

**Open:** Exact maintenance scheduling thresholds (hours/km/calendar). Keep thresholds **configurable** in settings rather than hard-coded constants until approved.

---

## 6. Units and currencies (Confirmed)

1. Do **not** combine values of different units without an **explicit conversion** step recorded in the system.
2. Preserve **original values and units** on stored records.
3. **Open:** Which currencies and measurement units are required for production (ZMW assumed Proposed for Zambia ops; confirm).

---

## 7. Spare parts (Proposed scope / Open inventory)

- Recording spare parts used against a machine/job is in the module list (**Confirmed** as a module).
- Whether full **inventory / stock control** (on-hand qty, reorder, warehouses) is required is **Open**.

---

## 8. Branches, sites, and access (Proposed / Open)

- Branches, sites, and locations are a Confirmed module.
- Whether multiple branches require **restricted access** (data isolation by branch) is **Open**.

---

## 9. Notifications (Proposed / Open)

- In-app notifications and alerts are a Confirmed module.
- Whether **email** notifications are required is **Open**.

---

## 10. Data integrity principles (Proposed — align with Confirmed history rules)

| Principle | Status |
|-----------|--------|
| UUID primary keys | Confirmed (technical) |
| Foreign keys for relationships | Confirmed (technical) |
| Soft-delete vs hard-delete for master data | Proposed — prefer soft-delete for machines/customers; hard rules Open |
| Demo data never mixed with production without labels | Confirmed for Phase 1 UI |

---

## 11. Rule change process

1. Stakeholder answers an item in `docs/OPEN_QUESTIONS.md`.
2. Move the decision into this file as **Confirmed** (with date/decision note).
3. Update `docs/DATABASE.md` / schemas and application validation accordingly.
4. Never encode Open rules as silent defaults in production paths.
