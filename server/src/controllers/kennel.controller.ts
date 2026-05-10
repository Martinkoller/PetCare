import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getKennels = async (req: AuthRequest, res: Response) => {
  try {
    const kennels = await prisma.kennel.findMany({
      where: { organizationId: req.user!.organizationId! },
      orderBy: { name: 'asc' },
    });
    res.json(kennels);
  } catch {
    res.status(500).json({ error: 'Failed to fetch kennels' });
  }
};

export const createKennel = async (req: AuthRequest, res: Response) => {
  try {
    const kennel = await prisma.kennel.create({
      data: {
        organizationId: req.user!.organizationId!,
        name: String(req.body.name),
        size: String(req.body.size || 'medium'),
        status: String(req.body.status || 'available'),
      },
    });
    res.status(201).json(kennel);
  } catch {
    res.status(500).json({ error: 'Failed to create kennel' });
  }
};

export const updateKennel = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  try {
    const kennel = await prisma.kennel.update({
      where: { id },
      data: {
        ...(req.body.name !== undefined ? { name: String(req.body.name) } : {}),
        ...(req.body.size !== undefined ? { size: String(req.body.size) } : {}),
        ...(req.body.status !== undefined ? { status: String(req.body.status) } : {}),
      },
    });
    res.json(kennel);
  } catch {
    res.status(500).json({ error: 'Failed to update kennel' });
  }
};

export const deleteKennel = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  try {
    await prisma.kennel.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete kennel' });
  }
};
