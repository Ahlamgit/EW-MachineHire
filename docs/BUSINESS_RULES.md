# EW Machine Hire — Business Rules

**Status legend**

| Label | Meaning |
|-------|---------|
| **Selected** | Chosen project direction (stack, modules, intended platform approach) |
| **Confirmed** | Stakeholder-approved business rule — implement as stated |
| **Proposed** | Engineering recommendation pending confirmation |
| **Open** | Unresolved — do not invent an answer in code |

Do not invent rules. Unresolved items belong in `docs/OPEN_QUESTIONS.md` and must not be silently “resolved” in code.

---

## 1. Compliance (Confirmed)

### 1.1 Document types sharing the renewal cycle

**Insurance**, **fitness**, and **road tracks** use the **same renewal cycle** and the same status bands below.

> **Open (definition only):** What “road tracks” means as a document/artefact is still Open (see `docs/OPEN_QUESTIONS.md` Q3). The shared cycle and status bands are Confirmed regardless.

### 1.2 Actual document Date (not entry time)

Status must be calculated from each compliance record’s **actual document Date** (the date on / for the document), **not** from the application’s record-creation / entry timestamp.

### 1.3 Status bands (from the document Date)

| Status | Age from document Date |
|--------|-------------------------|
| **Green** | Under 9 months |
| **Yellow** | From 9 months up to **under** 10 months |
| **Red** | From 10 months **onward**, including 11 months and beyond |

### 1.4 Missing documents

Required compliance documents that are absent must be clearly identified as **missing** in the UI and in hiring eligibility checks.

### 1.5 Renewal behaviour

- A **renewal** creates / records a new document Date for **that** compliance document only.
- Status is **recalculated only for that document** from its **new** Date.
- **Preserve all previous compliance records** (append-only history — do not overwrite or delete prior documents when renewing).

### 1.6 Do not invent dates

Do **not** calculate compliance using invented dates or assumptions.

### Open (compliance — process)

- Behaviour when compliance expires (or turns yellow/red) **during** an active hire — see `OPEN_QUESTIONS.md` Q5.

---

## 2. Hiring restrictions (Confirmed)

A machine **cannot** be hired (new hire) if any of the following are true:

1. It is **already hired**.
2. It is undergoing **any fixing**, including:
   - routine **service**, and/or
   - **breakdown repair**, and/or
   - other repair / fixing work that takes the machine out of hire-ready state.
3. Any **required** compliance status is **missing**, **yellow**, or **red**.

Additional Confirmed rules:

4. Prevent two users from hiring the same machine simultaneously — enforce at the **database level** where appropriate (constraints / transactional checks), not only in the frontend.
5. **Manual / explicit closure** is required for **every** hire, including **fixed-duration** hires. Do not auto-close a hire solely because an end date/time has passed; closure must be an explicit recorded action.
6. Preserve the **full hiring history** for every machine.

### Open (hiring)

- Whether one hire agreement may contain **multiple machines** — **do not assume** until confirmed (Q1).
- Whether hiring hours are based on **operating hours** or **elapsed time** (Q4).
- Billing / invoicing / deposits / customer balances — not confirmed in product scope (Q9).
- Operator assignment model (machine vs hire agreement) (Q7).

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

Fixed-duration designs still require **manual closure** (see §2.5).

**Open:** Exact billing and time-calculation rules (pro-rata, overtime, minimum periods, etc.). Do not hard-code unconfirmed pricing logic.

---

## 5. Maintenance & workshop (Confirmed scope; thresholds Open)

Confirmed capability areas:

- Maintenance schedules
- Servicing records
- Breakdowns
- Repairs
- Spare parts used on jobs

**Confirmed hire interaction:** While a machine is in fixing / service / repair (see §2.2), it is **not** available for a new hire.

**Open:** Exact maintenance scheduling thresholds (hours/km/calendar). Keep thresholds **configurable** in settings rather than hard-coded constants until approved (Q6).

---

## 6. Units and currencies (Confirmed principle)

1. Do **not** combine values of different units without an **explicit conversion** step recorded in the system.
2. Preserve **original values and units** on stored records.
3. **Open:** Which currencies and measurement units are required for production (Q11).

---

## 7. Spare parts (Selected module / Open inventory depth)

- Spare parts management is a **Selected** product module.
- Whether full **inventory / stock control** (on-hand qty, reorder, warehouses) is required is **Open** (Q2).

---

## 8. Branches, sites, and access (Selected module / Open ACL)

- Branches, sites, and locations are a **Selected** module.
- Whether multiple branches require **restricted access** (data isolation by branch) is **Open** (Q10). Do **not** assume branch restrictions in Phase 2 auth.

---

## 9. Notifications (Selected module / Open email)

- In-app notifications and alerts are a **Selected** module — use this channel first for operational alerts.
- Whether **email** notifications are required is **Open** (Q13); treat email alerts as optional until Confirmed.
- Auth invite / password-reset delivery (separate from Q13) should use existing Titan SMTP via Supabase custom SMTP with **no new recurring fees** — see [`EMAIL_SMTP.md`](./EMAIL_SMTP.md) (**UNTESTED** until operators run the staging checks).

---

## 10. Data integrity principles

| Principle | Status |
|-----------|--------|
| UUID primary keys | Selected (technical) |
| Foreign keys for relationships | Selected (technical) |
| Soft-delete vs hard-delete for master data | Proposed — prefer soft-delete for machines/customers |
| Demo data never mixed with production without labels | Confirmed for foundation UI |

---

## 11. Rule change process

1. Stakeholder answers an item in `docs/OPEN_QUESTIONS.md`.
2. Move the decision into this file as **Confirmed** (with date/decision note).
3. Update `docs/DATABASE.md` / schemas and application validation accordingly.
4. Never encode Open rules as silent defaults in production paths.
