# TECPET_REFACTOR_PLAN.md

## Purpose
Professional refactor roadmap based on the **current live codebase**, designed to improve the system **without breaking what already works**.

This is intentionally incremental and migration-safe.

---

# 1. Executive Summary

The current TecPet codebase is already strong and usable, but it has a few architectural tensions:

## Main tensions today
1. `Appointment` is correctly central, but some workflow state is hidden in `notes`
2. `serviceType` vocabulary has legacy inconsistency (`consultation` vs `veterinary`)
3. Boarding sync is real, but logic is controller-coupled
4. Communication history is split between `ClientInteraction` and `NotificationLog`
5. Frontend likely duplicates status labeling in multiple places
6. Hospitalization is operationally separate from the appointment-centric mental model

## Refactor principle
**Improve clarity, typing, and maintainability while preserving the current runtime behavior first.**

---

# 2. Refactor Priorities (Recommended Order)

## Phase 1 — Safe internal hardening (do first)
Low-risk, high-value, minimal behavioral change.

### Goals
- reduce duplication
- make Codex safer
- stabilize contracts
- improve maintainability

### Deliverables
1. Extract `Appointment` workflow metadata helper
2. Extract centralized status mapping helper
3. Extract boarding sync helper/service
4. Standardize `serviceType` handling helper (with legacy alias support)
5. Centralize frontend status labels and service type labels

---

## Phase 2 — Contract stabilization
Still low/medium risk, no major schema change.

### Goals
- make frontend/backend alignment explicit
- reduce accidental regressions

### Deliverables
1. Normalize all appointment API responses consistently
2. Ensure all routes return parsed `serviceItems`
3. Ensure all routes return normalized:
   - `clinicalStatus`
   - `groomingStatus`
   - `source`
4. Add shared TypeScript contract helpers in frontend services

---

## Phase 3 — Schema modernization (migration-safe)
Medium risk. Requires planned migration.

### Goals
- reduce hidden state
- make data model more explicit
- improve reporting/queryability

### Deliverables
1. Add nullable columns to `Appointment`:
   - `clinicalStatus`
   - `groomingStatus`
   - `source`
2. Backfill from `[WF]` notes metadata
3. Switch API to dual-read / column-first
4. Eventually stop encoding workflow metadata in notes

> This is the **single highest-value architectural upgrade**.

---

## Phase 4 — Optional domain expansion
Only after stability.

### Candidates
1. Link `MedicalRecord` to `Appointment` (optional)
2. Link `Vaccination` to `Appointment` (optional)
3. Link `HospitalizationStay` to `Appointment` (optional)
4. Unify communication strategy
5. Add richer event-driven automation

---

# 3. Phase 1 Detailed Plan (Recommended Immediate)

## 3.1 Extract `appointmentWorkflowMeta` utility
### Create
`server/src/utils/appointmentWorkflowMeta.ts` (or equivalent)

### Responsibilities
- parse notes metadata
- extract visible notes
- merge metadata
- rebuild notes payload
- normalize appointment response

### Why
Today this logic is high-value and easy to accidentally duplicate incorrectly.

---

## 3.2 Extract `appointmentStatusMap` utility
### Backend
Create shared mapping for:
- appointment labels
- boarding sync map
- service type labels (optional)

### Frontend
Create mirrored display helper:
- `getAppointmentStatusLabel`
- `getBoardingDisplayStatus`
- `getClinicalStatusLabel`

### Why
Prevents status drift across pages.

---

## 3.3 Extract `boardingSync` service
### Move from controller-coupled logic to service helper
Responsibilities:
- ensure linked boarding stay exists
- sync stay dates
- map appointment status -> boarding status
- keep 1:1 semantics explicit

### Why
Boarding is the one real specialized sync and deserves a reusable service.

---

## 3.4 Standardize `serviceType` handling
### Create helper
`normalizeServiceType(input)`

### Behavior
- accepts `consultation`, `grooming`, `boarding`
- optionally aliases `veterinary -> consultation`
- returns canonical values

