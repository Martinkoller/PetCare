/* Defines the core data types for the application */

export type Role = 'saas_admin' | 'admin' | 'veterinarian' | 'groomer' | 'attendant'

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: Role
  avatar?: string
  organizationId?: string
}

export interface Profile {
  id: string
  name: string
  email: string
  phone?: string
  role: Role
  avatar?: string
  organizationId?: string
  color?: string // For UI styling
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  address: string
  joinedAt: string
  whatsappEnabled?: boolean
  cpf?: string
  birthDate?: string
  gender?: string
  city?: string
  state?: string
  neighborhood?: string
  street?: string
  number?: string
  complement?: string
  zipCode?: string
  notes?: string
  acceptsCampaigns?: boolean
  blockCredit?: boolean
  origin?: string
}

export interface ClientInteraction {
  id: string
  clientId: string
  type: 'whatsapp' | 'call' | 'email' | 'in_person' | 'system'
  origin: 'manual' | 'auto'
  subject: string
  body?: string
  status: 'done' | 'pending' | 'resolved'
  petName?: string
  relatedTo?: string
  responsible?: string
  createdAt: string
  updatedAt: string
}

export type ServiceCatalogItemType = 'main' | 'additional' | 'checklist' | 'instruction'

export interface ServiceCatalogItem {
  id: string
  name: string
  category:
    | 'grooming'
    | 'consultation'
    | 'boarding'
    | 'exam'
    | 'vaccine'
    | 'other'
  price: number
  duration?: number // minutes
  active: boolean
  description?: string
  observations?: string
  alerts?: string
  parentId?: string // Links sub-service (checklist item) to a parent service
  itemType?: ServiceCatalogItemType
  mandatory?: boolean
}

export interface PrescriptionItem {
  id: string
  medication: string
  concentration: string
  dosage: string
  frequency: string
  duration: string
}

export interface ExamRequest {
  id: string
  name: string
  type: 'laboratory' | 'imaging' | 'other'
  status: 'requested' | 'completed'
  results?: string
  result?: string // Resultado registrado pelo vet
  dateRequested: string
}

export interface VaccineRecord {
  id: string
  name: string
  batch: string
  dateAdministered: string
  nextDoseDate?: string
  veterinarianId: string
}

export interface MedicalVitals {
  weight: number // kg
  temperature: number // Celsius
  heartRate: number // bpm
  respiratoryRate?: number // bpm
  mucousMembranes?: string
  capillaryRefillTime?: string
}

export interface MaterialUsed {
  productId: string
  name: string
  quantity: number
  unit: string
  batchId?: string
}

export interface MedicalRecord {
  id: string
  date: string
  veterinarianId: string
  complaint?: string // Main complaint
  history?: string // Anamnesis
  subjective?: string
  objective?: string
  vitals?: MedicalVitals
  assessment?: string // Diagnosis
  plan?: string // Treatment plan
  prescriptions?: PrescriptionItem[]
  exams?: ExamRequest[]
  vaccines?: VaccineRecord[]
  materialsUsed?: MaterialUsed[] // Inventory items used
  returnDate?: string
  prescription?: string // Legacy
}

export type DocumentCategory =
  | 'vaccine_card'
  | 'exam_result'
  | 'imaging'
  | 'other'

export interface PetDocument {
  id: string
  name: string
  category: DocumentCategory
  url: string
  dateUploaded: string
  notes?: string
  type: 'image' | 'pdf' | 'other'
}

export interface Pet {
  id: string
  clientId: string
  name: string
  species: 'dog' | 'cat' | 'bird' | 'other'
  breed: string
  age: number
  weight: number
  gender: 'male' | 'female'
  size?: 'small' | 'medium' | 'large'
  birthDate?: string
  color?: string
  microchip?: string
  avatar?: string
  notes?: string
  isCastrated?: boolean
  clinicalAlert?: string
  medicalHistory?: MedicalRecord[]
  vaccinations?: VaccineRecord[]
  documents?: PetDocument[]
}

export type ServiceType = 'consultation' | 'grooming' | 'boarding' | 'hospitalization' | 'vaccination'

export type GroomingStatus = string
export type ClinicalStatus = 'waiting' | 'triage' | 'consultation' | 'completed'

export interface GroomingStage {
  id: string
  title: string
  color: string
  isFinal?: boolean
  isInitial?: boolean
  isDelivery?: boolean
}

