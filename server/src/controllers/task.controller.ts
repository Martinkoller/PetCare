import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getTasks = async (req: AuthRequest, res: Response) => {
    try {
        const tasks = await prisma.task.findMany({
            orderBy: { dueDate: 'asc' },
        });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};

export const createTask = async (req: AuthRequest, res: Response) => {
    try {
        const task = await prisma.task.create({
            data: {
                organizationId: req.user!.organizationId!,
                title: req.body.title,
                description: req.body.description || null,
                category: req.body.category,
                assignee: req.body.assignee,
                dueDate: new Date(req.body.dueDate),
                status: req.body.status || 'pending',
                priority: req.body.priority || 'medium',
                notifiedOverdue: req.body.notifiedOverdue || false,
            },
        });
        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create task' });
    }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        const task = await prisma.task.update({
            where: { id: id as string },
            data: {
                title: req.body.title,
                description: req.body.description,
                category: req.body.category,
                assignee: req.body.assignee,
                dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
                status: req.body.status,
                priority: req.body.priority,
                notifiedOverdue: req.body.notifiedOverdue !== undefined ? req.body.notifiedOverdue : undefined,
            },
        });
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
    }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.task.delete({ where: { id: id as string } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
};
