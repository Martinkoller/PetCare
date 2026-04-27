import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getSales = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) return res.status(401).json({ error: 'Unauthorized' });

    const sales = await prisma.sale.findMany({
      where: { organizationId: orgId },
      include: { items: true },
      orderBy: { date: 'desc' },
    });

    return res.json(sales);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch sales' });
  }
};

export const createSale = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) return res.status(401).json({ error: 'Unauthorized' });

    const { clientId, petId, items, total, status } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    const sale = await prisma.sale.create({
      data: {
        organizationId: orgId,
        clientId: clientId || null,
        petId: petId || null,
        total: Number(total),
        status: status || 'completed',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            total: Number(item.total),
            batchId: item.batchId || null,
          })),
        },
      },
      include: { items: true },
    });

    // Desconta estoque de cada produto
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: Number(item.quantity) } },
      }).catch(() => {/* ignora se produto não encontrado */});
    }

    return res.status(201).json(sale);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create sale' });
  }
};

export const cancelSale = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) return res.status(401).json({ error: 'Unauthorized' });

    const id = String(req.params.id);

    const sale = await prisma.sale.findFirst({
      where: { id, organizationId: orgId },
      include: { items: true },
    });
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    if (sale.status === 'cancelled') return res.status(400).json({ error: 'Sale already cancelled' });

    await prisma.sale.update({ where: { id }, data: { status: 'cancelled' } });

    for (const item of (sale as any).items ?? []) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      }).catch(() => {});
    }

    return res.json({ id, status: 'cancelled' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to cancel sale' });
  }
};
