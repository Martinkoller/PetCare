export type HospitalizationStatus =
  | 'admitted'
  | 'under_observation'
  | 'treatment'
  | 'critical'
  | 'ready_for_discharge'
  | 'discharged'
  | 'transferred'
  | 'deceased'
  | 'cancelled'

export type HospitalizationOrigin =
  | 'appointment'
  | 'emergency'
  | 'post_surgery'
  | 'return'
  | 'referral'
  | 'walk_in'

export type DischargeType =
  | 'discharge'
  | 'transfer'
  | 'death'
  | 'cancelled'

export type HospitalizationLogType =
  | 'admission'
  | 'medical_evolution'
  | 'nursing'
  | 'medication'
  | 'incident'
  | 'procedure'
  | 'owner_contact'
  | 'discharge'
  | 'prescription_created'
  | 'care_check'

export type HospitalizationPrescriptionType =
  | 'medication'
  | 'fluid_therapy'
  | 'feeding'
  | 'exam'
  | 'procedure'
  | 'monitoring'

export type HospitalizationPrescriptionFrequency =
  | 'once'
  | 'q4h'
  | 'q6h'
  | 'q8h'
  | 'q12h'
  | 'q24h'
  | 'custom'

export type CareTaskStatus =
  | 'pending'
  | 'done'
  | 'late'
  | 'cancelled'

export interface HospitalizationVitals {
  heartRate?: number
  respiratoryRate?: number
  temperature?: number
  mucousMembranes?: string
  capillaryRefillTime?: string
  hydrationLevel?: string
  consciousness?: string
  painScore?: number
}

export interface HospitalizationClinicalChecks {
  appetite?: 'normal' | 'partial' | 'refused'
  urination?: 'yes' | 'no' | 'unknown'
  defecation?: 'yes' | 'no' | 'unknown'
  vomiting?: boolean
  diarrhea?: boolean
}

export interface HospitalizationCareTask {
  id: string
  prescriptionId: string
  stayId: string

  scheduledFor: string
  status: CareTaskStatus

  executedAt?: string
  executedByName?: string
  notes?: string
}

export interface HospitalizationPrescription {
  id: string
  stayId: string
  petId: string

  type: HospitalizationPrescriptionType
  title: string
  instructions?: string

  frequency: HospitalizationPrescriptionFrequency
  customFrequencyHours?: number

  startAt: string
  endAt?: string | null

  quantity?: string
  route?: string

  active: boolean
  createdAt: string
  createdByName?: string

  tasks: HospitalizationCareTask[]
}

export interface HospitalizationLog {
  id: string
  stayId: string
  petId: string

  type: HospitalizationLogType
  createdAt: string
  eventAt?: string

  createdById?: string
  createdByName?: string
  createdByRole?: 'vet' | 'assistant' | 'reception' | 'admin'

  vitals?: HospitalizationVitals
  clinical?: HospitalizationClinicalChecks

  notes?: string
  conduct?: string
  statusAfter?: HospitalizationStatus

  // Compatibilidade legado
  heartRate?: number
  temperature?: number
}

export interface HospitalizationStay {
  id: string
  petId: string
  pet?: {
    id: string
    name: string
    species?: string
    breed?: string
    clientId?: string
  }

  appointmentId?: string
  kennelNumber: string

  status: HospitalizationStatus
  origin?: HospitalizationOrigin

  reasonForAdmission: string
  presumptiveDiagnosis?: string
  finalDiagnosis?: string

  attendingVetId?: string
  attendingVetName?: string

  triageLevel?: 'low' | 'medium' | 'high' | 'critical'
  weightAtAdmission?: number

  initialNotes?: string
  treatmentPlan?: string

  admittedAt: string
  dischargeAt?: string | null
  bedReleasedAt?: string | null

  dischargeType?: DischargeType
  dischargeCondition?: 'stable' | 'improved' | 'critical' | 'deceased'
  dischargeSummary?: string
  dischargeInstructions?: string
  dischargeMedications?: string
  returnRecommendation?: string

  logs?: HospitalizationLog[]
  prescriptions?: HospitalizationPrescription[]
}

export interface AdmitPetPayload {
  petId: string
  reasonForAdmission: string
  kennelNumber: string

  origin?: HospitalizationOrigin
  attendingVetName?: string
  weightAtAdmission?: number
  triageLevel?: 'low' | 'medium' | 'high' | 'critical'
  presumptiveDiagnosis?: string
  initialNotes?: string
  admittedAt?: string
  status?: HospitalizationStatus
  appointmentId?: string
}

export interface AddLogPayload {
  petId: string
  type?: HospitalizationLogType
  eventAt?: string
  vitals?: HospitalizationVitals
  clinical?: HospitalizationClinicalChecks
  notes?: string
  conduct?: string
  statusAfter?: HospitalizationStatus
}

export interface DischargePayload {
  dischargeType: DischargeType
  finalDiagnosis?: string
  dischargeSummary: string
  dischargeCondition?: 'stable' | 'improved' | 'critical' | 'deceased'
  dischargeInstructions?: string
  dischargeMedications?: string
  returnRecommendation?: string
  administrativeNotes?: string
  dischargeAt?: string
}

export interface CreatePrescriptionPayload {
  petId: string
  type: HospitalizationPrescriptionType
  title: string
  instructions?: string
  frequency: HospitalizationPrescriptionFrequency
  customFrequencyHours?: number
  startAt: string
  endAt?: string | null
  quantity?: string
  route?: string
  createdByName?: string
}

export interface ExecuteCareTaskPayload {
  taskId: string
  executedByName?: string
  notes?: string
}
