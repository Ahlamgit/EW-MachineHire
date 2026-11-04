# EW Machine Hire — Architecture

**Status legend:** **Selected** (project direction) | **Confirmed** (approved business rule) | **Proposed** | **Open**

---

## 1. Overview (Selected stack)

EW Machine Hire is a responsive web application. The foundation prompt **selected** this technology stack as the project direction (not pending stack approval):

| Layer | Choice | Status |
|-------|--------|--------|
| UI framework | Next.js App Router | Selected |
| Language | TypeScript (strict) | Selected |
| Styling | Tailwind CSS + design tokens | Selected |
| Components | shadcn/ui (+ Lucide icons) | Selected |
| Forms / validation | React Hook Form + Zod | Selected |
| Charts | Recharts | **Selected but not yet implemented** (install/use when dashboards/reports need charts; Phase 1 shell uses DEMO cards without charts) |
| Backend / data | Supabase (Postgres, Auth, Storage) | Selected |
| VCS | Git | Selected |

### Platform approach (Selected)

- **Responsive PWA** is the **intended** delivery approach (desktop / tablet / mobile).
- **Offline functionality is deferred** — do not implement service-worker offline caching or sync in early phases; keep architecture compatible with a later PWA offline pass.

---

## 2. High-level diagram (Proposed)

```
┌──────────────────────────────────────────────────────────┐
│                     Browser (responsive)                 │
│  App Shell · Feature modules · RHF/Zod · Lucide/shadcn   │
└───────────────────────────┬──────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼──────────────────────────────┐
│                 Next.js (App Router)                     │
│  Server Components · Route Handlers · Server Actions     │
│  Protected routes · Server-side Zod validation           │
└─────────────┬─────────────────────────────┬──────────────┘
              │ anon/user JWT               │ service role
              │ (browser-safe)              │ (server-only)
┌─────────────▼──────────────┐   ┌──────────▼──────────────┐
│ Supabase Auth + Postgres   │   │ Privileged server ops   │
│ RLS-enforced queries       │   │ migrations, admin jobs  │
│ Storage (docs/uploads)     │   │ never shipped to client │
└────────────────────────────┘   └─────────────────────────┘
```

---

## 3. Repository layout (Confirmed for Phase 1)

```
src/
  app/                 # Next.js routes (App Router)
  components/          # Shared UI (layout, ui, shared states)
  features/            # One folder per product module (19)
  lib/                 # supabase stubs, utils, constants, validations
  types/               # Shared TypeScript types
  hooks/               # Shared React hooks
public/brand/          # Official logo asset path
docs/                  # Product & engineering documentation
supabase/migrations/   # SQL migrations (empty in Phase 1)
```

Feature modules map 1:1 to the **Selected** module list in `docs/PRD.md`. Phase 1 creates folders and shell routes; business logic arrives in later phases.

---

## 4. Application shell (Confirmed Phase 1)

- Sidebar navigation (module stubs).
- Header with company identity (name + logo path).
- User profile menu **placeholder**.
- Notification area **placeholder**.
- Mobile navigation.
- Dashboard cards with **DEMO**-labeled sample data only.
- Loading / empty / error UI patterns for the shell.
- Machine details page with section nav stubs only (no invented business logic).

---

## 5. Security plan (Confirmed requirements)

### 5.1 Authentication

- Use Supabase Auth (email/password first; SSO later is **Open**).
- Session handled via `@supabase/ssr` (browser client, server client, middleware refresh) — **Selected** and implemented in Phase 2 code.
- When configured, unauthenticated users are redirected to `/login`.
- When not configured, `/login` shows setup guidance; `DEV_ALLOW_UNCONFIGURED_SHELL` may unlock the shell for local preview only (never production).

### 5.2 RBAC

- Roles and permissions stored in Postgres (`roles`, `permissions`, `role_permissions`, `user_roles`, `profiles`) — Phase 2 migration.
- **Proposed** minimum matrix documented in `docs/PERMISSIONS.md` (finance permissions reserved/unassigned; no branch ACL assumed).
- Authorization checks on the **server** for mutations; UI hiding is never the only control.
- Final role matrix remains **Open** for stakeholder sign-off.

