import { Response } from 'express'
import { prisma } from '../index'
import { AuthRequest } from '../middlewares/auth.middleware'

const ROLE_LABELS = ['admin', 'veterinarian', 'groomer', 'attendant']

export const getProfessionals = async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.user!.organizationId!
    const users = await prisma.user.findMany({
      where: { organizationId },
      select: { id: true, name: true, email: true, phone: true, role: true, color: true, commissionRate: true },
      orderBy: { name: 'asc' },
    })
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch professionals' })
  }
}

export const createProfessional = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, role, phone, color, commissionRate } = req.body
    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e e-mail são obrigatórios' })
    }
    if (role && !ROLE_LABELS.includes(role)) {
      return res.status(400).json({ error: 'Função inválida' })
    }
    if (commissionRate !== undefined && (Number(commissionRate) < 0 || Number(commissionRate) > 100)) {
      return res.status(400).json({ error: 'commissionRate deve ser entre 0 e 100' })
    }
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: 'E-mail já cadastrado' })
    }
    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: role ?? 'attendant',
        passwordHash: '',
        organizationId: req.user!.organizationId!,
        phone: phone ?? null,
        color: color ?? null,
        commissionRate: commissionRate !== undefined ? Number(commissionRate) : null,
      },
      select: { id: true, name: true, email: true, phone: true, role: true, color: true, commissionRate: true },
    })
    res.status(201).json(user)
  } catch (error: any) {
    res.status(500).json({ error: error?.message ?? 'Failed to create professional' })
  }
}

export const updateProfessional = async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id)
  try {
    const { name, email, role, phone, color, commissionRate } = req.body
    if (role && !ROLE_LABELS.includes(role)) {
      return res.status(400).json({ error: 'Função inválida' })
    }
    if (commissionRate !== undefined && commissionRate !== null && (Number(commissionRate) < 0 || Number(commissionRate) > 100)) {
      return res.status(400).json({ error: 'commissionRate deve ser entre 0 e 100' })
    }
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(role !== undefined ? { role } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(color !== undefined ? { color } : {}),
        ...(commissionRate !== undefined ? { commissionRate: commissionRate === null ? null : Number(commissionRate) } : {}),
      },
      select: { id: true, name: true, email: true, phone: true, role: true, color: true, commissionRate: true },
    })
    res.json(user)
  } catch (error: any) {
    res.status(500).json({ error: error?.message ?? 'Failed to update professional' })
  }
}

export const deleteProfessional = async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id)
  try {
    await prisma.user.delete({ where: { id } })
    res.status(204).send()
  } catch (error: any) {
    res.status(500).json({ error: error?.message ?? 'Failed to delete professional' })
  }
}
