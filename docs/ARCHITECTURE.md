# EW Machine Hire — Architecture

**Status legend:** **Confirmed** | **Proposed** | **Open**

---

## 1. Overview (Confirmed)

EW Machine Hire is a responsive web application built with:

| Layer | Choice | Status |
|-------|--------|--------|
| UI framework | Next.js App Router | Confirmed |
| Language | TypeScript (strict) | Confirmed |
| Styling | Tailwind CSS + design tokens | Confirmed |
| Components | shadcn/ui (+ Lucide icons) | Confirmed |
| Forms / validation | React Hook Form + Zod | Confirmed |
| Charts | Recharts (when dashboards need charts) | Confirmed (deferred in Phase 1 shell) |
| Backend / data | Supabase (Postgres, Auth, Storage) | Confirmed |
| VCS | Git | Confirmed |

PWA-ready architecture is required; **offline support is not implemented yet** (**Confirmed** deferral).

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

Feature modules map 1:1 to the Confirmed module list in `docs/PRD.md`. Phase 1 creates folders and shell routes; business logic arrives in later phases.

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

- Use Supabase Auth (email/password and/or SSO as later decided — provider mix **Open**).
- Session handled via official Supabase SSR patterns (Proposed: `@supabase/ssr` in Phase 2).
- Unauthenticated users cannot access application routes behind the shell.

### 5.2 RBAC

- Roles and permissions stored in Postgres (`roles`, `permissions`, `user_roles`, … — Proposed schema).
- Authorization checks on the **server** for mutations; UI hiding is never the only control.
- Final role matrix is **Open** until Phase 2 stakeholder sign-off.

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

## 8. PWA readiness (Confirmed deferral of offline)

- Structure for future `manifest.webmanifest` and service worker.
- Phase 1 does **not** register offline caching or background sync.
- Avoid patterns that would block later offline (e.g. assuming always-online mutations without queue design).

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
| Next.js App Router + TS strict + Tailwind + shadcn | Confirmed | Foundation |
| Supabase for DB/Auth/Storage | Confirmed | Stubs only in Phase 1 |
| Feature-folder modularity for 19 modules | Confirmed | |
| `hire_items` for potential multi-machine agreements | Proposed | Gated on Open Question #1 |
| Soft-delete on master data | Proposed | |
| Recharts in Phase 1 shell | Deferred | Not required for DEMO cards |
| Offline PWA | Open / deferred | Architecture left ready |

---

## 11. Related documents

- `docs/PRD.md`
- `docs/DATABASE.md`
- `docs/BUSINESS_RULES.md`
- `docs/DEVELOPMENT_PLAN.md`
- `docs/OPEN_QUESTIONS.md`
