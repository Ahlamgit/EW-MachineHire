# EW Machine Hire — Permissions (Phase 2)

**Status legend:** **Selected** | **Confirmed** | **Proposed** | **Open**

This document defines the **Proposed** minimum RBAC matrix for Phase 2. It is an engineering baseline for schema, RLS helpers, and UI gates — **not** final business sign-off.

---

## 1. Principles (Proposed)

1. Deny by default; grant explicitly via roles → permissions.
2. Server-side checks + RLS are authoritative; UI hiding is convenience only.
3. Do **not** assume **branch-restricted** data access until Q10 is Confirmed (`docs/OPEN_QUESTIONS.md`).
4. Do **not** expose **financial** information (invoices, payments, balances, rates used for billing) to every user. Finance-related permissions are reserved and **unassigned** until Q9 is Confirmed.
5. Privileged Supabase service-role key remains **server-only**.

---

## 2. Proposed roles

| Role key | Label | Intent |
|----------|-------|--------|
| `admin` | Administrator | Users, roles, settings, full operational access (still no silent finance exposure until Q9) |
| `operations` | Operations / Hire desk | Customers, hire agreements, machine availability views |
| `workshop` | Workshop / Maintenance | Maintenance, breakdowns, spare-part usage logging |
| `compliance` | Compliance officer | Compliance documents and status |
| `viewer` | Viewer / Auditor | Read-only operational data + audit history |

**Open:** Final role catalogue and whether additional roles (e.g. branch manager) are required.

---

## 3. Proposed permission keys

| Permission key | Description |
|----------------|-------------|
| `dashboard:read` | View operational dashboard |
| `machines:read` | View machines |
| `machines:write` | Create/update machines & documents metadata |
| `customers:read` | View customers & contacts |
| `customers:write` | Create/update customers & contacts |
| `hires:read` | View hire agreements & history |
| `hires:write` | Create/update hire agreements & assignments |
| `hires:close` | Explicitly close a hire |
| `compliance:read` | View compliance records/status |
| `compliance:write` | Create/update compliance records |
| `maintenance:read` | View maintenance / breakdowns |
| `maintenance:write` | Create/update maintenance, service, repairs |
| `ops_logs:read` | View readings, fuel, tyres, spare-part events |
| `ops_logs:write` | Record readings, fuel, tyres, spare-part events |
| `reports:read` | View non-financial reports |
| `notifications:read` | View in-app notifications |
| `audit:read` | View audit history |
| `users:manage` | Manage users and role assignments |
| `settings:manage` | Manage system settings |
| `finance:read` | **Reserved** — view financial data (unassigned until Q9) |
| `finance:write` | **Reserved** — mutate financial data (unassigned until Q9) |

---

## 4. Proposed role → permission matrix

| Permission | admin | operations | workshop | compliance | viewer |
|------------|:-----:|:----------:|:--------:|:----------:|:------:|
| `dashboard:read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `machines:read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `machines:write` | ✓ | ✓ | | | |
| `customers:read` | ✓ | ✓ | | | ✓ |
| `customers:write` | ✓ | ✓ | | | |
| `hires:read` | ✓ | ✓ | ✓* | ✓* | ✓ |
| `hires:write` | ✓ | ✓ | | | |
| `hires:close` | ✓ | ✓ | | | |
| `compliance:read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `compliance:write` | ✓ | | | ✓ | |
| `maintenance:read` | ✓ | ✓ | ✓ | | ✓ |
| `maintenance:write` | ✓ | | ✓ | | |
| `ops_logs:read` | ✓ | ✓ | ✓ | | ✓ |
| `ops_logs:write` | ✓ | ✓ | ✓ | | |
| `reports:read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `notifications:read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `audit:read` | ✓ | | | | ✓ |
| `users:manage` | ✓ | | | | |
| `settings:manage` | ✓ | | | | |
| `finance:read` | | | | | |
| `finance:write` | | | | | |

\* Workshop/compliance `hires:read` is Proposed so staff can see active assignment context without hire mutation rights.

---

## 5. Decisions still needing confirmation

| Topic | Why it matters | Source |
|-------|----------------|--------|
| Final roles & matrix | May add/remove grants | This doc — Proposed |
| Branch-restricted access | Changes RLS from org-wide → branch-scoped | Q10 |
| Finance / invoicing in product | Whether `finance:*` is ever granted | Q9 |
| Email notifications | Not a permission key yet; may need `notifications:manage` | Q13 |
| Who may close hires | `hires:close` currently Operations + Admin | Business sign-off |
| Self-service password reset / invite flow | Auth UX | Ops preference |

---

## 6. Live verification status

Until a non-production Supabase project is configured and migrations applied:

- Email/password sign-in, session cookies, and RLS policies are **implemented in code/SQL but not live-verified**.
- See `docs/AUTH_SETUP.md` for private setup steps.