export type ServiceItemType = 'main' | 'additional' | 'checklist' | 'instruction'

export interface ServiceItem {
  id: string
  description: string
  price: number
  duration?: number // minutes
  catalogItemId?: string
  itemType?: ServiceItemType
  checked?: boolean
  mandatory?: boolean
  additionalPrice?: number
}

export interface Appointment {
  id: string
  petId: string
  serviceType: ServiceType
  date: string // ISO String
  duration: number // Duration in minutes
  status: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'checked_out' | 'completed' | 'cancelled' | 'no_show'
  groomingStatus?: GroomingStatus // Only for grooming
  clinicalStatus?: ClinicalStatus // Only for consultation
  notes?: string
  price: number
  serviceItems?: ServiceItem[] // Detailed breakdown for grooming
  source?: 'online' | 'internal'
  professionalId?: string
  returnDate?: string
  startedAt?: string
  completedAt?: string
  currentStageStartedAt?: string
  priority?: 'normal' | 'urgent' | 'preferential'
  appointmentType?: 'scheduled' | 'walkin'
  clinicalMode?: 'routine' | 'return' | 'urgency'
  anamnesis?: string
  tutorNotified?: boolean
  tutorNotifiedAt?: string
  tutorNotifiedMessage?: string
  groomingPreferences?: string[]
  priceAdjustment?: number
  priceAdjustmentReason?: string
  checkinArrivalTime?: string
  checkinMatting?: 'none' | 'mild' | 'moderate' | 'severe'
  checkinFleas?: boolean
  checkinBehavior?: 'calm' | 'agitated' | 'aggressive'
  checkinExtraAuthorized?: boolean
  checkinNotes?: string
  stageHistory?: Array<{ stageId: string; startedAt: string }>
  hospitalizationStay?: HospitalizationStay
  boardingStay?: BoardingStay
  boardingMode?: 'daily' | 'half_day' | 'overnight' | 'day_care'
  criticismLevel?: 'low' | 'moderate' | 'high' | 'icu'
}

export interface Kennel {
  id: string
  name: string
  size: 'small' | 'medium' | 'large'
  status: 'available' | 'maintenance'
}

export interface BoardingServiceItem {
  id: string
  boardingId: string
  serviceId?: string
  productId?: string
  batchId?: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  createdAt: string
}

export interface BoardingStay {
  id: string
  petId: string
  checkIn: string // ISO String (Planned)
  checkOut: string // ISO String (Planned)
  actualCheckIn?: string // ISO String
  actualCheckOut?: string // ISO String
  kennelNumber: string
  status: 'active' | 'completed' | 'reserved' | 'cancelled'
  notes?: string
  dailyRate: number
  serviceId?: string // Link to the main boarding service catalog item
  belongings?: string
  specialInstructions?: string
  observations?: string // Final observations
  totalPrice?: number
  signature?: string // Base64 signature image
  services?: BoardingServiceItem[] // Extra services added during stay
}

export interface HospitalizationLog {
  id: string
  hospitalizationId: string
  type: 'note' | 'medication' | 'vitals'
  heartRate?: number
  temperature?: number
  medicationGiven?: string
  doctorNotes?: string
  vitals?: string // Fallback para compatibilidade se necessário
  createdAt: string
}

export interface HospitalizationStay {
  id: string
  petId: string
  veterinarianId?: string
  reasonForAdmission?: string
  status: 'admitted' | 'treatment' | 'discharged' | 'deceased'
  expectedDischargeDate?: string
  checkIn: string
  checkOut?: string
  kennelNumber: string
  pet?: Pet
  appointmentId?: string
  appointment?: Appointment
  logs?: HospitalizationLog[]
}

// Notification Types
export type NotificationType =
  | 'pet_birthday'
  | 'tutor_birthday'
  | 'appointment_request'
  | 'appointment_confirmation'
  | 'appointment_reminder'
  | 'appointment_reschedule'
  | 'package_session_reminder'
  | 'package_renewal_reminder'
  | 'session_finalized'
  | 'session_cancelled'
  | 'absent_pets'
  | 'grooming_finished'
  | 'boarding_checkin'
  | 'boarding_checkout'
  | 'manual_message'

