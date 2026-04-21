import { Request, Response } from 'express'
import { evolutionService } from '@/services/evolution.service'
import { whatsappConfigService } from '@/services/whatsapp-config.service'
import { whatsappLogService } from '@/services/whatsapp-log.service'
import { whatsappTemplatesService } from '@/services/whatsapp-templates.service'
import { NotificationLog, SendWhatsAppPayload } from '@/types/whatsapp-types'

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export const whatsappController = {
  getConnection(req: Request, res: Response) {
    const config = whatsappConfigService.getConfig()
    return res.json(config)
  },

  updateConnection(req: Request, res: Response) {
    const {
      enabled,
      phone,
      apiUrl,
      apiKey,
      instance,
    } = req.body

    const updated = whatsappConfigService.saveConfig({
      enabled,
      phone,
      apiUrl,
      apiKey,
      instance,
    })

    return res.json(updated)
  },

  async startSession(req: Request, res: Response) {
    try {
      const { apiUrl, apiKey, instance } = req.body

      const current = whatsappConfigService.getConfig()

      const merged = whatsappConfigService.saveConfig({
        ...current,
        apiUrl: apiUrl ?? current.apiUrl,
        apiKey: apiKey ?? current.apiKey,
        instance: instance ?? current.instance,
        status: 'CONNECTING',
        errorMessage: '',
      })

      const result = await evolutionService.createOrConnectInstance(merged)

      return res.json(result)
    } catch (error: any) {
      return res.status(500).json({
        message: error?.message || 'Erro ao iniciar sessão do WhatsApp',
      })
    }
  },

  async getSessionStatus(req: Request, res: Response) {
    try {
      const { instance } = req.query
      const current = whatsappConfigService.getConfig()

      const config = whatsappConfigService.saveConfig({
        instance: String(instance || current.instance),
      })

      const result = await evolutionService.getInstanceStatus(config)

      return res.json({
        status: result.status,
        qrCode: result.qrCode,
        pairedNumber: result.pairedNumber,
        pairedName: result.pairedName,
        errorMessage: result.errorMessage,
        lastConnectionAt: result.lastConnectionAt,
      })
    } catch (error: any) {
      return res.status(500).json({
        message: error?.message || 'Erro ao consultar status da sessão',
      })
    }
  },

  async disconnectSession(req: Request, res: Response) {
    try {
      const current = whatsappConfigService.getConfig()
      const result = await evolutionService.disconnectInstance(current)

      return res.json(result)
    } catch (error: any) {
      return res.status(500).json({
        message: error?.message || 'Erro ao desconectar sessão',
      })
    }
  },

  async send(req: Request, res: Response) {
    const payload = req.body as SendWhatsAppPayload

    const logBase: NotificationLog = {
      id: makeId(),
      clientId: payload.clientId,
      clientName: payload.clientName,
      petName: payload.petName,
      type: payload.type,
      message: payload.message,
      sentAt: new Date().toISOString(),
      status: 'failed',
      manual: Boolean(payload.manual),
    }

    try {
      await evolutionService.sendMessage(payload)

      const successLog: NotificationLog = {
        ...logBase,
        status: 'sent',
      }

      whatsappLogService.addLog(successLog)

      return res.json(successLog)
    } catch (error: any) {
      const failLog: NotificationLog = {
        ...logBase,
        status: 'failed',
      }

      whatsappLogService.addLog(failLog)

      return res.status(500).json({
        ...failLog,
        message: error?.message || 'Erro ao enviar mensagem',
      })
    }
  },

  getLogs(req: Request, res: Response) {
    const { clientId } = req.query
    let logs = whatsappLogService.getLogs()
    
    if (clientId) {
      logs = logs.filter(l => l.clientId === clientId)
    }
    
    return res.json(logs)
  },

  getTemplates(_req: Request, res: Response) {
    const templates = whatsappTemplatesService.getTemplates()
    return res.json(templates)
  },

  createTemplate(req: Request, res: Response) {
    const created = whatsappTemplatesService.createTemplate(req.body)
    return res.status(201).json(created)
  },

  updateTemplate(req: Request, res: Response) {
    const id = String(req.params.id)
    const updated = whatsappTemplatesService.updateTemplate(id, req.body)
    if (!updated) return res.status(404).json({ message: 'Template não encontrado' })
    return res.json(updated)
  },

  deleteTemplate(req: Request, res: Response) {
    const id = String(req.params.id)
    const deleted = whatsappTemplatesService.deleteTemplate(id)
    if (!deleted) return res.status(404).json({ message: 'Template não encontrado' })
    return res.json({ message: 'Template excluído' })
  },
}