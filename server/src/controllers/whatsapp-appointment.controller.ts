import { Request, Response } from 'express'
import { prisma } from '../index'
import { evolutionService } from '@/services/evolution.service'
import { whatsappLogService } from '@/services/whatsapp-log.service'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizePhone(raw: string): string {
  let n = raw.replace(/\D/g, '')
  if (n.length === 10 || n.length === 11) n = `55${n}`
  return n
}

function buildConfirmationMessage(apt: any, pet: any, client: any): string {
  const dateStr = format(new Date(apt.date), "dd/MM/yyyy", { locale: ptBR })
  const timeStr = format(new Date(apt.date), "HH:mm")

  if (apt.serviceType === 'grooming') {
    return (
      `Olá ${client.name}! 🐾\n\n` +
      `Confirmamos o agendamento de *Banho e Tosa* para *${pet.name}*:\n` +
      `📅 Data: ${dateStr}\n` +
      `🕐 Horário: ${timeStr}\n\n` +
      `Por favor, responda:\n` +
      `*1* - Confirmar agendamento ✅\n` +
      `*2* - Solicitar reagendamento 🔄\n` +
      `*3* - Cancelar agendamento ❌`
    )
  }

  if (apt.serviceType === 'veterinary') {
    const professional = apt.professionalId ? `\n👨‍⚕️ Profissional: será informado` : ''
    return (
      `Olá ${client.name}! 🏥\n\n` +
      `Confirmamos a *Consulta Médica* para *${pet.name}*:\n` +
      `📅 Data: ${dateStr}\n` +
      `🕐 Horário: ${timeStr}` +
      `${professional}\n\n` +
      `Por favor, responda:\n` +
      `*1* - Confirmar agendamento ✅\n` +
      `*2* - Solicitar reagendamento 🔄\n` +
      `*3* - Cancelar agendamento ❌`
    )
  }

  if (apt.serviceType === 'boarding') {
    const checkIn = format(new Date(apt.date), "dd/MM/yyyy", { locale: ptBR })
    const checkOut = apt.returnDate
      ? format(new Date(apt.returnDate), "dd/MM/yyyy", { locale: ptBR })
      : 'a confirmar'
    return (
      `Olá ${client.name}! 🏡\n\n` +
      `Confirmamos a *Hospedagem* para *${pet.name}*:\n` +
      `📥 Check-in: ${checkIn}\n` +
      `📤 Check-out: ${checkOut}\n\n` +
      `Por favor, responda:\n` +
      `*1* - Confirmar agendamento ✅\n` +
      `*2* - Solicitar reagendamento 🔄\n` +
      `*3* - Cancelar agendamento ❌`
    )
  }

  return (
    `Olá ${client.name}! Seu agendamento para ${pet.name} está marcado para ${dateStr} às ${timeStr}.\n\n` +
    `Responda:\n*1* - Confirmar ✅\n*2* - Reagendar 🔄\n*3* - Cancelar ❌`
  )
}

// ── Send confirmation ─────────────────────────────────────────────────────────

export async function sendConfirmation(req: Request, res: Response) {
  const id = String(req.params.id)

  try {
    const apt = await prisma.appointment.findUnique({
      where: { id },
      include: { pet: { include: { client: true } } },
    })

    if (!apt) return res.status(404).json({ message: 'Agendamento não encontrado' })

    const { pet } = apt
    const client = pet.client

    if (!client.phone) {
      return res.status(422).json({ message: 'Cliente não possui telefone cadastrado' })
    }

    const message = buildConfirmationMessage(apt, pet, client)

    let messageId: string | undefined
    try {
      const result = await evolutionService.sendMessage({
        clientId: client.id,
        clientName: client.name,
        petName: pet.name,
        type: 'whatsapp_confirmation',
        message,
        phone: client.phone,
        manual: false,
      })
      messageId = result?.key?.id || result?.messageId || undefined
    } catch (err: any) {
      return res.status(502).json({ message: err?.message || 'Erro ao enviar mensagem WhatsApp' })
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        awaitingWhatsappReply: true,
        whatsappConfirmationStatus: 'pending',
        whatsappConfirmationSentAt: new Date(),
        whatsappConfirmationReplyAt: null,
        whatsappLastMessageId: messageId ?? null,
        whatsappReplyText: null,
        confirmedVia: null,
      },
    })

    whatsappLogService.addLog({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      clientId: client.id,
      clientName: client.name,
      petName: pet.name,
      type: 'whatsapp_confirmation',
      message,
      sentAt: new Date().toISOString(),
      status: 'sent',
      manual: false,
    })

    return res.json({ message: 'Confirmação enviada', appointment: updated })
  } catch (err: any) {
    console.error('[sendConfirmation]', err)
    return res.status(500).json({ message: err?.message || 'Erro interno' })
  }
}

// ── Webhook ───────────────────────────────────────────────────────────────────

function extractPhoneAndText(body: any): { phone: string | null; text: string | null } {
  try {
    // Evolution API can send data as an object or as an array (v1.x standard)
    const rawData = body?.data || body
    const data = Array.isArray(rawData) ? rawData[0] : rawData

    const remoteJid: string =
      data?.key?.remoteJid ||
      data?.remoteJid ||
      body?.sender ||
      ''

    const phone = remoteJid
      ? remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '').replace(/\D/g, '')
      : null

    const text: string =
      data?.message?.conversation ||
      data?.message?.extendedTextMessage?.text ||
      data?.body ||
      body?.message?.conversation ||
      body?.text ||
      ''

    return { phone: phone || null, text: text.trim() || null }
  } catch (err) {
    console.error('[webhook] Erro ao extrair phone/text:', err)
    return { phone: null, text: null }
  }
}

