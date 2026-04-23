# TECPET_DOMAIN_RULES.md

## Scope
This file documents **real business rules inferred from the current codebase**.  
It intentionally prioritizes what is implemented today over previous conceptual plans.

---

# 1. Central Domain Rule

## Core rule
`Appointment` is the central operational record.

All day-to-day service execution is anchored on:
- `Appointment`
- `serviceType`
- `status`
- workflow metadata in `notes`

---

# 2. Service Entry Rules

## 2.1 Supported operational services (current)
- `consultation`
- `grooming`
- `boarding`

## 2.2 Public booking
There is a `/booking` flow that can create appointment requests / entries.

## 2.3 Schedule is the operational creation point
The Schedule module is the primary internal UI for creating and editing appointments.

---

# 3. Appointment Rules

## 3.1 Canonical fields used in business logic
- `petId` is mandatory
- `serviceType` is mandatory
- `date` is mandatory
- `duration` is relevant except boarding
- `status` drives lifecycle
- `returnDate` is meaningful for boarding
- `professionalId` required in some UI flows for non-boarding
- `serviceItems` is used for service breakdown
- `priority` and `appointmentType` are supported
- `tutorNotified` tracks tutor contact state

## 3.2 Non-boarding duration rule
Frontend indicates boarding may use:
- `duration = 0`

Do not enforce standard duration rules for boarding without checking the existing flow.

---

# 4. Workflow Metadata Rules (critical)

Current system stores these inside `Appointment.notes` metadata:

- `clinicalStatus`
- `groomingStatus`
- `source`

## Rule
When updating notes:
- preserve workflow metadata
- preserve user-visible note text
- do not overwrite metadata accidentally

## Required implementation pattern
Use the same parsing/building logic as `appointment.controller.ts`.

---

# 5. Grooming Rules

## 5.1 Grooming is not a separate DB entity
Grooming is represented by:
- `Appointment.serviceType = 'grooming'`
- `Appointment.status`
- `groomingStatus` in workflow metadata

## 5.2 Grooming stages are dynamic
Stages come from organization settings:
- `Organization.settings`
- surfaced in frontend as `groomingStages`

## 5.3 Do not hardcode grooming stages
Except for migration/refactor work, treat grooming stages as configurable.

## 5.4 Typical lifecycle (current behavior)
- Appointment created
- May initially have no `groomingStatus`
- Enters grooming workflow when first stage is assigned
- Kanban moves by stage ID
- Final / delivery behavior depends on configured stages

---

# 6. Clinic / Consultation Rules

## 6.1 Consultation is not a separate DB entity
Consultation is represented by:
- `Appointment.serviceType = 'consultation'`
- `Appointment.status`
- `clinicalStatus` in workflow metadata

## 6.2 Clinical sub-statuses (current)
- `waiting`
- `triage`
- `consultation`
- `completed`

## 6.3 Typical progression
- waiting
- triage
- consultation
- completed

## 6.4 Completion rule
Consultation may be considered completed when:
- `appointment.status === 'completed'`
- OR `clinicalStatus === 'completed'`

This dual logic already appears in frontend behavior.

---

# 7. Boarding Rules

## 7.1 Boarding uses two records
- `Appointment` (schedule + lifecycle anchor)
- `BoardingStay` (operational stay record)

## 7.2 Auto-create rule
When an appointment is created with `serviceType = 'boarding'`, backend attempts to auto-create a linked `BoardingStay`.

## 7.3 Idempotency expectation
The current create flow **attempts** creation, but future changes should preserve 1:1 semantics using:
- `BoardingStay.appointmentId @unique`

## 7.4 Boarding default values on linked creation
- `kennelNumber = 'TBD'`
- `status = 'reserved'`
- `dailyRate = 0`
- `totalPrice = 0`
- `checkOut = returnDate || +1 day from appointment date`

## 7.5 Update sync rule
Updating appointment should keep linked boarding aligned for:
- `checkIn`
- `checkOut`
- mapped `status`

---

# 8. Hospitalization Rules

## 8.1 Current modeling
Hospitalization is currently a standalone module:
- `HospitalizationStay`
- `HospitalizationLog`

## 8.2 It is not appointment-linked in current Prisma schema
Do not assume `appointmentId` exists on hospitalization today.

## 8.3 Statuses
- `admitted`
- `treatment`
- `discharged`
- `deceased`

---

# 9. Medical Record Rules

## 9.1 Current modeling
`MedicalRecord` belongs to `Pet`, not to `Appointment`.

## 9.2 Do not assume appointment linkage
There is no `appointmentId` column currently.

## 9.3 Current responsibility
Medical records are longitudinal pet history, not strictly visit-bound in persistence.

---

# 10. Vaccination Rules

## 10.1 Current modeling
`Vaccination` belongs to `Pet`, not to `Appointment`.

## 10.2 Do not assume appointment linkage
No `appointmentId` exists currently.

---

# 11. Client Communication Rules

## 11.1 Two layers
### CRM history
`ClientInteraction`
- relationship-level log
- can be manual or auto

### Delivery/message log
`NotificationLog`
- actual sent notification records
- especially WhatsApp automation

## 11.2 Recommendation for new features
If feature is about:
- relationship history / manual contact / call / note -> prefer `ClientInteraction`
- sent message / delivery evidence / automation audit -> prefer `NotificationLog`

---

# 12. WhatsApp Confirmation Rules

## 12.1 Confirmation request state is stored on Appointment
Relevant fields:
- `awaitingWhatsappReply`
- `whatsappConfirmationStatus`
- `whatsappConfirmationSentAt`
- `whatsappConfirmationReplyAt`
- `whatsappReplyText`
- `whatsappLastMessageId`
- `confirmedVia`

## 12.2 Pending confirmation flow
Scheduler sends interactive confirmation messages based on templates.

## 12.3 Reply semantics (observed in controller)
Typical semantics include:
- `1` = confirm
- `2` = request reschedule
- `3` = likely cancel / decline (should preserve existing controller logic)

Do not rewrite without checking the full controller.

---

# 13. Template Rules

## MessageTemplate is first-class
Templates support:
- `module`
- `trigger`
- `sendMode`
- `sendDelay`
- `minutesBefore`

## Modules
- `agendamento`
- `consulta`
- `banho_tosa`
- `hospedagem`
- `geral`

## Triggers (frontend canonical)
- `solicitacao`
- `confirmacao`
- `confirmacao_pendente`
- `cancelamento`
- `checkin`
- `checkout`
- `pronto`
- `finalizacao`
- `entrega`
- `lembrete`
- `cobranca`
- `personalizado`

---

# 14. Safe Rules for New Development

## Preserve current architecture
Prefer extending:
- `Appointment`
- `BoardingStay`
- `MedicalRecord`
- `Vaccination`
- `HospitalizationStay`

Instead of inventing:
- `Consultation` table
- `BathGrooming` table

Unless explicitly requested as a migration.

## Keep frontend/backend aligned
When changing enums or field names:
- update frontend types
- update backend controllers
- update scheduler logic
- update templates logic

---

# 15. High-Risk Areas (avoid breaking)

These areas are tightly coupled and should be changed carefully:

1. `Appointment.notes` workflow metadata format
2. `serviceType` naming (`consultation` vs `veterinary`)
3. Boarding auto-create + sync behavior
4. Scheduler filters based on status and templates
5. `serviceItems` JSON serialization/parsing

---

# 16. Final Domain Rule

**If there is any doubt, preserve the existing Appointment-centric workflow and extend it incrementally rather than redesigning the domain implicitly.**
