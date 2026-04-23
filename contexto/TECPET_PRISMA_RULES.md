# TECPET_PRISMA_RULES.md

## Purpose
Prisma and database guardrails based on the **current real codebase**.

This file documents:
- current schema reality
- safe constraints
- migration-sensitive areas
- what Codex must preserve

---

# 1. Current Database Reality

## ORM
- Prisma

## Current provider
- SQLite (development)
- database file currently under `server/prisma/dev.db`

## Important implication
SQLite is permissive in development, but future migration to Postgres/MySQL may expose hidden assumptions:
- date parsing inconsistencies
- enum looseness
- stringified JSON handling
- transaction behavior differences

---

# 2. Canonical Existing Models (real schema baseline)

## Core
- `User`
- `Client`
- `ClientInteraction`
- `Pet`
- `Appointment`
- `MedicalRecord`
- `Vaccination`

## Operations
- `ServiceCatalogItem`
- `BoardingStay`
- `BoardingService`
- `HospitalizationStay`
- `HospitalizationLog`
- `Kennel`

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

---

# 3. Current Schema Truths (Must Preserve)

## 3.1 `Appointment` is the operational core
Most workflows depend on `Appointment`.

## 3.2 `BoardingStay.appointmentId` is the important 1:1 link
This is the current specialized-module linkage that should be preserved.

## 3.3 `MedicalRecord` does NOT currently have `appointmentId`
Do not assume visit-bound persistence exists.

## 3.4 `Vaccination` does NOT currently have `appointmentId`
Vaccination is pet-bound today.

## 3.5 `HospitalizationStay` does NOT currently have `appointmentId`
Hospitalization is standalone in current schema.

## 3.6 Some business state is NOT modeled as columns
These are currently stored outside explicit columns:
- `clinicalStatus`
- `groomingStatus`
- `source`

They are encoded inside `Appointment.notes` metadata.

---

# 4. Column Behavior Rules (Critical)

## 4.1 `Appointment.notes`
This field is not “just notes”.

It currently stores:
- workflow metadata in the first line with `[WF]`
- optional human-readable notes after that

## Rule
Any Prisma write that updates `notes` must preserve the metadata structure.

## Safe behavior
Never do:
```ts
data: { notes: "new text" }
```

unless you intentionally rebuild the workflow metadata payload.

---

## 4.2 `Appointment.serviceItems`
This is stored as a JSON string in the database.

### Rule
- Persist as serialized JSON string
- Expose as parsed array/object in API layer
- Do not convert DB column type implicitly without migration planning

---

## 4.3 `Appointment.serviceType`
There is a schema/runtime vocabulary mismatch risk.

### Canonical runtime values to preserve
- `consultation`
- `grooming`
- `boarding`

### Legacy mentions may still exist
- `veterinary`

### Rule
Do not “fix” this only in one layer. If changing:
- backend controllers
- frontend types
- filters
- scheduler
- templates
must all be updated together.

---

# 5. Safe Constraint Rules

## 5.1 Preserve current unique relations
Must preserve:
- `BoardingStay.appointmentId @unique`

## 5.2 Safe future candidates (NOT current reality)
These are valid future migrations, but not current assumptions:
- `MedicalRecord.appointmentId @unique?`
- `Vaccination.appointmentId @unique?` (only if one vaccination per appointment is intended)
- `HospitalizationStay.appointmentId @unique?`

Mark as migration-only, never as current behavior.

---

# 6. Date / Time Handling Rules

## Current risk
SQLite + JS dates can cause:
- timezone drift
- inconsistent serialization
- comparisons by local vs UTC

## Safe Prisma rule
When generating queries:
- normalize date boundaries explicitly
- avoid relying on implicit local midnight
- use consistent `Date` object construction
- be careful in scheduler windows

## High-risk areas
- reminders
- confirmation pending
- follow-up timing
- boarding check-in/check-out comparisons

---

# 7. Delete Behavior Rules

## Recommendation
Do not introduce cascading deletes casually.

Because current product has:
- historical logs
- CRM history
- message logs
- boarding linkage
- sales/inventory

## Safe default
Prefer:
- soft-preserve related history
- explicit cleanup services
- validation before destructive deletes

---

# 8. Transaction Rules

## Use transactions when:
- creating appointment + linked boarding stay
- updating appointment + syncing boarding stay
- future migrations that split notes metadata into columns
- multi-record message/log persistence

## Safe rule
If two records must stay aligned in the same user action, prefer `prisma.$transaction`.

---

# 9. Schema Evolution Rules

## Allowed low-risk additions
Safe to add if requested:
- indexes
- optional columns
- non-breaking audit fields
- helper relation indexes

## High-risk changes
Only do with explicit migration plan:
- renaming `serviceType` semantics
- changing `serviceItems` storage type
- moving workflow metadata out of `notes`
- linking hospitalization to appointment
- linking medical records to appointment
- linking vaccinations to appointment

---

# 10. Indexing Recommendations (Safe / Optional)

These are safe and useful if not already present:

## Appointment
- index on `petId`
- index on `date`
- index on `status`
- composite index on `(serviceType, date)`
- index on `professionalId`

## BoardingStay
- index on `petId`
- index on `status`
- unique on `appointmentId` (must preserve)

## HospitalizationStay
- index on `petId`
- index on `status`

## NotificationLog
- index on `createdAt`
- index on `status`
- index on `manual`

## ClientInteraction
- index on `clientId`
- index on `createdAt`

---

# 11. Migration Strategy for Workflow Metadata (Future)

## Current reality
Workflow data lives in `Appointment.notes`.

## Recommended migration path (future only)
1. Add nullable columns:
   - `clinicalStatus`
   - `groomingStatus`
   - `source`
2. Backfill from existing `[WF]` notes payload
3. Update API normalization to read columns first, notes fallback second
4. Deploy dual-read / single-write
5. Migrate old rows
6. Remove notes metadata coupling only after verification

## Rule
Do not do a hard cutover in one step.

---

# 12. Safe Prisma Coding Rules for Codex

## Always do
- inspect actual model fields before writing
- preserve unique constraints
- preserve stringified JSON columns
- use transactions for linked writes
- treat `notes` as structured content

## Never do
- assume missing columns exist
- write direct updates that wipe workflow metadata
- create separate tables that aren’t in schema
- silently change relation cardinality

---

# 13. Final Rule

**Prisma must reflect the live schema first. Improvements are welcome, but they must be introduced as explicit migrations—not as assumptions in generated code.**
