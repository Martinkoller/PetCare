import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/auth.middleware';

export const listOrganizations = async (_req: AuthRequest, res: Response) => {
    try {
        const orgs = await prisma.organization.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                cnpj: true,
                email: true,
                phone: true,
                status: true,
                plan: true,
                trialEndsAt: true,
                confirmedAt: true,
                createdAt: true,
                _count: {
                    select: { users: true, clients: true },
                },
            },
        });
        res.json(orgs);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno.' });
    }
};

export const toggleOrganizationStatus = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const { status } = req.body;

    try {
        const org = await prisma.organization.update({
            where: { id },
            data: { status },
        });
        res.json(org);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno.' });
    }
};

export const updateOrganizationPlan = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const { plan } = req.body;

    const validPlans = ['essencial', 'hotel', 'clinica'];
    if (!validPlans.includes(plan)) {
        return res.status(400).json({ error: 'Plano inválido.' });
    }

    try {
        const org = await prisma.organization.update({
            where: { id },
            data: { plan },
        });
        res.json(org);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno.' });
    }
};
