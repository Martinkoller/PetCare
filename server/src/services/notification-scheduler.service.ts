import { prisma } from '../index'
import { whatsappTemplatesService } from './whatsapp-templates.service'
import { evolutionService } from './evolution.service'
import { whatsappLogService } from './whatsapp-log.service'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const notificationSchedulerService = {
  async run() {
    console.log('[NotificationScheduler] Running cycle...')
    try {
      await this.processLembretes()
      await this.processConfirmacoesPendentes()
      await this.processFollowUps()
      await this.processTaskAlerts()
      await this.processBoardingCheckoutReminders()
    } catch (error) {
      console.error('[NotificationScheduler] Critical error in cycle:', error)
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // LEMBRETE — envio simples, sem aguardar resposta
  // ─────────────────────────────────────────────────────────────────────────────

  async processLembretes() {
    const allTemplates = whatsappTemplatesService.getTemplates().filter(
      (t) => t.active && t.trigger === 'lembrete' && (t.minutesBefore ?? 0) > 0,
    )
    if (allTemplates.length === 0) return

    const now = new Date()

    const appointments = await prisma.appointment.findMany({
      where: {
        status: { in: ['scheduled', 'confirmed'] },
        reminderSentAt: null,
        date: {
          gte: now,
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: { pet: { include: { client: true } } },
    })

    for (const apt of appointments) {
      const module = this.mapServiceTypeToModule(apt.serviceType)

      // Escolhe o template mais específico (módulo exato > agendamento genérico)
      const template = allTemplates
        .filter((t) => t.module === module || t.module === 'agendamento')
        .sort((a, b) => {
          if (a.module === module && b.module !== module) return -1
          if (a.module !== module && b.module === module) return 1
          return 0
        })
        .find((t) => {
          const minutesBefore = t.minutesBefore ?? 1440
          const targetTime = new Date(now.getTime() + minutesBefore * 60 * 1000)
          return apt.date <= targetTime
        })

      if (!template) continue

      await this.sendLembrete(apt, template)
    }
  },

  async sendLembrete(apt: any, template: any) {
    const client = apt.pet?.client
    if (!client?.phone) return

    try {
      const vars = this.buildVars(apt, client)
      const message = this.interpolate(template.content, vars)

      console.log(`[NotificationScheduler] [LEMBRETE] → ${client.name} (${template.title})`)

      await evolutionService.sendMessage({
        clientId: client.id,
        clientName: client.name,
        petName: apt.pet.name,
        type: template.type,
        message,
        phone: client.phone,
        manual: false,
      })

      await prisma.appointment.update({
        where: { id: apt.id },
        data: { reminderSentAt: new Date() },
      })

      whatsappLogService.addLog({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        clientId: client.id,
        clientName: client.name,
        petName: apt.pet.name,
        type: template.type,
        message,
        sentAt: new Date().toISOString(),
        status: 'sent',
        manual: false,
      })
    } catch (err: any) {
      const isOffline = err?.code === 'ECONNREFUSED' || err?.message?.includes('não está conectado')
      if (isOffline) {
        console.warn(`[NotificationScheduler] [LEMBRETE] WhatsApp offline — apt ${apt.id} será reprocessado no próximo ciclo`)
      } else {
        console.error(`[NotificationScheduler] [LEMBRETE] Erro para apt ${apt.id}:`, err.message ?? err)
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // PEDIDO DE CONFIRMAÇÃO — interativo, aguarda resposta 1/2/3
  // ─────────────────────────────────────────────────────────────────────────────

  async processConfirmacoesPendentes() {
    const allTemplates = whatsappTemplatesService.getTemplates().filter(
      (t) => t.active && t.trigger === 'confirmacao_pendente' && (t.minutesBefore ?? 0) > 0,
    )
    if (allTemplates.length === 0) return

    const now = new Date()

    // Só envia confirmação para agendamentos que:
    // - Ainda não receberam pedido de confirmação (confirmationRequestSentAt: null)
    // - Não estão aguardando resposta (evita reenvio)
    const appointments = await prisma.appointment.findMany({
      where: {
        status: { in: ['scheduled', 'confirmed'] },
        confirmationRequestSentAt: null,
        awaitingWhatsappReply: false,
        date: {
          gte: now,
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: { pet: { include: { client: true } } },
    })

    for (const apt of appointments) {
      const module = this.mapServiceTypeToModule(apt.serviceType)

      const template = allTemplates
        .filter((t) => t.module === module || t.module === 'agendamento')
        .sort((a, b) => {
          if (a.module === module && b.module !== module) return -1
          if (a.module !== module && b.module === module) return 1
          return 0
        })
        .find((t) => {
          const minutesBefore = t.minutesBefore ?? 1440
          const targetTime = new Date(now.getTime() + minutesBefore * 60 * 1000)
          return apt.date <= targetTime
        })

      if (!template) continue

      await this.sendConfirmacaoPendente(apt, template)
    }
  },

  async sendConfirmacaoPendente(apt: any, template: any) {
    const client = apt.pet?.client
    if (!client?.phone) return

    try {
      const vars = this.buildVars(apt, client)
      const message = this.interpolate(template.content, vars)

      console.log(`[NotificationScheduler] [CONFIRMAÇÃO] → ${client.name} (${template.title})`)

      const result = (await evolutionService.sendMessage({
        clientId: client.id,
        clientName: client.name,
        petName: apt.pet.name,
        type: template.type,
        message,
        phone: client.phone,
        manual: false,
      })) as any

      const messageId = result?.key?.id || result?.messageId || null

      await prisma.appointment.update({
        where: { id: apt.id },
        data: {
          confirmationRequestSentAt: new Date(),
          awaitingWhatsappReply: true,
          whatsappConfirmationStatus: 'pending',
          whatsappConfirmationSentAt: new Date(),
          whatsappLastMessageId: messageId,
          whatsappConfirmationReplyAt: null,
          whatsappReplyText: null,
          confirmedVia: null,
        },
      })

      whatsappLogService.addLog({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        clientId: client.id,
        clientName: client.name,
        petName: apt.pet.name,
        type: template.type,
        message,
        sentAt: new Date().toISOString(),
        status: 'sent',
        manual: false,
      })
    } catch (err: any) {
      const isOffline = err?.code === 'ECONNREFUSED' || err?.message?.includes('não está conectado')
      if (isOffline) {
        console.warn(`[NotificationScheduler] [CONFIRMAÇÃO] WhatsApp offline — apt ${apt.id} será reprocessado no próximo ciclo`)
      } else {
        console.error(`[NotificationScheduler] [CONFIRMAÇÃO] Erro para apt ${apt.id}:`, err.message ?? err)
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // FOLLOW-UPS — mensagens após mudança de status (ex: 1 min após checkout)
  // ─────────────────────────────────────────────────────────────────────────────

  async processFollowUps() {
    const allTemplates = whatsappTemplatesService.getTemplates()
    const followUpTemplates = allTemplates.filter(
      (t) =>
        t.active &&
        t.trigger !== 'lembrete' &&
        t.trigger !== 'confirmacao_pendente' &&
        t.sendMode === 'auto' &&
        (t.sendDelay ?? 0) > 0,
    )

    if (followUpTemplates.length === 0) return

    for (const template of followUpTemplates) {
      const delayMin = template.sendDelay || 0
      const now = new Date()
      const delayAgo = new Date(now.getTime() - delayMin * 60 * 1000)

      const targetStatus = this.mapTriggerToStatus(template.trigger)
      if (!targetStatus) continue

      const serviceType = this.mapModuleToServiceType(template.module)

      const whereClause: any = {
        status: targetStatus,
        followUpSentAt: null,
        updatedAt: { lte: delayAgo },
      }

      // Só filtra por serviceType se o módulo for específico (não 'agendamento' genérico)
      if (template.module !== 'agendamento' && serviceType) {
        whereClause.serviceType = serviceType
      }

      const appointments = await prisma.appointment.findMany({
        where: whereClause,
        include: { pet: { include: { client: true } } },
      })

      for (const apt of appointments) {
        // Verificação extra de estágio de grooming, se aplicável
        if (template.module === 'banho_tosa') {
          const { meta } = this.extractWorkflowMeta(apt.notes)
          const targetStage = this.mapTriggerToGroomingStage(template.trigger)
          if (targetStage && meta.groomingStatus !== targetStage) continue
        }

        await this.sendFollowUp(apt, template)
      }
    }
  },

  async sendFollowUp(apt: any, template: any) {
    const client = apt.pet?.client
    if (!client?.phone) return

    try {
      const vars = this.buildVars(apt, client)
      const message = this.interpolate(template.content, vars)

      console.log(`[NotificationScheduler] [FOLLOW-UP] → ${client.name} (${template.title})`)

      await evolutionService.sendMessage({
        clientId: client.id,
        clientName: client.name,
        petName: apt.pet.name,
        type: template.type,
        message,
        phone: client.phone,
        manual: false,
      })

      await prisma.appointment.update({
        where: { id: apt.id },
        data: { followUpSentAt: new Date() },
      })

      whatsappLogService.addLog({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        clientId: client.id,
        clientName: client.name,
        petName: apt.pet.name,
        type: template.type,
        message,
        sentAt: new Date().toISOString(),
        status: 'sent',
        manual: false,
      })
    } catch (err: any) {
      const isOffline = err?.code === 'ECONNREFUSED' || err?.message?.includes('não está conectado')
      if (isOffline) {
        console.warn(`[NotificationScheduler] [FOLLOW-UP] WhatsApp offline — apt ${apt.id} será reprocessado no próximo ciclo`)
      } else {
        console.error(`[NotificationScheduler] [FOLLOW-UP] Erro para apt ${apt.id}:`, err.message ?? err)
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // AVISOS DE TAREFAS — alertas automáticos de horário exato
  // ─────────────────────────────────────────────────────────────────────────────

  async processTaskAlerts() {
    try {
      const now = new Date()
      const overdueTasks = await prisma.task.findMany({
        where: {
          dueDate: { lte: now },
          status: { not: 'completed' },
          notifiedOverdue: false,
        },
      })

      if (overdueTasks.length === 0) return

      for (const t of overdueTasks) {
        let user = await prisma.user.findFirst({
           where: { name: t.assignee }
        })
        if (!user || !user.phone) continue

        const formattedDate = format(t.dueDate, 'dd/MM/yyyy', { locale: ptBR })
        const formattedTime = format(t.dueDate, 'HH:mm')
        
        let msg = `⏰ *Alerta de Tarefa Pendente*\n\n`
        msg += `Olá ${user.name},\n`
        msg += `Passando para lembrar da tarefa: *${t.title}*\n`
        if (t.description) msg += `Detalhes: ${t.description}\n`
        msg += `Hora programada: *${formattedTime}* de ${formattedDate}\n`
        msg += `Status atual: *${t.status}*\n\n`
        msg += `Por favor, acesse o sistema para conferir!`

        console.log(`[NotificationScheduler] [TASK ALERT] → ${user.name} (${t.title})`)

        await evolutionService.sendMessage({
          clientId: user.id, // we send internal UUID just to please sendMessage params
          clientName: user.name ?? 'Funcionario',
          type: 'internal_task',
          message: msg,
          phone: user.phone,
          manual: false,
        })

        await prisma.task.update({
          where: { id: t.id },
          data: { notifiedOverdue: true },
        })
      }
    } catch (err: any) {
      console.error(`[NotificationScheduler] [TASK ALERT] Erro:`, err.message ?? err)
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  buildVars(apt: any, client: any): Record<string, string> {
    return {
      client_name: client.name ?? '',
      pet_name: apt.pet?.name ?? '',
      date: format(new Date(apt.date), 'dd/MM/yyyy', { locale: ptBR }),
      time: format(new Date(apt.date), 'HH:mm'),
      service_type: this.translateServiceType(apt.serviceType),
    }
  },

  mapModuleToServiceType(module: string): string | null {
    switch (module) {
      case 'consulta':    return 'veterinary'
      case 'banho_tosa':  return 'grooming'
      case 'hospedagem':  return 'boarding'
      case 'agendamento': return null  // genérico — não filtra por serviceType
      default:            return null
    }
  },

  mapServiceTypeToModule(type: string): string {
    switch (type) {
      case 'veterinary': return 'consulta'
      case 'grooming':   return 'banho_tosa'
      case 'boarding':   return 'hospedagem'
      default:           return 'agendamento'
    }
  },

  translateServiceType(type: string): string {
    switch (type) {
      case 'veterinary': return 'Consulta'
      case 'grooming':   return 'Banho e Tosa'
      case 'boarding':   return 'Hospedagem'
      default:           return 'Serviço'
    }
  },

  mapTriggerToStatus(trigger: string): string | null {
    switch (trigger) {
      case 'confirmacao': return 'confirmed'
      case 'checkin':     return 'in_progress'
      case 'checkout':    return 'completed'
      case 'finalizacao': return 'completed'
      case 'entrega':     return 'completed'
      case 'pronto':      return 'in_progress'
      default:            return null
    }
  },

  mapTriggerToGroomingStage(trigger: string): string | null {
    switch (trigger) {
      case 'checkin': return 'banho_tosa_checkin'
      default:        return null
    }
  },

  interpolate(template: string, vars: Record<string, string>) {
    let content = template || ''
    Object.entries(vars).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      content = content.replace(regex, value ?? '')
    })
    return content
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // LEMBRETE DE CHECKOUT — 1 dia antes da saída prevista
  // ─────────────────────────────────────────────────────────────────────────────

  async processBoardingCheckoutReminders() {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const dayAfter  = new Date(now.getTime() + 48 * 60 * 60 * 1000)

    try {
      const stays = await prisma.boardingStay.findMany({
        where: {
          status: 'active',
          checkOut: { gte: tomorrow, lte: dayAfter },
        },
      })

      for (const stay of stays) {
        // Evitar reenvio via appointment.reminderSentAt
        if (stay.appointmentId) {
          const apt = await prisma.appointment.findUnique({ where: { id: stay.appointmentId } })
          if (apt?.reminderSentAt) continue
        }

        const pet = await prisma.pet.findUnique({
          where: { id: stay.petId },
          include: { client: true },
        })
        const client = (pet as any)?.client
        if (!client?.phone) continue

        const checkOutFormatted = format(new Date(stay.checkOut), 'dd/MM/yyyy', { locale: ptBR })
        const msg =
          `🐾 *Lembrete de Check-out — ${pet?.name}*\n\n` +
          `Olá ${client.name}! Passando para lembrar que a hospedagem de ` +
          `*${pet?.name}* termina amanhã, *${checkOutFormatted}*.\n\n` +
          `Venha buscá-lo(a) no horário combinado. Qualquer dúvida, estamos à disposição! 🏡`

        console.log(`[NotificationScheduler] [CHECKOUT REMINDER] → ${client.name} (${pet?.name})`)

        try {
          await evolutionService.sendMessage({
            clientId: client.id,
            clientName: client.name,
            petName: pet?.name,
            type: 'hospedagem_lembrete_checkout',
            message: msg,
            phone: client.phone,
            manual: false,
          })

          if (stay.appointmentId) {
            await prisma.appointment.update({
              where: { id: stay.appointmentId },
              data: { reminderSentAt: new Date() },
            })
          }

          whatsappLogService.addLog({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            clientId: client.id,
            clientName: client.name,
            petName: pet?.name,
            type: 'hospedagem_lembrete_checkout',
            message: msg,
            sentAt: new Date().toISOString(),
            status: 'sent',
            manual: false,
          })
        } catch (err: any) {
          const isOffline = err?.code === 'ECONNREFUSED' || err?.message?.includes('não está conectado')
          if (!isOffline) {
            console.error(`[NotificationScheduler] [CHECKOUT REMINDER] Erro para stay ${stay.id}:`, err.message ?? err)
          }
        }
      }
    } catch (err: any) {
      console.error('[NotificationScheduler] [CHECKOUT REMINDER] Erro geral:', err.message ?? err)
    }
  },

  extractWorkflowMeta(notes?: string | null) {
    if (!notes || !notes.startsWith('[WF]')) return { meta: {} }
    const firstLineBreak = notes.indexOf('\n')
    const firstLine = firstLineBreak >= 0 ? notes.slice(0, firstLineBreak) : notes
    try {
      const meta = JSON.parse(firstLine.replace('[WF]', ''))
      return { meta }
    } catch {
      return { meta: {} }
    }
  },
}