### 5.3 Row Level Security (RLS)

- Enable RLS on all application tables.
- Policies align with RBAC and (if approved) branch isolation.
- Client queries must succeed or fail under RLS without relying on “hidden” service-role calls from the browser.

### 5.4 Server-side validation

- Zod schemas shared (or mirrored) between client forms and server actions/route handlers.
- Never trust client-only validation for hire eligibility, compliance, or closures.

### 5.5 Protected routes

- Next.js middleware and/or server layout guards for authenticated areas.
- Redirect unauthenticated users to a sign-in route (Phase 2).

### 5.6 Audit logging

- Significant create/update/close/permission actions write to `audit_logs` (append-only).
- Aligns with Confirmed permanent history rules in `docs/BUSINESS_RULES.md`.

### 5.7 Secure uploads

- Uploads via Supabase Storage with constrained MIME types, size limits, and authenticated policies.
- Store metadata in Postgres; do not trust client-supplied paths blindly.
- Prefer signed URLs for private documents (**Proposed**).

### 5.8 Secrets & environment

- Secrets only via environment variables (see `.env.example` for **placeholder names**).
- **Never** expose `SUPABASE_SERVICE_ROLE_KEY` (or any service-role credential) to the client bundle.
- Browser may receive only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- No hardcoded credentials in source control.

### 5.9 Concurrent hire protection

- Hiring eligibility checks in application code **and** database constraints / transactional integrity (Confirmed intent).

---

## 6. Data & domain boundaries (Proposed)

| Concern | Owner |
|---------|--------|
| Presentation | `src/app`, `src/components` |
| Domain feature logic | `src/features/<module>` |
| Persistence / Supabase clients | `src/lib/supabase` |
| Shared schemas | `src/lib/validations`, `src/types` |
| Schema evolution | `supabase/migrations` |

Cross-module rules (e.g. “cannot hire if compliance yellow/red”) should live in shared domain services on the server, not duplicated only in UI.

---

## 7. Branding & design system (Confirmed)

CSS variables / Tailwind tokens:

| Token | Hex |
|-------|-----|
| Black | `#17191C` |
| Blue | `#1769B0` |
| Green | `#65A52D` |
| Yellow | `#E5B900` |
| Background | `#F5F6F8` |
| White | `#FFFFFF` |

Logo: `public/brand/ew-machine-hire-logo.jpg` — place the official file; do not generate a substitute. If missing, UI falls back to text identity and documents the expected path.

Visual direction: professional, modern, clean — suitable for heavy-equipment operations software.

---

## 8. Responsive PWA (Selected intent; offline deferred)

- **Intended approach:** responsive Progressive Web App suitable for field and office use.
- Structure for future `manifest.webmanifest` and service worker when the offline phase begins.
- Foundation / early phases do **not** register offline caching or background sync.
- Avoid patterns that would block later offline (e.g. assuming always-online mutations without a queue design).

---

## 9. Environment topology (Proposed)

| Environment | Purpose |
|-------------|---------|
| Local | Developer `.env.local` + optional local Supabase |
| Staging | Non-production Supabase project |
| Production | `https://machinehire.ew.com.zm` |

Phase 1 does not deploy.

---

## 10. Architecture decisions log

| Decision | Status | Notes |
|----------|--------|-------|
| Next.js App Router + TS strict + Tailwind + shadcn | Selected | Foundation |
| Supabase for DB/Auth/Storage | Selected | Live wiring from Phase 2; no production connection in early phases |
| Feature-folder modularity for all 19 modules | Selected | Modules are the product scope; implement per development plan |
| Responsive PWA | Selected intent | Offline functionality deferred |
| Recharts | Selected but not yet implemented | Add when reports/dashboard charts are built |
| `hire_items` for potential multi-machine agreements | Proposed | Gated on Open Question #1 |
| Soft-delete on master data | Proposed | |

---

## 11. Related documents

- `docs/PRD.md`
- `docs/DATABASE.md`
- `docs/BUSINESS_RULES.md`
- `docs/DEVELOPMENT_PLAN.md`
- `docs/OPEN_QUESTIONS.md`
