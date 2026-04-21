import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/auth.middleware';

const pickProductData = (body: any) => ({
  ...(body.name !== undefined ? { name: body.name } : {}),
  ...(body.category !== undefined ? { category: body.category } : {}),
  ...(body.sku !== undefined ? { sku: body.sku } : {}),
  ...(body.price !== undefined ? { price: Number(body.price) } : {}),
  ...(body.stock !== undefined ? { stock: Number(body.stock) } : {}),
  ...(body.minStock !== undefined ? { minStock: Number(body.minStock) } : {}),
  ...(body.description !== undefined ? { description: body.description || null } : {}),
  ...(body.unit !== undefined ? { unit: body.unit || null } : {}),
  ...(body.expirationDate !== undefined
    ? { expirationDate: body.expirationDate ? new Date(body.expirationDate) : null }
    : {}),
});

const normalizeBatchInput = (batches: any[] = []) =>
  batches
    .filter((b) => b && b.code)
    .map((b) => ({
      code: String(b.code),
      quantity: Number(b.quantity || 0),
      expirationDate: new Date(b.expirationDate),
    }));

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' },
      include: { batches: true },
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const baseData = pickProductData(req.body) as any;
    const batches = normalizeBatchInput(req.body.batches || []);

    const product = await prisma.product.create({
      data: {
        ...baseData,
        ...(batches.length > 0
          ? {
              batches: {
                create: batches,
              },
            }
          : {}),
      },
      include: { batches: true },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const baseData = pickProductData(req.body) as any;
    const hasBatches = Array.isArray(req.body.batches);
    const batches = hasBatches ? normalizeBatchInput(req.body.batches) : [];

    const product = await prisma.product.update({
      where: { id: id as string },
      data: {
        ...baseData,
        ...(hasBatches
          ? {
              batches: {
                deleteMany: {},
                create: batches,
              },
            }
          : {}),
      },
      include: { batches: true },
    });

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.product.delete({ where: { id: id as string } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};
