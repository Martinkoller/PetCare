import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getSettings = async (req: AuthRequest, res: Response) => {
    try {
        const orgId = req.user?.organizationId;
        if (!orgId) return res.status(400).json({ error: 'No organization' });

        const org = await prisma.organization.findUnique({ where: { id: orgId } });
        if (!org) return res.status(404).json({ error: 'Organization not found' });

        const settings = org.settings ? JSON.parse(org.settings) : {};
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
    try {
        const orgId = req.user?.organizationId;
        if (!orgId) return res.status(400).json({ error: 'No organization' });

        const org = await prisma.organization.findUnique({ where: { id: orgId } });
        if (!org) return res.status(404).json({ error: 'Organization not found' });

        const currentSettings = org.settings ? JSON.parse(org.settings) : {};
        const newSettings = { ...currentSettings, ...req.body };

        await prisma.organization.update({
            where: { id: orgId },
            data: { settings: JSON.stringify(newSettings) }
        });

        res.json(newSettings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
};

export const getMyOrganization = async (req: AuthRequest, res: Response) => {
    try {
        const orgId = req.user?.organizationId;
        if (!orgId) return res.status(400).json({ error: 'No organization' });

        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            select: {
                id: true, name: true, cnpj: true, email: true, phone: true,
                zipCode: true, street: true, number: true, complement: true,
                neighborhood: true, city: true, state: true,
                status: true, plan: true, trialEndsAt: true, confirmedAt: true, createdAt: true,
                _count: { select: { users: true, clients: true, pets: true } },
            },
        });
        if (!org) return res.status(404).json({ error: 'Organization not found' });
        res.json(org);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch organization' });
    }
};

export const updateMyOrganization = async (req: AuthRequest, res: Response) => {
    try {
        const orgId = req.user?.organizationId;
        if (!orgId) return res.status(400).json({ error: 'No organization' });

        const { name, phone, zipCode, street, number, complement, neighborhood, city, state } = req.body;

        const org = await prisma.organization.update({
            where: { id: orgId },
            data: { name, phone, zipCode, street, number, complement, neighborhood, city, state },
            select: {
                id: true, name: true, cnpj: true, email: true, phone: true,
                zipCode: true, street: true, number: true, complement: true,
                neighborhood: true, city: true, state: true,
                status: true, trialEndsAt: true, confirmedAt: true, createdAt: true,
            },
        });
        res.json(org);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update organization' });
    }
};
