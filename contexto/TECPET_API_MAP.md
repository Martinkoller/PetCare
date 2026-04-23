# TECPET_API_MAP.md

## Purpose
Reference map for backend API expectations based on the **current real codebase structure and behavior**.

This is intended for:
- Codex generation
- safe endpoint additions
- avoiding route hallucination
- preserving contracts

---

# 1. API Style

## Current style
- Express REST-ish routes
- Resource-oriented endpoints
- Some action endpoints for transitions / utilities
- JSON responses
- Frontend service layer consumes normalized payloads

## Rule
Prefer extending existing REST-like patterns over introducing a new architecture.

---

# 2. Core Route Groups (real project map)

These route groups exist conceptually in the current codebase and should be treated as canonical.

## Core operational
- `/appointments`
- `/clients`
- `/pets`
- `/boardings`
- `/hospitalization`

## Config / support
- `/services`
- `/templates`
- `/whatsapp`
- `/organization`
- `/users`

## Business / support
- `/products`
- `/sales`
- `/tasks`
- `/dashboard`

> Exact filenames may vary, but these groups match the current system structure and frontend usage.

---

# 3. Appointments API (Most Important)

## Role
`/appointments` is the central operational API.

## Current responsibilities
- create appointment
- list appointments
- update appointment
- cancel / complete / status changes (depending on implementation style)
- normalize workflow metadata from `notes`
- parse `serviceItems`
- auto-create / sync boarding when needed

---

## 3.1 Expected response normalization (critical)
Appointment responses should expose normalized fields even when not persisted as columns:

### Expected normalized output shape
- all base `Appointment` fields
- `serviceItems` parsed from JSON string
- `clinicalStatus` extracted from `[WF]` notes metadata
- `groomingStatus` extracted from `[WF]` notes metadata
- `source` extracted from `[WF]` notes metadata
- visible `notes` (without leaking raw metadata block, if normalized that way)

## Rule
Frontend should not need to parse `[WF]` manually.

---

## 3.2 Appointment create rule
When creating:
- validate `petId`
- validate `serviceType`
- normalize `serviceItems`
- preserve metadata structure if writing notes
- if `serviceType === 'boarding'`, create linked `BoardingStay`

---

## 3.3 Appointment update rule
When updating:
- preserve workflow metadata in notes
- preserve user-visible notes
- if boarding-linked, sync `BoardingStay`

---

# 4. Boarding API

## Role
`/boardings` manages operational stay data.

## Current model
- `BoardingStay`
- linked to `Appointment` optionally by `appointmentId`

## Expected responsibilities
- list stays
- get stay details
- update kennel / pricing / notes / status
- add/remove `BoardingService`
- reflect operational stay separate from schedule

## Important rule
Boarding status and Appointment status may both exist; keep them consistent through defined mapping, not ad hoc edits.

---

# 5. Hospitalization API

## Role
`/hospitalization` manages standalone hospitalization workflows.

## Current model
- `HospitalizationStay`
- `HospitalizationLog`

## Expected responsibilities
- create stay
- list stays
- update status
- append logs
- discharge / close flow

## Important rule
Do not assume `appointmentId` support unless explicitly added by migration.

---

# 6. Clients API

## Role
Client CRM + master data.

## Expected responsibilities
- CRUD client
- fetch profile
- include pets
- include interactions/history
- possibly include aggregates for appointments / notifications

## Important rule
Client profile is a cross-module aggregation surface.

---

# 7. Pets API

## Role
Pet master data + longitudinal history anchor.

## Expected responsibilities
- CRUD pet
- list pet appointments
- list medical records
- list vaccinations
- list hospitalization stays
- support profile pages / filters

---

# 8. Services API

## Role
Service catalog and pricing.

## Expected entity
- `ServiceCatalogItem`

## Expected responsibilities
- list services
- create/edit services
- categorize by module / type
- support appointment service item composition

---

# 9. Templates API

## Role
Message template management.

## Expected entity
- `MessageTemplate`

## Important fields
- `module`
- `trigger`
- `sendMode`
- `sendDelay`
- `minutesBefore`

## Rule
Template APIs should preserve current trigger vocabulary and not invent incompatible enums.

---

# 10. WhatsApp API

## Role
Operational integration + status + sending support.

## Expected responsibilities
- connection status
- QR code / session flow
- manual sends
- template sends
- scheduler support hooks
- notification log persistence

## Important rule
Do not bypass logging when sending automated or manual operational messages.

---

# 11. Dashboard API

## Role
Aggregated operational metrics.

## Expected responsibilities
- today appointments
- counts by service type
- boarding occupancy / status
- tasks summary
- financial quick metrics (if current implementation exposes)

## Rule
Prefer read-model aggregation endpoints over overloading `/appointments`.

---

# 12. Tasks API

## Role
Operational task tracking.

## Expected entity
- `Task`

## Statuses
- `pending`
- `in_progress`
- `completed`

---

# 13. Products / Sales API

## Products
- inventory items
- stock
- batches
- costs / pricing

## Sales
- sale header + items
- client association when applicable
- stock deduction behavior (if implemented)

## Rule
These modules exist in the current codebase and should not be ignored in future context docs.

---

# 14. Safe Endpoint Design Rules for New APIs

## Always do
- stay resource-oriented
- normalize payloads for frontend convenience
- preserve existing enum vocabulary
- return stable shapes
- keep module-specific endpoints narrow and explicit

## Prefer
- `GET /resource`
- `GET /resource/:id`
- `POST /resource`
- `PATCH /resource/:id`
- action endpoints only when transition semantics matter

### Example
- `POST /appointments/:id/confirm`
- `POST /appointments/:id/check-in`
- `POST /appointments/:id/complete`

---

# 15. High-Risk Contract Areas

These are the most likely to break frontend if changed carelessly:

1. Appointment normalized response shape
2. `serviceItems` serialization/parsing
3. `serviceType` vocabulary
4. `clinicalStatus` extraction
5. `groomingStatus` extraction
6. Boarding auto-sync behavior
7. Template trigger/module enums
8. WhatsApp log expectations

---

# 16. Final Rule

**The API layer must hide storage quirks (like `[WF]` metadata and JSON strings) and expose stable, normalized contracts to the frontend.**
