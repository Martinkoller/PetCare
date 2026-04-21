import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getSettings = async (req: AuthRequest, res: Response) => {
    try {
        // Return first org or create default
        let org = await prisma.organization.findFirst();
        if (!org) {
            org = await prisma.organization.create({
                data: { name: 'My Pet Care', settings: '{}' }
            });
        }
        const settings = org.settings ? JSON.parse(org.settings) : {};
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
    try {
        let org = await prisma.organization.findFirst();
        if (!org) {
            org = await prisma.organization.create({
                data: { name: 'My Pet Care', settings: '{}' }
            });
        }

        const currentSettings = org.settings ? JSON.parse(org.settings) : {};
        const newSettings = { ...currentSettings, ...req.body };

        await prisma.organization.update({
            where: { id: org.id },
            data: { settings: JSON.stringify(newSettings) }
        });

        res.json(newSettings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
};
