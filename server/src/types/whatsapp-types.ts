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

export interface SendWhatsAppPayload {
  clientId: string
  clientName: string
  petName?: string
  type: string
  message: string
  phone?: string
  manual?: boolean
}

export type TemplateModule =
  | 'agendamento'
  | 'banho_tosa'
  | 'hospedagem'
  | 'consulta'
  | 'geral'

export type TemplateTrigger =
  | 'solicitacao'
  | 'confirmacao'
  | 'confirmacao_pendente'
  | 'cancelamento'
  | 'checkin'
  | 'checkout'
  | 'pronto'
  | 'finalizacao'
  | 'lembrete'
  | 'cobranca'
  | 'entrega'
  | 'personalizado'

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