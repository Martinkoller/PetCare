import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getInteractions = async (req: AuthRequest, res: Response) => {
  const clientId = req.params.clientId as string;
  try {
    const interactions = await prisma.clientInteraction.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(interactions);
  } catch {
    res.status(500).json({ error: 'Failed to fetch interactions' });
  }
};

export const createInteraction = async (req: AuthRequest, res: Response) => {
  const clientId = req.params.clientId as string;
  try {
    const { type, origin = 'manual', subject, body, status = 'done', petName, relatedTo, responsible } = req.body;
    const interaction = await prisma.clientInteraction.create({
      data: { clientId, type, origin, subject, body: body || null, status, petName: petName || null, relatedTo: relatedTo || null, responsible: responsible || null },
    });
    res.status(201).json(interaction);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create interaction' });
  }
};

export const updateInteraction = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  try {
    const { type, origin, subject, body, status, petName, relatedTo, responsible } = req.body;
    const interaction = await prisma.clientInteraction.update({
      where: { id },
      data: {
        ...(type !== undefined ? { type } : {}),
        ...(origin !== undefined ? { origin } : {}),
        ...(subject !== undefined ? { subject } : {}),
        ...(body !== undefined ? { body: body || null } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(petName !== undefined ? { petName: petName || null } : {}),
        ...(relatedTo !== undefined ? { relatedTo: relatedTo || null } : {}),
        ...(responsible !== undefined ? { responsible: responsible || null } : {}),
      },
    });
    res.json(interaction);
  } catch {
    res.status(500).json({ error: 'Failed to update interaction' });
  }
};

export const deleteInteraction = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  try {
    await prisma.clientInteraction.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete interaction' });
  }
};
