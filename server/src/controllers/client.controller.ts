import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/auth.middleware';

const pickClientData = (body: any) => ({
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.email !== undefined ? { email: body.email || null } : {}),
    ...(body.phone !== undefined ? { phone: body.phone || null } : {}),
    ...(body.cpf !== undefined ? { cpf: body.cpf || null } : {}),
    ...(body.address !== undefined ? { address: body.address || null } : {}),
    ...(body.notes !== undefined ? { notes: body.notes || null } : {}),
    ...(body.whatsappEnabled !== undefined ? { whatsappEnabled: Boolean(body.whatsappEnabled) } : {}),
    ...(body.joinedAt !== undefined ? { joinedAt: new Date(body.joinedAt) } : {}),
    ...(body.birthDate !== undefined ? { birthDate: body.birthDate ? new Date(body.birthDate) : null } : {}),
    ...(body.gender !== undefined ? { gender: body.gender || null } : {}),
    ...(body.city !== undefined ? { city: body.city || null } : {}),
    ...(body.state !== undefined ? { state: body.state || null } : {}),
    ...(body.neighborhood !== undefined ? { neighborhood: body.neighborhood || null } : {}),
    ...(body.street !== undefined ? { street: body.street || null } : {}),
    ...(body.number !== undefined ? { number: body.number || null } : {}),
    ...(body.complement !== undefined ? { complement: body.complement || null } : {}),
    ...(body.zipCode !== undefined ? { zipCode: body.zipCode || null } : {}),
    ...(body.acceptsCampaigns !== undefined ? { acceptsCampaigns: Boolean(body.acceptsCampaigns) } : {}),
    ...(body.blockCredit !== undefined ? { blockCredit: Boolean(body.blockCredit) } : {}),
    ...(body.origin !== undefined ? { origin: body.origin || null } : {}),
});

export const getClients = async (_req: AuthRequest, res: Response) => {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { createdAt: 'desc' },
            include: { pets: true },
        });
        res.json(clients);
    } catch (_error) {
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
};

export const createClient = async (req: AuthRequest, res: Response) => {
    try {
        const data = pickClientData(req.body) as any;
        const client = await prisma.client.create({ data });
        res.status(201).json(client);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create client' });
    }
};

export const updateClient = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        const data = pickClientData(req.body) as any;
        const client = await prisma.client.update({
            where: { id: id as string },
            data,
        });
        res.json(client);
    } catch (_error) {
        res.status(500).json({ error: 'Failed to update client' });
    }
};

export const deleteClient = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.client.delete({ where: { id: id as string } });
        res.status(204).send();
    } catch (_error) {
        res.status(500).json({ error: 'Failed to delete client' });
    }
};
