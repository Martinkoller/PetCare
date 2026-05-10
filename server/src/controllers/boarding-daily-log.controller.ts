import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getDailyLogs = async (req: AuthRequest, res: Response) => {
  const boardingId = req.params.boardingId as string;
  try {
    const logs = await prisma.boardingDailyLog.findMany({
      where: { boardingId },
      orderBy: { logDate: 'desc' },
    });
    res.json(logs);
  } catch {
    res.status(500).json({ error: 'Failed to fetch daily logs' });
  }
};

export const createDailyLog = async (req: AuthRequest, res: Response) => {
  const boardingId = req.params.boardingId as string;
  try {
    const log = await prisma.boardingDailyLog.create({
      data: {
        boardingId,
        logDate: req.body.logDate ? new Date(req.body.logDate) : new Date(),
        fedAt: req.body.fedAt || null,
        walkedAt: req.body.walkedAt || null,
        medication: req.body.medication || null,
        behavior: req.body.behavior || null,
        stoolNotes: req.body.stoolNotes || null,
        staffNotes: req.body.staffNotes || null,
      },
    });
    res.status(201).json(log);
  } catch {
    res.status(500).json({ error: 'Failed to create daily log' });
  }
};

export const updateDailyLog = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  try {
    const log = await prisma.boardingDailyLog.update({
      where: { id },
      data: {
        ...(req.body.fedAt !== undefined ? { fedAt: req.body.fedAt || null } : {}),
        ...(req.body.walkedAt !== undefined ? { walkedAt: req.body.walkedAt || null } : {}),
        ...(req.body.medication !== undefined ? { medication: req.body.medication || null } : {}),
        ...(req.body.behavior !== undefined ? { behavior: req.body.behavior || null } : {}),
        ...(req.body.stoolNotes !== undefined ? { stoolNotes: req.body.stoolNotes || null } : {}),
        ...(req.body.staffNotes !== undefined ? { staffNotes: req.body.staffNotes || null } : {}),
      },
    });
    res.json(log);
  } catch {
    res.status(500).json({ error: 'Failed to update daily log' });
  }
};

export const deleteDailyLog = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  try {
    await prisma.boardingDailyLog.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete daily log' });
  }
};
