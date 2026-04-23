# TECPET_CONTEXT.md

## Project
TecPet (current codebase analyzed from `petcare - Copia`)

## Stack
- Frontend: React 19 + Vite + TypeScript + shadcn/ui + Tailwind
- Backend: Node.js + Express + TypeScript
- Database: Prisma + SQLite (`server/prisma/dev.db`)
- Messaging: WhatsApp integration via Evolution-style service + local JSON config/templates/logs

---

# 1. Current Product Scope (real code)

This codebase is **broader than the original V1 concept**. The current implemented product includes:

## Core operational modules
- Dashboard
- Schedule / Agenda
- Booking (public/online entry)
- Clients
- Client Profile
- Pets
- Grooming
- Clinic
- Boarding
- Hospitalization

## Admin / support modules
- Services catalog
- Inventory
- Sales
- Financials
- Tasks
- Admin
- Knowledge
- Organization settings
- WhatsApp templates / automation
- Professionals

---

# 2. Routing (frontend real routes)

## Public-ish
- `/booking`

## App routes
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

---

# 3. Architectural Reality (important)

## Actual central orchestrator
The **Appointment** entity is the real central operational record in the current codebase.

### Appointment drives:
- Schedule
- Grooming workflow
- Clinic workflow
- Boarding linkage
- WhatsApp reminders / confirmations / follow-ups
- Dashboard metrics
- Client history
- Financial views (partially)

## Golden rule (real code)
**All operational service flows are centered on `Appointment`, and some specialized modules are linked from it.**

This is slightly different from the original “Agenda-first conceptual doc”, but functionally equivalent:
- Schedule UI creates `Appointment`
- Specialized modules consume/update the same appointment
- Boarding additionally creates `BoardingStay` linked by `appointmentId`

---

# 4. Canonical Implemented Entities (from Prisma)

## Core
- `User`
- `Client`
- `ClientInteraction`
- `Pet`
- `Appointment`
- `MedicalRecord`
- `Vaccination`

## Services / operations
- `ServiceCatalogItem`
- `BoardingStay`
- `BoardingService`
- `HospitalizationStay`
- `HospitalizationLog`

## Commercial / support
- `Product`
- `ProductBatch`
- `Sale`
- `SaleItem`
- `Task`
- `Organization`
- `AppointmentTemplate`
- `MessageTemplate`
- `NotificationLog`
- `Kennel`

---

# 5. Core Domain Relationships (real code)

## Client
- hasMany `Pet`
- hasMany `ClientInteraction`

## Pet
- belongsTo `Client`
- hasMany `Appointment`
- hasMany `MedicalRecord`
- hasMany `Vaccination`
- hasMany `HospitalizationStay`

## Appointment
- belongsTo `Pet`
- service type driven
- may link to `BoardingStay` via `appointmentId`
- stores workflow metadata in `notes` (see section 8)

## BoardingStay
- has optional `appointmentId @unique`
- hasMany `BoardingService`

## HospitalizationStay
- belongsTo `Pet`
- hasMany `HospitalizationLog`

---

# 6. Real Implemented Service Types

## Canonical service types actually used in frontend
```ts
type ServiceType = 'consultation' | 'grooming' | 'boarding'
```

## Important backend mismatch
Backend comments still mention:
- `'grooming'`
- `'veterinary'`
- `'boarding'`

But frontend consistently uses:
- `consultation`
- `grooming`
- `boarding`

## Rule for future code
**Treat `consultation` as canonical. Do not introduce `veterinary` unless explicitly performing a migration/refactor.**

---

# 7. Real Appointment Model (practical)

## Important fields
- `id`
- `petId`
- `professionalId`
- `serviceType`
- `date`
- `duration`
- `price`
- `status`
- `notes`
- `serviceItems` (JSON string in DB)
- `returnDate`
- `startedAt`
- `currentStageStartedAt`
- `priority`
- `appointmentType`
- `tutorNotified`

## WhatsApp / automation fields
- `whatsappConfirmationStatus`
- `whatsappConfirmationSentAt`
- `whatsappConfirmationReplyAt`
- `awaitingWhatsappReply`
- `whatsappLastMessageId`
- `whatsappReplyText`
- `confirmedVia`
- `reminderSentAt`
- `confirmationRequestSentAt`
- `followUpSentAt`

---

# 8. Hidden Workflow Metadata Pattern (VERY IMPORTANT)

The codebase stores **extra workflow state inside `Appointment.notes`** using a prefix:

```ts
const META_PREFIX = '[WF]'
```

The first line of notes may contain JSON metadata:
- `clinicalStatus`
- `groomingStatus`
- `source`

Then optional user-visible note text comes after the first line.

## This is critical
Current backend uses helper functions to:
- parse metadata from notes
- preserve visible notes
- normalize API responses

## Consequence
Do **not** assume `clinicalStatus`, `groomingStatus`, or `source` are real Prisma columns in the current backend.

They are currently:
- stored inside `notes`
- exposed as normalized API fields in `appointment.controller.ts`

---

# 9. Current Specialized Modules (real implementation)

## Grooming
Uses `Appointment` with:
- `serviceType = 'grooming'`
- `status`
- `groomingStatus` (stored in notes meta)

## Clinic
Uses `Appointment` with:
- `serviceType = 'consultation'`
- `status`
- `clinicalStatus` (stored in notes meta)

Also uses:
- `MedicalRecord`
- `Vaccination`

