# EW Machine Hire — Database Design

**Status legend:** **Confirmed** | **Proposed** | **Open**

**Platform (Confirmed):** Supabase Postgres  
**Identifiers (Confirmed):** UUID primary keys  
**Change control (Confirmed):** All schema changes via migrations (never ad-hoc production DDL)

---

## 1. Migrations approach (Confirmed)

1. Store SQL migrations under `supabase/migrations/` using timestamped filenames, e.g. `YYYYMMDDHHMMSS_description.sql`.
2. Prefer the Supabase CLI (`supabase db diff`, `supabase migration new`, `supabase db push`) in local/dev/CI.
3. Each migration is **forward-only** in production; destructive changes require an explicit review and a follow-up migration.
4. Enable Row Level Security (RLS) on every user-facing table in the same migration that creates the table (or immediately after).
5. Never apply schema changes only from the Supabase dashboard for environments that ship via Git.
6. Seed scripts (if any) must be separate from schema migrations and must never invent production customer/machine data.
7. Service-role keys are **server-only** and must never appear in client bundles (see `docs/ARCHITECTURE.md`).

### Suggested local workflow

```bash
# Proposed tooling once Supabase project exists
npx supabase init          # if not already initialised
npx supabase start         # local stack (optional)
npx supabase migration new <name>
npx supabase db reset      # local only
npx supabase db push       # linked remote (non-production first)
```

Phase 1 ships an empty `supabase/migrations/` directory plus this document. No live project connection.

---

## 2. Design conventions (Confirmed / Proposed)

| Convention | Status |
|------------|--------|
| `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` | Confirmed |
| `created_at timestamptz NOT NULL DEFAULT now()` | Confirmed |
| `updated_at timestamptz NOT NULL DEFAULT now()` | Confirmed |
| Soft-delete via `deleted_at timestamptz NULL` on master data | Proposed |
| snake_case table and column names | Confirmed |
| Explicit FK constraints with documented `ON DELETE` behaviour | Confirmed |
| Partial / composite indexes for hire status, machine status, expiry queries | Confirmed (as pattern) |
| Append-only event / history tables (no in-place overwrite of events) | Confirmed |

---

## 3. Entity catalogue (Proposed — refine before Phase 3+)

Entities below are **Proposed** for evaluation. Do not treat field lists as Confirmed until stakeholders approve and migrations are written.

### 3.1 Identity & access

| Entity | Purpose | Key relationships |
|--------|---------|-------------------|
| `profiles` | App user profile linked to `auth.users` | `id` → `auth.users.id` |
| `roles` | Named roles | — |
| `permissions` | Fine-grained permission keys | — |
| `role_permissions` | Role ↔ permission | FKs to roles, permissions |
| `user_roles` | User ↔ role | FKs to profiles, roles |

### 3.2 Organisation

| Entity | Purpose | Key relationships |
|--------|---------|-------------------|
| `branches` | Operating branches / yards | — |
| `sites` | Customer or job sites / locations | Optional FK → branches / customers |

**Open:** Branch-scoped data access rules.

### 3.3 Fleet & documents

| Entity | Purpose | Key relationships |
|--------|---------|-------------------|
| `machine_types` | Categories (excavator, roller, …) | — |
| `machine_brands` | Brands / OEMs | — |
| `machines` | Individual assets | type, brand, optional branch |
| `machine_documents` | Specs/docs attachments metadata | FK → machines; storage path |
| `compliance_records` | Compliance docs + dates/status inputs | FK → machines |

### 3.4 Customers

| Entity | Purpose | Key relationships |
|--------|---------|-------------------|
| `customers` | Hire customers | Optional branch |
| `customer_contacts` | Contacts for a customer | FK → customers |

### 3.5 Hiring

| Entity | Purpose | Key relationships |
|--------|---------|-------------------|
| `hire_agreements` | Agreement header | FK → customers; optional site/branch |
| `hire_items` | Machine lines on an agreement | FK → hire_agreements, machines |
| `hire_events` | Lifecycle events (open, assign, close, …) | FK → hire_agreements / hire_items / machines |

