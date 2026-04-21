import { Response } from 'express'
import { prisma } from '../index'
import { AuthRequest } from '../middlewares/auth.middleware'

const parseTemplate = (t: any) => ({
  ...t,
  services: t.services ? JSON.parse(t.services) : [],
})

export const getAppointmentTemplates = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const templates = await prisma.appointmentTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    })
    res.json(templates.map(parseTemplate))
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch templates' })
  }
}

export const createAppointmentTemplate = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const data = {
      name: req.body.name,
      description: req.body.description || '',
      defaultDurationDays: Number(req.body.defaultDurationDays || 0),
      services: JSON.stringify(req.body.services || []),
    }

    const template = await prisma.appointmentTemplate.create({ data })
    res.status(201).json(parseTemplate(template))
  } catch (error) {
    res.status(500).json({ error: 'Failed to create template' })
  }
}

export const updateAppointmentTemplate = async (
  req: AuthRequest,
  res: Response,
) => {
  const { id } = req.params

  try {
    const data: any = {
      ...(req.body.name !== undefined ? { name: req.body.name } : {}),
      ...(req.body.description !== undefined
        ? { description: req.body.description }
        : {}),
      ...(req.body.defaultDurationDays !== undefined
        ? { defaultDurationDays: Number(req.body.defaultDurationDays) }
        : {}),
      ...(req.body.services !== undefined
        ? { services: JSON.stringify(req.body.services || []) }
        : {}),
    }

    const template = await prisma.appointmentTemplate.update({
      where: { id: id as string },
      data,
    })

    res.json(parseTemplate(template))
  } catch (error) {
    res.status(500).json({ error: 'Failed to update template' })
  }
}

export const deleteAppointmentTemplate = async (
  req: AuthRequest,
  res: Response,
) => {
  const { id } = req.params

  try {
    await prisma.appointmentTemplate.delete({ where: { id: id as string } })
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete template' })
  }
}
