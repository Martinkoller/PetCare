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

export const getClients = async (req: AuthRequest, res: Response) => {
    try {
        const organizationId = req.user!.organizationId!
        const clients = await prisma.client.findMany({
            where: { organizationId },
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
        if (!req.body.name) {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }
        const organizationId = req.user!.organizationId!
        const data = { ...pickClientData(req.body), organizationId } as any;
        const client = await prisma.client.create({ data });
        res.status(201).json(client);
    } catch (_error) {
        res.status(500).json({ error: 'Failed to create client' });
    }
};

export const updateClient = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        const organizationId = req.user!.organizationId!
        const data = pickClientData(req.body) as any;
        const client = await prisma.client.update({
            where: { id: id as string, organizationId },
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
        const organizationId = req.user!.organizationId!
        const client = await prisma.client.delete({ where: { id: id as string, organizationId } });
        res.json(client);
    } catch (_error) {
        res.status(500).json({ error: 'Failed to delete client' });
    }
};

function translateServiceType(type: string): string {
    switch (type) {
        case 'grooming':   return 'Banho e Tosa';
        case 'veterinary': return 'Consulta Veterinária';
        case 'boarding':   return 'Hospedagem';
        case 'vaccination': return 'Vacinação';
        default:           return type;
    }
}

export const getClientFinancialSummary = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        const organizationId = req.user!.organizationId!;

        const client = await prisma.client.findFirst({ where: { id, organizationId } });
        if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });

        const [sales, pets] = await Promise.all([
            prisma.sale.findMany({
                where: { clientId: id, organizationId },
                include: { items: true },
                orderBy: { date: 'desc' },
            }),
            prisma.pet.findMany({ where: { clientId: id } }),
        ]);

        const petIds = pets.map((p) => p.id);
        const appointments = petIds.length
            ? await prisma.appointment.findMany({
                  where: {
                      petId: { in: petIds },
                      organizationId,
                      status: { in: ['completed', 'in_progress'] },
                  },
                  include: { pet: true },
                  orderBy: { date: 'desc' },
              })
            : [];

        const totalSales = sales.reduce((acc, s) => acc + s.total, 0);
        const totalServices = appointments.reduce((acc, a) => acc + (a.price || 0), 0);
        const totalSpent = totalSales + totalServices;

        const transactions = [
            ...sales.map((s) => ({
                id: s.id,
                date: s.date,
                type: 'product' as const,
                description: `Venda — ${s.items.map((i) => i.productName).join(', ')}`,
                amount: s.total,
                status: s.status,
                paymentMethod: s.paymentMethod,
            })),
            ...appointments.map((a) => ({
                id: a.id,
                date: a.date,
                type: 'service' as const,
                description: `${translateServiceType(a.serviceType)} — ${(a.pet as any).name}`,
                amount: a.price || 0,
                status: a.status,
                paymentMethod: null,
            })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        res.json({ totalSales, totalServices, totalSpent, transactions });
    } catch (_error) {
        res.status(500).json({ error: 'Failed to fetch financial summary' });
    }
};
