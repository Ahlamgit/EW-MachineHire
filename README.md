# EW Machine Hire

Heavy Equipment Hiring Management System for **EW Machine Hire**.

| | |
|---|---|
| **Production URL** | https://machinehire.ew.com.zm |
| **Contact** | machinehire@ew.com.zm |
| **Stack (Selected)** | Next.js (App Router), TypeScript (strict), Tailwind CSS, shadcn/ui, Supabase, Zod, React Hook Form, Lucide, Recharts (**selected but not yet implemented**) |
| **Platform** | Responsive PWA intended; offline deferred |
| **Status** | Phase 1 foundation + Phase 2 auth/RBAC baseline |

Documentation distinguishes **Selected**, **Confirmed**, **Proposed**, and **Open**. Do not invent business rules — see `docs/OPEN_QUESTIONS.md`. The 19 modules and stack are **selected** project direction.

---

## Documentation

| Document | Description |
|----------|-------------|
| [`docs/PRD.md`](docs/PRD.md) | Product requirements |
| [`docs/BUSINESS_RULES.md`](docs/BUSINESS_RULES.md) | Confirmed / open business rules |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Entities, constraints, migrations approach |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System design & security plan |
| [`docs/DEVELOPMENT_PLAN.md`](docs/DEVELOPMENT_PLAN.md) | Phases 1–9 |
| [`docs/OPEN_QUESTIONS.md`](docs/OPEN_QUESTIONS.md) | Decisions needing approval |
| [`docs/PERMISSIONS.md`](docs/PERMISSIONS.md) | Proposed RBAC matrix (Phase 2) |
| [`docs/AUTH_SETUP.md`](docs/AUTH_SETUP.md) | Private Supabase auth/RLS setup steps |

---

## Branding

- Design tokens: Black `#17191C`, Blue `#1769B0`, Green `#65A52D`, Yellow `#E5B900`, Background `#F5F6F8`, White `#FFFFFF`.
- **Official logo path:** `public/brand/ew-machine-hire-logo.jpg`
- Create/place the official logo file at that path. **Do not generate a substitute.** Until the file is present, the UI uses text identity and a path notice.

---

## Local development

### Prerequisites

- Node.js 20+ (22 recommended)
- npm 10+

### Setup

```bash
git clone https://github.com/Ahlamgit/EW-MachineHire.git
cd EW-MachineHire
npm install
cp .env.example .env.local
# For shell preview without Supabase: keep DEV_ALLOW_UNCONFIGURED_SHELL=true
# For real auth: fill Supabase URL/anon key and follow docs/AUTH_SETUP.md
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign-in lives at `/login` when Supabase is configured.

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

### Environment

Copy `.env.example` → `.env.local` and fill placeholders when a Supabase project exists. Phase 1 uses **stubs only** — no live Supabase connection is required to run the shell.

**Never** put the service-role key in `NEXT_PUBLIC_*` variables or client code.

---

## Repository layout (Phase 1)

```
src/app              App Router routes & shell
src/components       Layout, UI primitives, shared states
src/features         Modular folders for all 19 product modules
src/lib              Supabase stubs, constants, validations, utils
public/brand         Official logo placement
docs/                Product & engineering docs
supabase/migrations  SQL migrations (none applied yet)
```

---

## Phase scope (current branches)

**Phase 1:** documentation, Next.js foundation, design tokens, responsive shell, DEMO dashboard/machine stubs, Supabase placeholders.

**Phase 2:** auth routes, middleware session protection, Proposed RBAC schema + RLS SQL, permission helpers, users page catalogue. Live auth/RLS verification requires your Supabase project (`docs/AUTH_SETUP.md`).

Not included yet: real machine/customer/hire modules, finance, branch ACL, deployment, offline PWA.

---

## Security (summary)

Auth, RBAC, Supabase RLS, server-side Zod validation, protected routes, audit logging, and secure uploads are planned in `docs/ARCHITECTURE.md`. Service-role credentials must remain server-only.

---

## License / ownership

Proprietary — EW Machine Hire / East to West Construction and Mining Limited. All rights reserved unless otherwise stated.