### Why
Prevents legacy vocabulary from reappearing in new code.

---

# 4. Phase 2 Detailed Plan (Contract Hardening)

## 4.1 Appointment response normalization
Every appointment API response should consistently include:
- parsed `serviceItems`
- normalized `clinicalStatus`
- normalized `groomingStatus`
- normalized `source`
- clean `notes`

## 4.2 Frontend should consume only normalized shape
No page should parse `[WF]` directly.

## 4.3 Create shared frontend mapper
If not already centralized, add:
- `src/services/appointments/normalizeAppointment.ts`
or equivalent

---

# 5. Phase 3 Detailed Plan (Best Long-Term Upgrade)

## Goal
Stop storing workflow state inside `notes`.

## Proposed schema additions
Add nullable fields to `Appointment`:
- `clinicalStatus String?`
- `groomingStatus String?`
- `source String?`

## Migration plan
1. Add columns
2. Backfill from current notes metadata
3. Update write path to write columns + preserve notes text
4. Update read path to prefer columns
5. Monitor
6. Remove metadata dependence later

## Benefits
- cleaner reporting
- easier filtering
- safer codegen
- fewer accidental bugs
- less controller magic

---

# 6. Communication Refactor Plan (Recommended Later)

## Current split
- `ClientInteraction` = CRM / relationship history
- `NotificationLog` = delivery evidence / send history

## Recommended clarity
Document and enforce:

### Use `ClientInteraction` for:
- manual notes
- calls
- CRM history
- relationship context

### Use `NotificationLog` for:
- WhatsApp sends
- template sends
- delivery/failure logs
- automation audit

## Optional future enhancement
Create a unified “timeline” API response that merges both for UI, without merging DB models.

---

# 7. Hospitalization Refactor Plan (Optional)

## Current reality
Standalone operational module.

## Safe next step
Do **not** force appointment linkage immediately.

## Recommended path
1. Keep current standalone model
2. If business decides hospitalization should originate from schedule:
   - add optional `appointmentId`
   - support dual flows:
     - standalone admission
     - appointment-originated admission
3. Backfill only if necessary

---

# 8. Frontend Refactor Priorities

## Highest value
1. Centralize status labels
2. Centralize service type labels
3. Centralize appointment normalization assumptions
4. Keep grooming stages config-driven
5. Reduce page-level duplicate mapping logic

## Strategic page
`/clients/:id` should become the strongest “operational CRM hub”.

Recommended structure:
- Overview
- Pets
- Appointments
- Interactions
- Notifications
- Clinic
- Boarding
- Financials (if available)

---

# 9. What NOT to Refactor Yet

Avoid these until explicitly planned:

- splitting Grooming into its own DB table
- splitting Consultation into its own DB table
- rewriting all APIs to event sourcing
- changing every route contract at once
- removing `[WF]` notes metadata in one release
- changing all service type enums without compatibility layer

---

# 10. Recommended Files to Add (High Value, Low Risk)

## Backend
- `appointmentWorkflowMeta.ts`
- `appointmentStatusMap.ts`
- `boardingSync.ts`
- `serviceType.ts`

## Frontend
- `statusLabels.ts`
- `serviceTypeLabels.ts`
- `appointmentDisplay.ts`

These are the safest “first wins”.

---

# 11. Delivery Sequence I Recommend for You

If we implement with AI/Codex, the safest order is:

1. Generate shared helpers only
2. Update controllers to consume helpers
3. Update frontend pages to consume shared label helpers
4. Validate boarding flow
5. Only then plan schema migration for workflow metadata
6. Only later evaluate appointment linkage for medical/vaccination/hospitalization

---

# 12. Final Recommendation

## Best next technical move
**Do Phase 1 first**:
- helper extraction
- status centralization
- boarding sync service
- serviceType normalization

This will improve the codebase immediately without destabilizing production behavior.

---

# 13. Final Rule

**Refactor TecPet by making the current Appointment-centric architecture more explicit and safer—not by replacing it prematurely.**