## Boarding
Uses:
- `Appointment` with `serviceType = 'boarding'`
- linked `BoardingStay` auto-created on appointment creation

### Implemented linkage rule
On appointment creation:
- if `serviceType === 'boarding'`
- backend attempts to create `BoardingStay` automatically

On appointment update:
- boarding stay dates/status are synchronized from appointment

## Hospitalization
Currently appears as a **standalone module**, not visibly linked to Appointment in Prisma.
Uses:
- `HospitalizationStay`
- `HospitalizationLog`

This differs from the earlier conceptual V1 plan.

---

# 10. Real Implemented Sync Rule (Boarding only)

Boarding is the only clearly implemented Appointment <-> specialized module sync in the backend.

## Create sync
When appointment is created with `serviceType = 'boarding'`:
- create `BoardingStay`
- `appointmentId = appointment.id`
- default `kennelNumber = 'TBD'`
- default `status = 'reserved'`
- default pricing initialized as `0`

## Update sync
Appointment status maps to BoardingStay status:

- `scheduled` -> `reserved`
- `confirmed` -> `reserved`
- `checked_in` -> `active`
- `in_progress` -> `active`
- `checked_out` -> `completed`
- `completed` -> `completed`
- `cancelled` -> `cancelled`

---

# 11. Current Status Model (real code)

## Appointment.status (frontend canonical)
```ts
type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'checked_out'
  | 'completed'
  | 'cancelled'
```

This is broader than the Prisma schema comment and should be treated as canonical.

---

# 12. Current Module-Specific Statuses

## Clinical (frontend)
```ts
type ClinicalStatus = 'waiting' | 'triage' | 'consultation' | 'completed'
```

Stored today inside `Appointment.notes` metadata.

## Grooming
```ts
type GroomingStatus = string
```

Real behavior:
- stage IDs are dynamic
- configured from organization settings (`groomingStages`)
- examples include waiting / final / delivery style stages
- **do not hardcode a closed enum** unless you are intentionally migrating

---

# 13. Client Communication Reality

There are **two related but distinct concepts**:

## A. ClientInteraction (CRM / relationship log)
Database table:
- `client_interactions`

Used for:
- manual or automatic relationship history
- type, origin, subject, body, related pet, related context

## B. NotificationLog (message delivery log)
Database table:
- `notification_logs`

Used for:
- WhatsApp / notification send history
- clientName / petName snapshots
- type
- message
- status
- manual flag

## Important
In the current codebase, **NotificationLog is the closer equivalent to a communication send log**, while **ClientInteraction is broader CRM history**.

---

# 14. WhatsApp Automation (real behavior)

Implemented scheduler:
- runs every 5 minutes
- initial run ~10s after server start

## Processes
- reminders (`lembrete`)
- pending confirmations (`confirmacao_pendente`)
- delayed follow-ups
- task alerts

## Uses
- `MessageTemplate`
- `Appointment` state
- `NotificationLog`
- `whatsapp-*` services

---

# 15. Current UI/UX Direction (from code + prior alignment)

The codebase already follows a strong operational pattern:

- Schedule is central
- Grooming has kanban/stage workflow
- Clinic uses triage -> consultation progression
- Boarding is operationally separate but appointment-linked
- Client profile aggregates cross-module history
- Statuses are often normalized for display
- Public booking exists as a front door

---

# 16. What is NOT currently true in code

Do **not** assume these are already implemented just because they were in conceptual planning:

- `appointmentId` on `MedicalRecord`
- `appointmentId` on `Vaccination`
- `appointmentId` on `HospitalizationStay`
- 1:1 Consultation record entity
- Separate BathGrooming table
- Separate Consultation table
- Full event bus architecture
- Full message orchestration by module entity

These may be future targets, but are **not current persisted reality**.

---

# 17. Safe Canonical Product Definition (based on real code)

**TecPet is a React + Node + Prisma pet care management system centered on Appointments, with operational modules for grooming, clinic, boarding, hospitalization, client/pet CRM, inventory, sales, tasks, and WhatsApp automation.**

---

# 18. Rules for Code Generation

## Always assume
- `Appointment` is the central operational entity
- `serviceType` canonical values are `consultation`, `grooming`, `boarding`
- Boarding is linked to Appointment by `appointmentId`
- `clinicalStatus` and `groomingStatus` are currently encoded in `notes` metadata
- `serviceItems` is persisted as JSON string in DB but exposed as parsed array in API
- UI should use normalized fields, not raw DB storage assumptions

## Never assume
- Separate consultation/grooming tables exist
- `clinicalStatus` is a DB column
- `groomingStatus` is a DB column
- Hospitalization is already appointment-linked
- `veterinary` is the canonical serviceType for new code

---

# 19. Migration-Friendly Guidance

If future refactors are requested, the best next architectural upgrades are:

1. Move `clinicalStatus`, `groomingStatus`, and `source` from notes metadata to real columns
2. Standardize `serviceType` to `consultation | grooming | boarding` everywhere
3. Optionally add `appointmentId` to:
   - `MedicalRecord`
   - `Vaccination`
   - `HospitalizationStay`
4. Introduce explicit status mapping helpers shared by frontend/backend
5. Unify communication logging strategy between `ClientInteraction` and `NotificationLog`

---

# 20. Final Rule

**In the current real codebase, Appointment is the true source of operational truth. Specialized modules either enrich it, derive from it, or sync from it.**
