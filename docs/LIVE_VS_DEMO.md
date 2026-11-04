# Live vs DEMO matrix (customer-test honest scope)

**Branch intent:** persistent Supabase-backed core hire workflow for customer test (zero ongoing fees).  
**Rule:** Auth may be present in code while still **implemented, unverified** until Phase 2 migration + live sign-in checks. Never treat DEMO numbers as production data. Do not wait on Netlify/Titan/DNS for this workflow.

| Area | Route / surface | Saves to Supabase? | Reads Supabase? | UI label |
|------|-----------------|--------------------|-----------------|----------|
| **Auth sign-in** | `/login` | Auth users via Supabase Auth (not app tables) | Session via Auth | **Implemented, unverified** until migration + live checks |
| **Auth callback** | `/auth/callback` | Session cookies | Auth code exchange | **Implemented, unverified** |
| **Sign-out** | header action | Clears Auth session | — | **Implemented, unverified** |
| **Middleware session** | protected shell | Refresh cookies | `auth.getUser()` | **Implemented, unverified** when configured |
| **Session + roles** | `getAuthContext()` | No | `user_roles`, RPC `current_user_permission_keys` | **Implemented, unverified** after Phase 2 migration + sign-in |
| **Dashboard session strip** | `/` | No | Auth + RBAC catalogue | Live strip when readable; still unverified auth |
| **Dashboard fleet cards** | `/` | No | Yes — machines / hires / compliance / fixing | **Live data** when `core_workflow` migration applied + permissions |
| **Dashboard alerts** | `/` | No | Yes — from saved compliance/fixing | **Live data** (or unavailable message) |
| **Machines list/create/edit** | `/machines`, `/machines/[id]` | Yes | Yes | **Live** (needs `machines:read` / `machines:write`) |
| **Machine compliance** | `/machines/[id]/compliance`, `/compliance` | Yes (append-only) | Yes | **Live** — Document Date bands Confirmed |
| **Machine hiring history** | `/machines/[id]/hiring-history`, `/hiring-history` | Via hire flow | Yes | **Live** history |
| **Machine maintenance (minimal)** | `/machines/[id]/maintenance`, `/maintenance` | Yes (open/complete fixing) | Yes | **Live** fixing jobs only; schedules **DEMO / not ready** |
| **Other machine sections** | specs, readings, fuel, tyres, spare parts, documents, audit | No | No | **DEMO / not ready** |
| **Customers & sites** | `/customers` | Yes | Yes | **Live** (minimum for hiring) |
| **Hire agreements** | `/hire-agreements` | Yes (draft/activate/close) | Yes | **Live** — no billing fields |
| **Hiring history** | `/hiring-history` | Via hire events | Yes | **Live** |
| **Branches page** | `/branches` | Seeded refs via migration; page still stub | Partial | **DEMO scaffold** for branch admin UI |
| **Breakdowns page** | `/breakdowns` | Use Maintenance fixing jobs | Partial | **DEMO / not ready** (use `/maintenance`) |
| **Readings, fuel, tyres, spare parts, notifications, reports, audit** | matching routes | No | No | **DEMO scaffold / not ready** |
| **Users page session** | `/users` | No | Auth + roles/permissions | **Implemented, unverified** when signed in |
| **Users RBAC catalogue** | `/users` | No | `roles`, `permissions`, `profiles` count | Live RBAC read when migration + RLS allow; else fallback |
| **User administration UI** | `/users` stub | No | No | Scaffold only |
| **Settings usage** | `/settings` | No | Admin `profiles` count if service role set | Live admin read **or** unavailable |
| **Admin usage API** | `GET /api/admin/usage` | No | Admin `profiles` count | Live when service-role + admin |
| **Ready probe** | `GET /api/health/ready` | No | Env presence only | Presence — not a DB proof |
| **Core workflow tests** | `npm run test:compliance-bands`, `test:core-workflow-sql` | SQL script when `DATABASE_URL` set | Band unit tests offline | Local / optional live DB |
| **Capacity seed scripts** | `scripts/seed-capacity-demo.mjs` | Optional DEMO schema | Measure scripts | **DEMO capacity** — not product migrations |
| **Email invite/reset** | Supabase Auth + Titan SMTP | Auth emails | — | **UNTESTED** — do not wait on Titan for this PR |
| **Backup / restore** | `scripts/backup/` | Export files on company PC | Restore drill | **UNTESTED** |

## Phase boundary

| Phase | Product data | Status |
|-------|--------------|--------|
| 2 | Profiles, roles, permissions, Auth | Code + SQL ready; **auth implemented, unverified** until staging apply + live checks |
| 3 | Machines | **Live** CRUD via `20261104200000_core_workflow.sql` |
| 4 | Compliance | **Live** insurance / fitness / road_tracks + history + bands |
| 5 | Customers / sites / hires | **Live** minimum path; single machine per hire (multi-machine still Open) |
| 7 (slice) | Fixing jobs | **Live** open/complete only to enforce hire block |
| 6 / 8 / rest | Readings, fuel, reports, full workshop, etc. | **DEMO / not ready** |

## DB-enforced hire rules (not UI-only)

Confirmed restrictions enforced in Postgres (triggers + partial unique index + RPCs):

1. All three compliance bands must be **green** (from actual Document Date).
2. No other **active** hire on the machine.
3. No **open** fixing/service/breakdown job.
4. Concurrent conflicting activation rejected (`hire_agreements_one_active_per_machine_uidx` + activation trigger).
5. Compliance and hire events are **append-only**.
6. Closed hires are terminal; every close is explicit (no auto-close on duration end).
7. No billing / pricing fields invented.

## False-“live” traps

- Do **not** label Auth as verified — code exists; verification needs migration apply + live sign-in/RLS checks.
- Fleet cards are live **only** after `core_workflow` migration; otherwise they show Unavailable (not DEMO fake numbers).
- Unfinished modules must keep **DEMO / not ready** badges.
