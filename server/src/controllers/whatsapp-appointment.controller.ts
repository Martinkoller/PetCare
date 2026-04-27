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
  const options = `\nResponda:\n*1* - Confirmar ✅\n*2* - Cancelar ❌`

  if (apt.serviceType === 'grooming') {
    return (
      `Olá ${client.name}! 🐾\n\n` +
      `Confirmamos o agendamento de *Banho e Tosa* para *${pet.name}*:\n` +
      `📅 Data: ${dateStr}\n` +
      `🕐 Horário: ${timeStr}\n` +
      options
    )
  }

  if (apt.serviceType === 'consultation') {
    return (
      `Olá ${client.name}! 🏥\n\n` +
      `Confirmamos a *Consulta Médica* para *${pet.name}*:\n` +
      `📅 Data: ${dateStr}\n` +
      `🕐 Horário: ${timeStr}\n` +
      options
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
      `📤 Check-out: ${checkOut}\n` +
      options
    )
  }

  if (apt.serviceType === 'vaccination') {
    return (
      `Olá ${client.name}! 💉\n\n` +
      `Confirmamos a *Vacinação* para *${pet.name}*:\n` +
      `📅 Data: ${dateStr}\n` +
      `🕐 Horário: ${timeStr}\n` +
      options
    )
  }

  return (
    `Olá ${client.name}! 🐾\n\n` +
    `Seu agendamento de *${pet.name}* está marcado para ${dateStr} às ${timeStr}.\n` +
    options
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

function extractPhoneAndText(body: any): { phone: string | null; text: string | null; fromMe: boolean } {
  try {
    const rawData = body?.data || body
    const data = Array.isArray(rawData) ? rawData[0] : rawData

    // Ignora mensagens enviadas pela própria instância (ACKs do bot)
    const fromMe: boolean = data?.key?.fromMe === true || body?.key?.fromMe === true

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

    return { phone: phone || null, text: text.trim() || null, fromMe }
  } catch (err) {
    console.error('[webhook] Erro ao extrair phone/text:', err)
    return { phone: null, text: null, fromMe: false }
  }
}

// Busca o agendamento aguardando resposta a partir do telefone,
// tolerando múltiplos clientes com mesmo número e variações de formato.
async function findPendingAptByPhone(normalizedPhone: string) {
  const suffix10 = normalizedPhone.slice(-10) // DDD + 9 dígitos ou DDD + 8
  const suffix9  = normalizedPhone.slice(-9)  // 9 dígitos sem DDD
  const suffix8  = normalizedPhone.slice(-8)  // 8 dígitos sem DDD

  // Busca todos os clientes cujo telefone termina com os sufixos
  const clients = await prisma.client.findMany({
    where: {
      OR: [
        { phone: { endsWith: suffix10 } },
        { phone: { endsWith: suffix9 } },
        { phone: { endsWith: suffix8 } },
        { phone: normalizedPhone },
        { phone: normalizedPhone.replace(/^55/, '') },
      ],
    },
    select: { id: true },
  })
  if (clients.length === 0) return null

  const clientIds = clients.map(c => c.id)

  return prisma.appointment.findFirst({
    where: {
      awaitingWhatsappReply: true,
      status: { notIn: ['archived', 'cancelled', 'completed'] },
      pet: { clientId: { in: clientIds } },
    },
    orderBy: { whatsappConfirmationSentAt: 'desc' },
    include: { pet: { include: { client: true } } },
  })
}

export async function webhook(req: Request, res: Response) {
  // Always ACK immediately so Evolution does not retry
  res.status(200).json({ ok: true })

  console.log('[webhook] body recebido:', JSON.stringify(req.body, null, 2))

  const { phone, text, fromMe } = extractPhoneAndText(req.body)

  console.log('[webhook] extraído → phone:', phone, '| text:', text, '| fromMe:', fromMe)

  // Ignora mensagens do próprio bot ou sem dados
  if (fromMe || !phone || !text) {
    console.log('[webhook] ignorado — fromMe:', fromMe, '| phone:', phone, '| text:', text)
    return
  }

  const normalizedPhone = normalizePhone(phone)
  console.log('[webhook] normalizedPhone:', normalizedPhone)

  try {
    const apt = await findPendingAptByPhone(normalizedPhone)
    console.log('[webhook] apt encontrado:', apt ? `${apt.id} — ${apt.pet.name} / ${apt.pet.client.name} (status: ${apt.status})` : 'NENHUM')
    if (!apt) return

    const client = apt.pet.client

    const reply = text.trim()

    // ── 1: Confirmar ─────────────────────────────────────────────────────────
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

      const confirmMsg =
        `Ótimo, ${client.name}! 🎉\nSeu agendamento para *${apt.pet.name}* está confirmado.\nTe esperamos! 🐾`

      await evolutionService.sendMessage({
        clientId: client.id,
        clientName: client.name,
        petName: apt.pet.name,
        type: 'whatsapp_confirmation_ack',
        message: confirmMsg,
        phone: client.phone ?? undefined,
        manual: false,
      }).catch(() => {})

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

    // ── 2: Cancelar ──────────────────────────────────────────────────────────
    if (reply === '2') {
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
        `Tudo bem, ${client.name}. ❌\nO agendamento de *${apt.pet.name}* foi cancelado conforme solicitado.\nSe precisar, estamos à disposição para um novo horário!`

      await evolutionService.sendMessage({
        clientId: client.id,
        clientName: client.name,
        petName: apt.pet.name,
        type: 'whatsapp_cancel_ack',
        message: cancelMsg,
        phone: client.phone ?? undefined,
        manual: false,
      }).catch(() => {})

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

    // ── Resposta inválida: mantém awaitingWhatsappReply=true, pede reenvio ───
    await prisma.appointment.update({
      where: { id: apt.id },
      data: {
        whatsappConfirmationStatus: 'invalid_reply',
        whatsappReplyText: reply,
      },
    })

    const hintMsg =
      `Não entendi sua resposta. 🤔\nPor favor, responda apenas:\n*1* - Confirmar ✅\n*2* - Cancelar ❌`

    await evolutionService.sendMessage({
      clientId: client.id,
      clientName: client.name,
      petName: apt.pet.name,
      type: 'whatsapp_invalid_reply',
      message: hintMsg,
      phone: client.phone ?? undefined,
      manual: false,
    }).catch(() => {})

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