export async function webhook(req: Request, res: Response) {
  // Always ACK immediately so Evolution does not retry
  res.status(200).json({ ok: true })

  const { phone, text } = extractPhoneAndText(req.body)
  if (!phone || !text) return

  const normalizedPhone = normalizePhone(phone)
  const phoneSuffixes = [normalizedPhone, normalizedPhone.replace(/^55/, '')]

  try {
    const client = await prisma.client.findFirst({
      where: { phone: { in: phoneSuffixes } },
    })
    if (!client) return

    const apt = await prisma.appointment.findFirst({
      where: {
        awaitingWhatsappReply: true,
        status: { not: 'archived' },
        pet: { clientId: client.id },
      },
      orderBy: { whatsappConfirmationSentAt: 'desc' },
      include: { pet: { include: { client: true } } },
    })
    if (!apt) return

    const reply = text.trim()

    if (reply === '1') {
      await prisma.appointment.update({
        where: { id: apt.id },
        data: {
          status: 'confirmed',
          whatsappConfirmationStatus: 'confirmed',
          awaitingWhatsappReply: false,
          whatsappConfirmationReplyAt: new Date(),
          whatsappReplyText: reply,
          confirmedVia: 'whatsapp',
        },
      })

      const confirmMsg = `Ótimo, ${client.name}! 🎉 Seu agendamento para ${apt.pet.name} está confirmado. Te esperamos! 🐾`
      await evolutionService.sendMessage({
        clientId: client.id,
        clientName: client.name,
        petName: apt.pet.name,
        type: 'whatsapp_confirmation_ack',
        message: confirmMsg,
        phone: client.phone ?? undefined,
        manual: false,
      }).catch(() => {/* silent */})

      whatsappLogService.addLog({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        clientId: client.id,
        clientName: client.name,
        petName: apt.pet.name,
        type: 'whatsapp_confirmation_ack',
        message: confirmMsg,
        sentAt: new Date().toISOString(),
        status: 'sent',
        manual: false,
      })
      return
    }

    if (reply === '2') {
      await prisma.appointment.update({
        where: { id: apt.id },
        data: {
          whatsappConfirmationStatus: 'reschedule_requested',
          awaitingWhatsappReply: false,
          whatsappConfirmationReplyAt: new Date(),
          whatsappReplyText: reply,
        },
      })

      const rescheduleMsg =
        `Entendido, ${client.name}! 📅 Vamos entrar em contato em breve para reagendar o atendimento de ${apt.pet.name}. Obrigado!`
      await evolutionService.sendMessage({
        clientId: client.id,
        clientName: client.name,
        petName: apt.pet.name,
        type: 'whatsapp_reschedule_ack',
        message: rescheduleMsg,
        phone: client.phone ?? undefined,
        manual: false,
      }).catch(() => {/* silent */})

      whatsappLogService.addLog({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        clientId: client.id,
        clientName: client.name,
        petName: apt.pet.name,
        type: 'whatsapp_reschedule_ack',
        message: rescheduleMsg,
        sentAt: new Date().toISOString(),
        status: 'sent',
        manual: false,
      })
      return
    }

    if (reply === '3') {
      await prisma.appointment.update({
        where: { id: apt.id },
        data: {
          status: 'cancelled',
          whatsappConfirmationStatus: 'cancelled',
          awaitingWhatsappReply: false,
          whatsappConfirmationReplyAt: new Date(),
          whatsappReplyText: reply,
        },
      })

      const cancelMsg =
        `Tudo bem, ${client.name}. O agendamento de ${apt.pet.name} foi cancelado conforme solicitado. ❌ Se precisar, estamos à disposição para um novo agendamento!`
      await evolutionService.sendMessage({
        clientId: client.id,
        clientName: client.name,
        petName: apt.pet.name,
        type: 'whatsapp_cancel_ack',
        message: cancelMsg,
        phone: client.phone ?? undefined,
        manual: false,
      }).catch(() => {/* silent */})

      whatsappLogService.addLog({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        clientId: client.id,
        clientName: client.name,
        petName: apt.pet.name,
        type: 'whatsapp_cancel_ack',
        message: cancelMsg,
        sentAt: new Date().toISOString(),
        status: 'sent',
        manual: false,
      })
      return
    }

    // Invalid reply: save text, keep awaitingWhatsappReply = true, send hint
    await prisma.appointment.update({
      where: { id: apt.id },
      data: {
        whatsappConfirmationStatus: 'invalid_reply',
        whatsappReplyText: reply,
      },
    })

    const hintMsg =
      `Não entendi sua resposta. Por favor, responda apenas:\n*1* - Confirmar ✅\n*2* - Reagendar 🔄\n*3* - Cancelar ❌`
    await evolutionService.sendMessage({
      clientId: client.id,
      clientName: client.name,
      petName: apt.pet.name,
      type: 'whatsapp_invalid_reply',
      message: hintMsg,
      phone: client.phone ?? undefined,
      manual: false,
    }).catch(() => {/* silent */})

    whatsappLogService.addLog({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      clientId: client.id,
      clientName: client.name,
      petName: apt.pet.name,
      type: 'whatsapp_invalid_reply',
      message: hintMsg,
      sentAt: new Date().toISOString(),
      status: 'sent',
      manual: false,
    })
  } catch (err) {
    console.error('[webhook]', err)
  }
}
