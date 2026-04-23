# TECPET_STATUS_MAP.md

## Purpose
Official status reference based on the **current real codebase**.

This file distinguishes:
- persisted statuses
- workflow metadata statuses
- UI-friendly labels
- known sync mappings

---

# 1. Appointment Status (Canonical)

## Canonical frontend union
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

## Notes
- This should be treated as the **true canonical operational set**
- Prisma schema comments are outdated / incomplete compared to actual usage

## Suggested PT-BR labels
- `scheduled` -> Agendado
- `confirmed` -> Confirmado
- `checked_in` -> Check-in realizado
- `in_progress` -> Em atendimento
- `checked_out` -> Check-out realizado
- `completed` -> Concluído
- `cancelled` -> Cancelado

---

# 2. Service Type Map (Canonical)

## Canonical values
- `consultation`
- `grooming`
- `boarding`

## Deprecated / inconsistent legacy mention
- `veterinary` appears in backend comments / legacy logic

## Rule
For new code, use:
- `consultation`
- `grooming`
- `boarding`

---

# 3. Clinical Status (Workflow Metadata)

## Current storage
Stored in `Appointment.notes` workflow metadata, not as DB column.

## Canonical values
- `waiting`
- `triage`
- `consultation`
- `completed`

## Suggested PT-BR labels
- `waiting` -> Aguardando
- `triage` -> Triagem
- `consultation` -> Em consulta
- `completed` -> Finalizado

## Typical progression
- waiting -> triage -> consultation -> completed

---

# 4. Grooming Status (Workflow Metadata)

## Current storage
Stored in `Appointment.notes` workflow metadata, not as DB column.

## Type
```ts
type GroomingStatus = string
```

## Rule
This is **dynamic**, based on configured grooming stages.

### Do NOT hardcode a fixed enum
Stages come from organization settings.

## Typical examples seen in UI logic
- first stage / waiting-like stage
- in service stages
- final stage
- delivery stage

## Suggested display behavior
Use the stage config object:
- `id`
- `title`
- `color`
- `isFinal`
- `isInitial`
- `isDelivery`

---

# 5. BoardingStay Status (Canonical persisted)

## Persisted values seen in backend logic
- `reserved`
- `active`
- `completed`
- `cancelled`

## Frontend type mismatch
Frontend `BoardingStay.status` is typed as:
- `active`
- `completed`
- `reserved`
- `cancelled`

This matches backend operationally.

## Suggested PT-BR labels
- `reserved` -> Reservado
- `active` -> Hospedado
- `completed` -> Encerrado
- `cancelled` -> Cancelado

---

# 6. Appointment -> BoardingStay Sync Map (Implemented)

This mapping exists in `appointment.controller.ts`.

## Mapping
- `scheduled` -> `reserved`
- `confirmed` -> `reserved`
- `checked_in` -> `active`
- `in_progress` -> `active`
- `checked_out` -> `completed`
- `completed` -> `completed`
- `cancelled` -> `cancelled`

## Official UI interpretation for boarding
- `checked_in` + `in_progress` => **Hospedado**
- `checked_out` + `completed` => **Encerrado**

---

# 7. Hospitalization Status (Canonical persisted)

## Persisted values
- `admitted`
- `treatment`
- `discharged`
- `deceased`

## Suggested PT-BR labels
- `admitted` -> Internado
- `treatment` -> Em tratamento
- `discharged` -> Alta / Encerrado
- `deceased` -> Óbito

---

# 8. Client Interaction Status

## Persisted values (inferred from frontend type)
- `done`
- `pending`
- `resolved`

## Suggested PT-BR labels
- `done` -> Concluído
- `pending` -> Pendente
- `resolved` -> Resolvido

---

# 9. NotificationLog Status

## Frontend canonical
- `sent`
- `failed`

## Suggested PT-BR labels
- `sent` -> Enviado
- `failed` -> Falhou

---

# 10. Task Status

## Frontend canonical
- `pending`
- `in_progress`
- `completed`

## Suggested PT-BR labels
- `pending` -> Pendente
- `in_progress` -> Em andamento
- `completed` -> Concluído

---

# 11. Task Priority

## Canonical
- `low`
- `medium`
- `high`

## Suggested PT-BR labels
- `low` -> Baixa
- `medium` -> Média
- `high` -> Alta

---

# 12. Kennel Status

## Persisted / frontend canonical
- `available`
- `maintenance`

## Suggested PT-BR labels
- `available` -> Disponível
- `maintenance` -> Manutenção

---

# 13. WhatsApp Connection Status

## Canonical
- `DISCONNECTED`
- `CONNECTING`
- `QRCODE`
- `CONNECTED`
- `ERROR`

## Suggested PT-BR labels
- `DISCONNECTED` -> Desconectado
- `CONNECTING` -> Conectando
- `QRCODE` -> Aguardando QR Code
- `CONNECTED` -> Conectado
- `ERROR` -> Erro

---

# 14. Message Template Module Map

## Canonical values
- `agendamento`
- `consulta`
- `banho_tosa`
- `hospedagem`
- `geral`

## Suggested labels
- `agendamento` -> Agendamento
- `consulta` -> Consulta
- `banho_tosa` -> Banho e Tosa
- `hospedagem` -> Hospedagem
- `geral` -> Geral

---

# 15. Message Template Trigger Map

## Canonical values
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

## Suggested labels
- `solicitacao` -> Solicitação
- `confirmacao` -> Confirmação
- `confirmacao_pendente` -> Confirmação pendente
- `cancelamento` -> Cancelamento
- `checkin` -> Check-in
- `checkout` -> Check-out
- `pronto` -> Pronto
- `finalizacao` -> Finalização
- `entrega` -> Entrega
- `lembrete` -> Lembrete
- `cobranca` -> Cobrança
- `personalizado` -> Personalizado

---

# 16. Safe UI Macro Mapping (Recommended)

## Non-boarding appointments
- `scheduled` -> Agendado
- `confirmed` -> Confirmado
- `checked_in` -> Em atendimento
- `in_progress` -> Em atendimento
- `completed` -> Concluído
- `cancelled` -> Cancelado

## Boarding appointments
- `scheduled` -> Agendado
- `confirmed` -> Confirmado
- `checked_in` -> Hospedado
- `in_progress` -> Hospedado
- `checked_out` -> Encerrando / Check-out realizado
- `completed` -> Encerrado
- `cancelled` -> Cancelado

---

# 17. Status Design Rules

## Always do
- Normalize status labels in UI
- Use helper functions / central mapping
- Keep boarding mapping separate from generic appointment mapping
- Read grooming stage labels from configuration

## Never do
- Expose raw workflow metadata JSON
- Hardcode grooming stages as fixed enum
- Reintroduce `veterinary` as primary serviceType
- Trust old Prisma comments over actual runtime behavior

---

# 18. Final Rule

**The most important status truth in the current project is: `Appointment.status` + workflow metadata (`clinicalStatus` / dynamic `groomingStatus`) + boarding sync mapping.**
