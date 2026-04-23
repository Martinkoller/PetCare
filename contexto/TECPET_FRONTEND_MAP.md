# TECPET_FRONTEND_MAP.md

## Purpose
Frontend architecture map and guardrails based on the **current real codebase**.

This file helps Codex:
- generate components in the existing style
- avoid wrong assumptions
- preserve navigation and state patterns
- align with the real module structure

---

# 1. Frontend Stack

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- shadcn/ui-style component architecture
- lazy-loaded pages
- service layer under `src/services`
- shared types under `src/lib/types.ts`

---

# 2. Real Route Map (Canonical)

## Public / entry
- `/booking`

## Main application routes
- `/dashboard`
- `/schedule`
- `/tasks`
- `/clients`
- `/clients/:id`
- `/pets`
- `/grooming`
- `/clinic`
- `/boarding`
- `/hospitalization`
- `/admin`
- `/services`
- `/inventory`
- `/sales`
- `/financials`
- `/knowledge`

## Rule
Do not invent major new route groups unless explicitly requested.

---

# 3. Page Responsibility Map

## `/schedule`
Primary operational planning screen.

### Responsibilities
- create/edit appointments
- visualize schedule by day/week
- move between dates
- open module-related actions
- show normalized appointment status

---

## `/grooming`
Operational grooming workflow.

### Responsibilities
- show grooming queue / kanban
- stage progression
- dynamic stage config
- status derived from `Appointment` + `groomingStatus`

### Critical rule
Grooming stages are **config-driven**, not hardcoded enum-based.

---

## `/clinic`
Clinical workflow page.

### Responsibilities
- triage / consultation flow
- show clinical sub-status
- interact with medical records / vaccination context
- status derived from `Appointment` + `clinicalStatus`

---

## `/boarding`
Boarding operational page.

### Responsibilities
- show boarding stays
- check-in / active / checkout flows
- manage kennel and service extras
- separate operational view from schedule

---

## `/hospitalization`
Standalone hospitalization workflow page.

### Responsibilities
- list active stays
- update status
- show logs / evolution
- discharge / closure

---

## `/clients`
Client list / CRM entry point.

### Responsibilities
- search / filter clients
- navigate to client profile

---

## `/clients/:id`
Client profile / CRM hub.

### Responsibilities
- show client data
- show pets
- show cross-module history
- show interactions / communication history
- likely a core aggregation page

---

## `/pets`
Pet list / pet master data.

### Responsibilities
- list pets
- navigate to pet-related actions/history

---

## `/booking`
Public-facing or semi-public booking entry.

### Responsibilities
- request appointment
- capture client/pet/service intent
- feed internal appointment flow

---

# 4. Shared Type Rules

## Canonical source
`src/lib/types.ts`

## Rule
Before generating frontend code:
- check existing type names
- extend existing types instead of redefining similar ones
- avoid parallel incompatible interfaces

## Critical types to preserve
- `Appointment`
- `AppointmentStatus`
- `ServiceType`
- `BoardingStay`
- `Client`
- `Pet`
- `MedicalRecord`
- `Vaccination`
- `Task`
- `NotificationLog`
- `MessageTemplate`

---

# 5. State / Service Layer Rules

## Existing pattern
Frontend already uses:
- page-level logic
- services
- stores/contexts

## Rule
Prefer:
- extending existing service modules
- centralizing API calls in `src/services`
- centralizing status helpers in reusable utils
- avoiding API fetch logic duplicated across pages

---

# 6. Status Rendering Rules

## Always use friendly labels
Do not show raw status enums directly in UI unless explicitly intended for admin/debug.

## Critical rules
- `Appointment.status` should be normalized by helper
- `clinicalStatus` should be rendered from normalized API response
- `groomingStatus` should be resolved via configured stage metadata
- boarding has special display mapping

## Best practice
Create shared helpers like:
- `getAppointmentStatusLabel()`
- `getBoardingStatusLabel()`
- `getClinicalStatusLabel()`
- `resolveGroomingStageMeta()`

---

# 7. Grooming UI Rules (Very Important)

## Current reality
Grooming is dynamic-stage driven.

### Do not do
- hardcode fixed stages as enum
- assume 4-column static kanban
- assume final stage ID names

### Do
- read stage config from organization settings
- render columns from config
- use flags like:
  - `isInitial`
  - `isFinal`
  - `isDelivery`
- sort by configured order

---

# 8. Schedule UI Rules

## Current reality
Schedule is central and sensitive.

## When modifying:
- preserve current navigation pattern
- preserve appointment edit interactions
- preserve date navigation logic
- avoid breaking day/week parity
- avoid changing raw appointment shape assumptions without updating services

## Recommended
Keep schedule-specific formatting and grouping logic isolated from raw API models.

---

# 9. Client / CRM UI Rules

## Client profile is strategic
Treat `/clients/:id` as a “context hub”, not just a CRUD form.

## Prefer sections/tabs like
- Overview
- Pets
- Appointments
- Interactions
- Notifications
- Financial / history (if already exposed)
- Clinical / service summaries

---

# 10. Form Rules

## Always do
- reuse existing dialog/form patterns
- validate against current backend expectations
- preserve enum vocabulary from types
- support nullable optional fields gracefully

## Avoid
- introducing new required fields without backend support
- using invented statuses/types
- forcing strict field assumptions where API currently normalizes optional data

---

# 11. Service Layer Rules

## For new frontend work
Prefer adding/updating files in `src/services` rather than fetching directly in components.

## Benefits
- easier contract updates
- centralized normalization
- less repeated fetch logic
- safer refactors

---

# 12. High-Risk Frontend Areas

These should be changed carefully:

1. Schedule page (especially day/week behavior)
2. Grooming stage rendering
3. Appointment editor modal/dialog
4. Client profile aggregation logic
5. WhatsApp template/config pages
6. Any code that assumes `clinicalStatus` or `groomingStatus` are raw DB fields

---

# 13. Safe Frontend Refactors

## Recommended
- centralize status label helpers
- centralize service type label helpers
- centralize date formatting
- centralize appointment normalization types
- extract repeated cards/tables
- keep route ownership clear

---

# 14. Design / UX Direction (aligned to your project)

Based on the current codebase + your prior adjustments:

- operational first
- minimal header clutter
- contextual actions
- strong information hierarchy
- client/pet context visible
- avoid decorative top banners
- reduce redundant actions in top bar
- prioritize speed for daily usage

---

# 15. Final Rule

**Frontend should treat the API as normalized and should not replicate backend storage quirks (like `[WF]` metadata parsing) inside pages.**
