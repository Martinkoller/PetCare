# TECPET_CODE_GUIDELINES.md

## Purpose
Code generation rules for Codex / AI assistance based on the **real current codebase**.

This file should be treated as the primary engineering guardrail.

---

# 1. Stack Rules

## Frontend
- React 19
- TypeScript
- Vite
- React Router
- Tailwind
- shadcn/ui style components
- Context/store pattern already used

## Backend
- Express
- TypeScript
- Prisma
- SQLite (current)
- CommonJS server package

---

# 2. Source of Truth Rules

## Backend source of truth
- Prisma schema
- Express controllers
- Existing service logic

## Frontend source of truth
- `src/lib/types.ts`
- stores / contexts
- page flows

## When there is a mismatch
Prefer this order:
1. Runtime behavior in controllers/services
2. Frontend types actually used
3. Prisma schema actual columns
4. Old comments

---

# 3. Naming Rules (Canonical)

## Use these names
- `Appointment`
- `Client`
- `Pet`
- `BoardingStay`
- `BoardingService`
- `MedicalRecord`
- `Vaccination`
- `HospitalizationStay`
- `HospitalizationLog`
- `ClientInteraction`
- `NotificationLog`

## Service types (canonical)
- `consultation`
- `grooming`
- `boarding`

## Avoid for new code
- `veterinary` as new canonical serviceType
- `BathGrooming` model
- `Consultation` model

Unless explicitly requested as migration work.

---

# 4. Appointment Handling Rules

## Always preserve these behaviors
- `serviceItems` stored as JSON string in DB
- `serviceItems` returned as parsed array in API
- workflow metadata stored in `notes`
- normalized API response should expose:
  - `clinicalStatus`
  - `groomingStatus`
  - `source`

## Never directly overwrite notes blindly
Use the same meta-preserving pattern from `appointment.controller.ts`.

---

# 5. Workflow Metadata Pattern (Mandatory)

Current format:
- first line begins with `[WF]`
- JSON payload stored inline
- remaining text is human note text

## Safe rule
When updating appointment notes:
1. Parse current meta
2. Merge intended changes
3. Rebuild note payload
4. Preserve user-visible note body

## If creating new helper code
Centralize this in a shared utility instead of duplicating logic.

---

# 6. Status Handling Rules

## Canonical appointment statuses
- `scheduled`
- `confirmed`
- `checked_in`
- `in_progress`
- `checked_out`
- `completed`
- `cancelled`

## Clinical statuses
- `waiting`
- `triage`
- `consultation`
- `completed`

## Grooming statuses
- dynamic stage IDs
- configured from organization settings

## Boarding sync
If appointment changes and serviceType is `boarding`, keep `BoardingStay` aligned.

---

# 7. Boarding Rules for New Code

## On create
If creating appointment with `serviceType = 'boarding'`:
- ensure linked `BoardingStay` exists
- preserve 1:1 by `appointmentId`

## On update
If updating boarding appointment:
- sync `checkIn`
- sync `checkOut`
- sync mapped boarding status

## Recommended improvement
Replace “create and catch” style with explicit idempotent upsert/find-first flow.

---

# 8. API Design Rules

Prefer resource-oriented routes aligned with current server style.

## Existing route style examples
- `/appointments`
- `/clients`
- `/pets`
- `/services`
- `/products`
- `/boardings`
- `/hospitalization`
- `/templates`
- `/whatsapp`

## Recommended pattern
- Keep REST-ish endpoints
- Use explicit action routes only when status transitions are meaningful
- Avoid over-engineering CQRS/event abstractions unless requested

---

# 9. Frontend Coding Rules

## Use existing patterns
- lazy-loaded pages
- store/context providers
- `src/lib/types.ts` as shared typing baseline
- service files under `src/services`

## UI behavior rules
- show friendly labels
- centralize status label helpers
- avoid duplicating status mapping across many pages
- keep grooming stage logic config-driven
- keep boarding visual treatment separate from generic appointments

---

# 10. Backend Coding Rules

## Prefer
- thin routes
- controllers for request mapping
- services for reusable business logic
- Prisma queries close to the domain behavior
- explicit date parsing
- defensive null handling

## Avoid
- hidden magic in controllers
- silent shape drift between API and frontend
- duplicating workflow metadata parsing in multiple files

---

# 11. Prisma Rules

## Current reality
This project is schema-first enough that Prisma matters, but some business state is still encoded outside columns.

## Safe Prisma guidance
- do not add columns casually without checking frontend normalization
- if adding workflow columns, plan a migration path from `notes` metadata
- preserve `@unique` on `BoardingStay.appointmentId`

## Recommended future migration candidates
- `Appointment.clinicalStatus`
- `Appointment.groomingStatus`
- `Appointment.source`
- optional `appointmentId` on `MedicalRecord`
- optional `appointmentId` on `Vaccination`
- optional `appointmentId` on `HospitalizationStay`

---

# 12. Communication / WhatsApp Rules

## Treat these as system-critical
- template selection
- scheduler timing
- reminder flags
- pending confirmation flags
- reply tracking fields
- `NotificationLog`

## When implementing new automations
- never resend blindly if a send marker exists
- always record outcome
- preserve current flag semantics on `Appointment`

---

# 13. Safe Refactor Rules

## Allowed incremental refactors
- extract helpers
- centralize status maps
- centralize workflow metadata helpers
- unify duplicated label logic
- strengthen typing
- improve idempotency

## High-risk refactors (only when explicitly requested)
- changing serviceType vocabulary
- moving workflow metadata out of notes
- introducing new normalized service tables
- changing boarding linkage model
- changing scheduler semantics

---

# 14. “Do Not Hallucinate” Rules for Codex

## Do not invent
- tables not present in Prisma
- columns not present in Prisma
- module records not present in actual code
- hardcoded grooming enums
- `appointmentId` links on models that do not currently have them

## If proposing improvements
Mark them clearly as:
- `recommended future migration`
- `optional refactor`
- `not current implementation`

---

# 15. Recommended Shared Utilities (safe additions)

If creating new utilities, prefer these first:

1. `appointmentWorkflowMeta.ts`
   - parse notes meta
   - build notes meta
   - normalize response helpers

2. `appointmentStatusMap.ts`
   - labels
   - boarding-specific mapping
   - clinic/grooming helper labels

3. `serviceTypeMap.ts`
   - canonical service type handling
   - optional legacy alias handling

4. `boardingSync.ts`
   - create linked stay idempotently
   - sync stay from appointment

These are safe and high-value.

---

# 16. Priority Order for New Code

When generating code, optimize in this order:

1. Preserve existing runtime behavior
2. Avoid breaking stored data semantics
3. Keep frontend/backend contract stable
4. Improve clarity and maintainability
5. Add stronger typing
6. Reduce duplication
7. Only then improve architecture

---

# 17. Final Rule

**When in doubt, extend the current Appointment-centric architecture instead of forcing the earlier conceptual model into the live codebase.**
