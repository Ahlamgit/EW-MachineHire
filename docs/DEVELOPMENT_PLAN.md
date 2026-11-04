# EW Machine Hire — Development Plan

**Status legend:** **Confirmed** | **Proposed** | **Open**

Phased delivery below is **Confirmed** by the project foundation brief. Do not skip security or documentation for speed.

---

## Phase 1 — Project foundation and documentation (this phase)

**Goals**

- Inspect repository; confirm stub/empty starting state.
- Author product and engineering docs (`PRD`, `DATABASE`, `BUSINESS_RULES`, `ARCHITECTURE`, `DEVELOPMENT_PLAN`, `OPEN_QUESTIONS`).
- Replace stub README; add `.env.example` (placeholder names only).
- Scaffold Next.js App Router + TypeScript strict + Tailwind + path aliases.
- Modular folder structure for all 19 modules.
- Branding / design tokens.
- Responsive application shell + DEMO dashboard data + machine details section stubs.
- Supabase client stubs only; document migrations approach.
- Open PR; do not merge; do not deploy; do not connect production services.

**Exit criteria:** Docs reviewed; shell runnable locally; open questions listed for stakeholder approval.

---

## Phase 2 — Authentication, user roles, and permissions

**Goals**

- Supabase Auth integration (SSR session handling via `@supabase/ssr`).
- Protected routes / middleware.
- Profiles, roles, permissions schema + RLS baselines.
- Proposed permission matrix (`docs/PERMISSIONS.md`) — no branch restrictions assumed; no finance exposure by default.
- Users page catalogue + server-side permission helpers.
- Setup guide (`docs/AUTH_SETUP.md`) when credentials are private to the operator.

**Depends on:** Phase 1; live verification depends on operator Supabase project.  
**Exit criteria:** Code + SQL ready; signed-in-only when configured; Proposed RBAC seeded; live auth/RLS checks marked unverified until private setup completes.

---

## Phase 3 — Machinery management and documents

**Goals**

- Machines CRUD (create/read/update; soft-delete Proposed).
- Types / brands reference data.
- Machine specifications and document metadata + secure uploads.
- Machine list/detail routes wired to real (non-demo) data in non-prod.

**Depends on:** Phase 2.  
**Exit criteria:** Operators can register machines and attach documents safely.

---

## Phase 4 — Compliance management

**Goals**

- Compliance records with real dates.
- Green / Yellow / Red / Missing status per Confirmed bands.
- UI surfacing on machine detail Compliance section.
- Inputs to hiring eligibility checks (consumed in Phase 5).

**Depends on:** Phase 3; clarification of “road tracks” if that document type is required.  
**Exit criteria:** Compliance status accurate and visible; missing docs flagged.

---

## Phase 5 — Customers and hiring agreements

**Goals**

- Customers and contacts.
- Branches/sites as needed for hire context.
- Hire agreements, assignment, explicit closure, hire events.
- Enforce Confirmed hiring restrictions (already hired, repair, compliance missing/yellow/red).
- DB-level protection against concurrent active hires of the same machine.
- Preserve hiring history.

**Depends on:** Phases 3–4; **must resolve** multi-machine-per-agreement Open Question before finalising schema.  
**Exit criteria:** End-to-end hire open → restrict → close with history retained.

---

## Phase 6 — Machine readings, fuel, tyres, and spare parts

**Goals**

- Append-only readings (operating hours; mileage if confirmed).
- Fuel, tyre, and spare-part event capture.
- Preserve original units; no silent unit mixing.
- Optional inventory controls only if Open Question on stock control is Confirmed.

**Depends on:** Phase 3 (machines); Phase 5 optional links to active hires.  
**Exit criteria:** Operational logs visible on machine detail sections with DEMO removed for those flows in non-prod.

---

## Phase 7 — Maintenance, servicing, breakdowns, and repairs

**Goals**

- Maintenance schedules and service records.
- Breakdown and repair workflows.
- Spare parts used on jobs.
- Configurable thresholds (do not hard-code unconfirmed values).
- Machine status interactions with hiring restrictions (any fixing — including routine service or breakdown repair — blocks a new hire; every hire requires manual closure).

**Depends on:** Phases 3 & 6; threshold decisions preferred but configurable defaults may be Proposed with documentation.  
**Exit criteria:** Workshop can log work and block hire while in repair per Confirmed rules.

---

## Phase 8 — Dashboards, reports, notifications, and audit history

**Goals**

- Operational dashboard (replace DEMO cards with live aggregates).
- Reports / analytics (implement **selected** Recharts charts where useful — Recharts is selected but not yet implemented before this phase).
- Notifications and alerts (in-app; email if Confirmed).
- Audit history UI and complete coverage of sensitive actions.

**Depends on:** Phases 2–7 data.  
**Exit criteria:** Managers can monitor fleet/hire health; auditors can trace changes.

---

## Phase 9 — Testing, security review, deployment, and production preparation

**Goals**

- Automated tests (unit, integration, critical E2E hire/compliance paths).
- Security review: RLS, secrets, uploads, RBAC, headers.
- Staging validation; production Supabase project hardening.
- Deploy to `https://machinehire.ew.com.zm`.
- Runbooks, backup/restore checks, monitoring.
- Responsive PWA remains the intended approach; offline still deferred unless newly Confirmed for go-live.

**Depends on:** Phases 1–8 complete enough for production scope.  
**Exit criteria:** Production go-live checklist signed off; no service-role keys client-side; docs updated to Confirmed production settings.

---

## Cross-cutting rules for all phases

1. Distinguish **Confirmed** vs **Proposed** vs **Open** in docs and code comments where defaults are temporary.
2. Never invent business rules to unblock coding — escalate via `docs/OPEN_QUESTIONS.md`.
3. Prefer correctness, maintainability, and security over speed.
4. Keep dependencies minimal and versions stable/compatible.
5. Demo data must remain clearly labeled until replaced by real non-prod fixtures.