**Open decision (critical):** Whether one hire agreement may contain **multiple machines**.

- Schema **Proposes** a separate `hire_items` table to allow 1..N machines **if** approved.
- Until confirmed, application workflows must not assume multi-machine agreements are allowed.
- If stakeholders confirm **single machine only**, constrain `hire_items` with a unique agreement id or fold machine_id onto `hire_agreements` in a later migration.

**Confirmed constraint intent:** A machine must not have two overlapping active hires — enforce with exclusion constraint / unique partial index on active hire state (exact status enum **Proposed**).

### 3.6 Operational logs (append-only)

| Entity | Purpose | Key relationships |
|--------|---------|-------------------|
| `machine_readings` | Operating hours (and mileage if required) | FK → machines; optional hire ref |
| `fuel_events` | Fuel records | FK → machines |
| `tyre_events` | Tyre records | FK → machines |
| `spare_parts` | Part catalogue | — |
| `spare_part_events` | Usage / movements | FK → spare_parts, machines; optional maintenance |

**Open:** Full stock/inventory model; mileage tracking requirement.

### 3.7 Maintenance & workshop

| Entity | Purpose | Key relationships |
|--------|---------|-------------------|
| `maintenance_records` | Schedules / service / repair jobs | FK → machines |
| `maintenance_parts` | Parts used on a job | FK → maintenance_records, spare_parts |
| *(breakdowns may be a type on maintenance or separate table)* | Proposed | — |

**Open:** Exact schedule thresholds (store as configurable settings, not hard-coded).

### 3.8 Notifications & audit

| Entity | Purpose | Key relationships |
|--------|---------|-------------------|
| `alerts` | System / compliance / ops alerts | Optional FKs to machine/hire |
| `notification_settings` | Per-user or system prefs | FK → profiles |
| `audit_logs` | Immutable activity log | actor profile id; entity type/id; payload |

### 3.9 Settings

Application settings may live in a `system_settings` key/value table (**Proposed**) for configurable thresholds (maintenance, notification toggles) once confirmed.

---

## 4. Indexes & constraints (Proposed patterns)

Apply concretely in migrations when tables are created:

1. **Active hire uniqueness (per machine):** partial unique index or exclusion constraint on `hire_items` / status where status ∈ active set.
2. **Compliance lookups:** index `(machine_id, document_type, expires_at)` or equivalent.
3. **History timelines:** index `(machine_id, occurred_at DESC)` on event tables.
4. **FK indexes:** index all foreign key columns used in joins/filters.
5. **Soft-delete:** prefer `WHERE deleted_at IS NULL` partial indexes for list queries if soft-delete is adopted.

---

## 5. RLS (Confirmed direction; policies Phase 2+)

- RLS **on** for all application tables.
- Client uses anon/authenticated keys only.
- Privileged admin operations use server-side service role **never** exposed to the browser.
- Exact policies depend on final RBAC and branch isolation answers (**Open**).

---

## 6. Storage (Confirmed direction)

- Use Supabase Storage for machine documents / compliance uploads.
- Store only storage object paths/metadata in Postgres.
- Bucket policies + server validation + virus/size/type checks (**Proposed** detail in Phase 3–4).

---

## 7. Out of scope until confirmed

- Invoicing, payments, customer balances tables.
- Multi-currency ledger.
- Operator assignment tables (operators module not separately listed; may attach later).
- Offline sync tables.

---

## 8. Phase delivery notes

- **Phase 1:** No schema applied; entity catalogue documented.
- **Phase 2 migration:** `supabase/migrations/20261104120000_phase2_auth_rbac.sql` creates `profiles`, `roles`, `permissions`, `role_permissions`, `user_roles`, helpers, RLS, and Proposed seed data. Not applied to production from this repo automation.
- Multi-machine hire agreement decision remains **Open** and must be confirmed before hiring migrations are finalised.
- Branch-scoped RLS is **not** included (Q10 Open).
