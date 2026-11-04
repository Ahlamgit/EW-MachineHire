# Live vs DEMO matrix (customer-test honest scope)

**Branch intent:** customer-test on Netlify Free Path A.  
**Rule:** Auth may be live while fleet/compliance/hire UI still shows DEMO. Never treat DEMO numbers as production data.

| Area | Route / surface | Saves to Supabase? | Reads Supabase? | UI label |
|------|-----------------|--------------------|-----------------|----------|
| **Auth sign-in** | `/login` | Auth users via Supabase Auth (not app tables) | Session via Auth | Live when env configured |
| **Auth callback** | `/auth/callback` | Session cookies | Auth code exchange | Live |
| **Sign-out** | header action | Clears Auth session | — | Live |
| **Middleware session** | protected shell | Refresh cookies | `auth.getUser()` | Live when configured |
| **Session + roles** | `getAuthContext()` | No | `user_roles`, RPC `current_user_permission_keys` | Live after Phase 2 migration + sign-in |
| **Dashboard session strip** | `/` | No | Auth + RBAC catalogue | **Live** strip; fleet below = DEMO |
| **Dashboard fleet cards** | `/` | No | No — `DEMO_DASHBOARD_CARDS` | **DEMO** |
| **Dashboard machine list** | `/` | No | No — `DEMO_MACHINES` | **DEMO — not Supabase** |
| **Machines list/detail** | `/machines`, `/machines/[id]/*` | No | No — DEMO constants | **DEMO** (Phase 3 later) |
| **Compliance** | `/compliance` | No | No | **DEMO scaffold** (Phase 4) |
| **Customers** | `/customers` | No | No | **DEMO scaffold** (Phase 5) |
| **Hire agreements** | `/hire-agreements` | No | No | **DEMO scaffold** (Phase 5) |
| **Hiring history** | `/hiring-history` | No | No | **DEMO scaffold** (Phase 5) |
| **Branches, readings, fuel, tyres, spare parts, maintenance, breakdowns, notifications, reports, audit** | matching routes | No | No | **DEMO scaffold** |
| **Users page session** | `/users` | No | Auth + roles/permissions | **Live** when signed in |
| **Users RBAC catalogue** | `/users` | No | `roles`, `permissions`, `profiles` count | **Live RBAC read** when migration + RLS allow; else in-app Proposed fallback |
| **User administration UI** | `/users` stub | No | No | Scaffold only |
| **Settings usage** | `/settings` | No | Admin `profiles` count if `SUPABASE_SERVICE_ROLE_KEY` set | Live admin read **or** unavailable message |
| **Admin usage API** | `GET /api/admin/usage` | No | Admin `profiles` count | Live when service-role + admin |
| **Ready probe** | `GET /api/health/ready` | No | Env presence only | Presence — not a DB proof |
| **Capacity seed scripts** | `scripts/seed-capacity-demo.mjs` | Optional local/staging DEMO schema | Measure scripts | **DEMO capacity** — not product Phase migrations |
| **Email invite/reset** | Supabase Auth + Titan SMTP | Auth emails | — | **UNTESTED** until [`EMAIL_SMTP.md`](./EMAIL_SMTP.md) |
| **Backup / restore** | `scripts/backup/` | Export files on company PC | Restore drill | **UNTESTED** until [`BACKUP_RECOVERY.md`](./BACKUP_RECOVERY.md) |

## Phase boundary (do not invent)

| Phase | Product data | Status on this branch |
|-------|--------------|------------------------|
| 2 | Profiles, roles, permissions, Auth | Code + SQL ready; live when staging project applied |
| 3 | Machines / documents | DEMO UI only — **no** machines tables in migrations |
| 4 | Compliance | Scaffold only |
| 5 | Customers / hires | Scaffold only |

## False-“live” traps (fixed / watch)

- Green **“Supabase env detected”** on the dashboard used to sit next to DEMO fleet cards — now split into **Auth env configured** vs **Fleet DEMO**.
- Header **“Demo User”** renamed to **Local preview** when `DEV_ALLOW_UNCONFIGURED_SHELL` is on.
- Module stubs show **DEMO scaffold — no Supabase data**.