export type TemplateModule = 'agendamento' | 'consulta' | 'banho_tosa' | 'hospedagem' | 'geral'
export type TemplateTrigger = 'solicitacao' | 'confirmacao' | 'confirmacao_pendente' | 'cancelamento' | 'checkin' | 'checkout' | 'pronto' | 'finalizacao' | 'entrega' | 'lembrete' | 'cobranca' | 'personalizado'

export interface MessageTemplate {
  id: string
  type: string
  module: TemplateModule
  trigger: TemplateTrigger
  title: string
  content: string
  active: boolean
  sendMode: 'auto' | 'manual'
  sendDelay: number  // minutos após o status; 0 = imediato
  minutesBefore?: number // minutos antes do agendamento (para trigger lembrete)
}

export interface NotificationLog {
  id: string
  clientId: string
  clientName: string
  petName?: string
  type: string
  message: string
  sentAt: string
  status: 'sent' | 'failed'
  manual: boolean
}

export interface NotificationSettings {
  enabled: boolean
  templates: MessageTemplate[]
}


// Inventory & Sales Types
export type ProductCategory =
  | 'food'
  | 'accessories'
  | 'medicines'
  | 'grooming'
  | 'vaccine'
  | 'surgical'
  | 'other'

export interface ProductBatch {
  id: string
  code: string
  quantity: number
  expirationDate: string // ISO YYYY-MM-DD
}

export interface Product {
  id: string
  name: string
  category: ProductCategory
  sku: string
  price: number
  stock: number // Total stock (sum of batches if applicable)
  minStock: number // Acts as low_stock_threshold
  description?: string
  unit?: string // e.g. un, ml, mg, kg
  expirationDate?: string // ISO YYYY-MM-DD (Legacy/Default)
  batches?: ProductBatch[]
}

export interface StockTransaction {
  id: string
  productId: string
  productName: string
  quantity: number
  type: 'in' | 'out'
  reason: string
  date: string
  userId?: string
  referenceId?: string
  batchId?: string
}

export interface SaleItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  total: number
  batchId?: string
}

export interface Sale {
  id: string
  date: string
  clientId?: string // Optional for walk-in/anonymous sales
  petId?: string
  items: SaleItem[]
  total: number
  status: 'completed' | 'cancelled'
}

// Internal Tasks Types
export interface Task {
  id: string
  title: string
  description?: string
  category: 'cleaning' | 'maintenance' | 'administrative' | 'other'
  assignee: string
  dueDate: string // ISO String YYYY-MM-DD
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  notifiedOverdue?: boolean
  createdAt: string
}

// User Preferences for Alerts
export interface UserPreferences {
  dashboardAlerts: {
    lowStock: boolean
    onlineAppointments: boolean
    birthdays: boolean
  }
}

// Organization Settings
export interface CustomStatus {
  id: string
  label: string
  value: string
  color: string
}

export type WeekDay = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'

export interface DaySchedule {
  open: boolean
  start: string    // "HH:mm" — início período 1
  end: string      // "HH:mm" — fim período 1
  breakStart?: string  // "HH:mm" — início intervalo
  breakEnd?: string    // "HH:mm" — fim intervalo (início período 2)
  end2?: string        // "HH:mm" — fim período 2 (se houver intervalo)
}

export type BusinessHours = Record<WeekDay, DaySchedule>

export interface OrganizationSettings {
  groomingStages: GroomingStage[]
  customStatuses: CustomStatus[]
  businessHours?: BusinessHours
  requireChecklistOnFinish?: boolean
}

// Appointment Templates
export interface TemplateItem {
  type: 'service' | 'product'
  id: string
  quantity: number
}

export interface AppointmentTemplate {
  id: string
  name: string
  description: string
  services: TemplateItem[]
  defaultDurationDays: number
}

// User Integrations
export interface UserIntegration {
  id: string
  userId: string
  provider: 'google' | 'outlook'
  calendarEmail?: string
  createdAt: string
}

export type WhatsAppConnectionStatus =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'QRCODE'
  | 'CONNECTED'
  | 'ERROR'

export interface WhatsAppConnection {
  enabled: boolean
  phone: string
  apiUrl: string
  apiKey: string
  instance: string

  status?: WhatsAppConnectionStatus
  qrCode?: string
  pairedNumber?: string
  pairedName?: string
  lastConnectionAt?: string
  errorMessage?: string
}