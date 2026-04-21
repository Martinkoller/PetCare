import api from '@/lib/api'
import {
  MessageTemplate,
  NotificationLog,
  WhatsAppConnection,
} from '@/lib/types'

type SendPayload = {
  clientId: string
  clientName: string
  petName?: string
  type: string
  message: string
  phone?: string
  manual?: boolean
}

type StartSessionPayload = {
  apiUrl: string
  apiKey: string
  instance: string
}

type SessionStatusResponse = {
  status: 'DISCONNECTED' | 'CONNECTING' | 'QRCODE' | 'CONNECTED' | 'ERROR'
  qrCode?: string
  pairedNumber?: string
  pairedName?: string
  errorMessage?: string
  lastConnectionAt?: string
}

export const whatsappService = {
  async getTemplates(): Promise<MessageTemplate[]> {
    const { data } = await api.get('/whatsapp/templates')
    return data || []
  },

  async createTemplate(template: Omit<MessageTemplate, 'id'>): Promise<MessageTemplate> {
    const { data } = await api.post('/whatsapp/templates', template)
    return data
  },

  async updateTemplate(template: MessageTemplate): Promise<MessageTemplate> {
    const { data } = await api.put(`/whatsapp/templates/${template.id}`, template)
    return data
  },

  async deleteTemplate(id: string): Promise<void> {
    await api.delete(`/whatsapp/templates/${id}`)
  },

  async getConnection(): Promise<WhatsAppConnection | null> {
    const { data } = await api.get('/whatsapp/connection')
    return data || null
  },

  async updateConnection(conn: WhatsAppConnection): Promise<WhatsAppConnection> {
    const { data } = await api.put('/whatsapp/connection', conn)
    return data
  },

  async startSession(payload: StartSessionPayload): Promise<WhatsAppConnection> {
    const { data } = await api.post('/whatsapp/session/start', payload)
    return data
  },

  async getConnectionStatus(instance?: string): Promise<SessionStatusResponse> {
    const { data } = await api.get('/whatsapp/session/status', {
      params: { instance },
    })
    return data
  },

  async refreshQrCode(instance?: string): Promise<SessionStatusResponse> {
    const { data } = await api.get('/whatsapp/session/status', {
      params: { instance },
    })
    return data
  },

  async disconnectSession(instance?: string): Promise<WhatsAppConnection> {
    const { data } = await api.post('/whatsapp/session/disconnect', { instance })
    return data
  },

  async send(payload: SendPayload): Promise<NotificationLog> {
    const { data } = await api.post('/whatsapp/send', payload)
    return data
  },

  async getLogs(clientId?: string): Promise<NotificationLog[]> {
    const { data } = await api.get('/whatsapp/logs', {
      params: { clientId },
    })
    return data || []
  },

  interpolate(template: string, vars: Record<string, string>) {
    let content = template || ''

    Object.entries(vars).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      content = content.replace(regex, value ?? '')
    })

    return content
  },
}