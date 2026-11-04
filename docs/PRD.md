# EW Machine Hire — Product Requirements Document

**Status legend:** **Selected** (project direction) | **Confirmed** (approved business rule) | **Proposed** | **Open**

**Product:** EW Machine Hire — Heavy Equipment Hiring Management System  
**Production URL (Selected):** https://machinehire.ew.com.zm  
**Contact (Selected):** machinehire@ew.com.zm  
**Phase covered by this document:** Living product requirements; Phase delivery follows `docs/DEVELOPMENT_PLAN.md`.

**Selected stack:** Next.js App Router, TypeScript strict, Tailwind, shadcn/ui, Supabase, Zod, React Hook Form, Lucide, Recharts (**selected but not yet implemented**), Git.  
**Selected platform:** Responsive PWA as the intended approach; **offline deferred**.

---

## 1. Purpose

Build a production-ready web application for managing heavy equipment hire operations for EW Machine Hire (East to West Construction and Mining Limited context), covering fleet, compliance, customers, hire agreements, operational logs (readings, fuel, tyres, spare parts), maintenance, notifications, reporting, users/permissions, and audit history.

---

## 2. Goals (Confirmed)

- Centralise machine, customer, and hire agreement records.
- Enforce compliance-aware hiring restrictions.
- Preserve permanent machine history (never overwrite historical events).
- Support responsive desktop/tablet/mobile use.
- Provide a modular architecture for the 19 product modules.
- Keep security first: auth, RBAC, RLS, server validation, audit, secure uploads.

---

## 3. Non-goals for Phase 1 (Confirmed)

- Do not implement all 19 modules’ business logic.
- Do not connect to production Supabase or other live services.
- Do not create real customer/machine data.
- Do not deploy to production.
- Do not implement offline caching yet (responsive PWA is the intended approach; offline is deferred).
- Do not invent unresolved business rules (see `docs/OPEN_QUESTIONS.md`).

---

## 4. Users & roles (Proposed — refine in Phase 2)

| Role (Proposed) | Intent |
|-----------------|--------|
| Admin | Full system configuration, users, settings |
| Operations / Hire desk | Customers, hire agreements, machine assignment |
| Workshop / Maintenance | Maintenance, breakdowns, spare parts |
| Compliance officer | Compliance documents and status |
| Viewer / Auditor | Read-only access + audit history |

**Open:** Final role catalogue and permission matrix require stakeholder approval.

---

## 5. Modules (Selected — 19)

These 19 modules are the **selected** product scope (not pending module-list approval). Build as modular features under `src/features/`. Implement per `docs/DEVELOPMENT_PLAN.md`; Phase 1 scaffolds structure and shell only.

1. Dashboard  
2. Machinery and equipment management  
3. Machine specifications and documents  
4. Compliance management  
5. Customers and customer contacts  
6. Branches, sites, and locations  
7. Hire agreements and machine assignments  
8. Hiring history and hire events  
9. Machine readings and operating hours  
10. Fuel management  
11. Tyre management  
12. Spare parts management  
13. Maintenance and servicing  
14. Breakdowns and repairs  
15. Notifications and alerts  
16. Reports and analytics  
17. Users, roles, and permissions  
18. Audit history and activity logs  
19. System settings  

---

## 6. Machine details experience (Confirmed)

Each machine detail view must organise content into these sections (Phase 1: navigation stubs only):

1. Overview  
2. Specifications  
3. Compliance  
4. Hiring History  
5. Readings  
6. Fuel  
7. Tyres  
8. Spare Parts  
9. Maintenance  
10. Documents  
11. Audit History  

---

## 7. Functional requirements summary

### 7.1 Compliance (Confirmed)

See `docs/BUSINESS_RULES.md` for the full rule set. Summary:

- **Insurance**, **fitness**, and **road tracks** share the same renewal cycle.
- Calculate status from each record’s **actual document Date**, not application entry time.
- **Green:** under 9 months · **Yellow:** 9 months to under 10 months · **Red:** 10 months onward (including 11+).
- A renewal recalculates **only that document’s** status from its new Date; **preserve all previous records**.
- Missing required documents must be identified; do not invent dates.

### 7.2 Hiring restrictions (Confirmed)

A machine cannot receive a **new hire** if:

- It is already hired.
- It is undergoing **any fixing**, including routine **service** or **breakdown repair**.
- Any required compliance is missing, yellow, or red.

Also Confirmed:

- Prevent concurrent hire of the same machine (DB-level where appropriate).
- **Manual / explicit closure** for **every** hire, including fixed-duration hires (no silent auto-close).
- Preserve full hiring history.

### 7.3 History (Confirmed)

Permanent history for: hiring, readings, fuel, tyres, spare parts, maintenance, breakdowns, repairs, documents, and user changes. Historical events are append-only (not overwritten).

### 7.4 Hire durations (Confirmed support; billing Open)

Support hourly, daily, monthly, and open-ended designs. Billing/time-calculation rules remain **Open**.

### 7.5 Maintenance (Confirmed scope; thresholds Open)

Support schedules, servicing, breakdowns, repairs, and spare parts used. Exact thresholds are **Open** — keep configurable.

### 7.6 Units & currencies (Confirmed principle)

Do not combine values of different units without explicit conversion. Preserve original values and units.

---

## 8. UX / UI requirements (Confirmed for shell)

- Application shell: sidebar, header with company identity, user profile menu, notification area, responsive mobile nav.
- Dashboard cards, search/filter patterns, tables, validated forms, confirmation dialogs.
- Loading, empty, and error states.
- Demo/sample data must be clearly labeled **DEMO** and never presented as real records.
- Branding: design tokens for Black `#17191C`, Blue `#1769B0`, Green `#65A52D`, Yellow `#E5B900`, Background `#F5F6F8`, White `#FFFFFF`.
- Logo path: `public/brand/ew-machine-hire-logo.jpg` (place official asset; do not generate a substitute).

---

## 9. Technical constraints (Selected)

- Next.js App Router, TypeScript strict, Tailwind CSS, shadcn/ui.
- Supabase (Postgres, Auth, Storage).
- Zod, React Hook Form, Lucide; **Recharts selected but not yet implemented** (add when charts are needed).
- Git; stable compatible versions; minimal dependencies.
- **Responsive PWA** as the intended approach; **offline functionality deferred**.

---

## 10. Success criteria for Phase 1

- [x] Documentation suite in `docs/` + project `README.md` + `.env.example`.
- [x] Next.js foundation with modular folder structure for all 19 modules.
- [x] Branding tokens and responsive application shell with DEMO dashboard data.
- [x] Machine details page with section navigation stubs.
- [x] Supabase client stubs/config placeholders only (no live connection).
- [x] Open questions and security plan documented.
- [ ] Stakeholder review of open questions before Phase 2 implementation.

---

## 11. Related documents

- `docs/BUSINESS_RULES.md` — confirmed vs open rules  
- `docs/DATABASE.md` — entities, migrations approach  
- `docs/ARCHITECTURE.md` — system design & security  
- `docs/DEVELOPMENT_PLAN.md` — phases 1–9  
- `docs/OPEN_QUESTIONS.md` — decisions needing approval  
