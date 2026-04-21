import { Request, Response } from 'express'
import { prisma } from '../index'

const ROLE_LABELS = ['admin', 'veterinarian', 'groomer', 'attendant']

export const getProfessionals = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, phone: true, role: true, organizationId: true },
      orderBy: { name: 'asc' },
    })
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch professionals' })
  }
}

export const createProfessional = async (req: Request, res: Response) => {
  try {
    const { name, email, role, phone, color } = req.body
    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e e-mail são obrigatórios' })
    }
    if (role && !ROLE_LABELS.includes(role)) {
      return res.status(400).json({ error: 'Função inválida' })
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
        organizationId: color ?? null, // repurpose field for color until migration
        phone: phone ?? null,
      },
      select: { id: true, name: true, email: true, phone: true, role: true, organizationId: true },
    })
    res.status(201).json(user)
  } catch (error: any) {
    res.status(500).json({ error: error?.message ?? 'Failed to create professional' })
  }
}

export const updateProfessional = async (req: Request, res: Response) => {
  const id = String(req.params.id)
  try {
    const { name, email, role, phone, color } = req.body
    if (role && !ROLE_LABELS.includes(role)) {
      return res.status(400).json({ error: 'Função inválida' })
    }
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(role !== undefined ? { role } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(color !== undefined ? { organizationId: color } : {}),
      },
      select: { id: true, name: true, email: true, phone: true, role: true, organizationId: true },
    })
    res.json(user)
  } catch (error: any) {
    res.status(500).json({ error: error?.message ?? 'Failed to update professional' })
  }
}

export const deleteProfessional = async (req: Request, res: Response) => {
  const id = String(req.params.id)
  try {
    await prisma.user.delete({ where: { id } })
    res.status(204).send()
  } catch (error: any) {
    res.status(500).json({ error: error?.message ?? 'Failed to delete professional' })
  }
}
