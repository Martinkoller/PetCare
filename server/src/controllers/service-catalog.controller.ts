import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getServices = async (req: AuthRequest, res: Response) => {
    try {
        const services = await prisma.serviceCatalogItem.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(services);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch services' });
    }
};

export const createService = async (req: AuthRequest, res: Response) => {
    try {
        const service = await prisma.serviceCatalogItem.create({
            data: req.body,
        });
        res.status(201).json(service);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create service' });
    }
};

export const updateService = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        const service = await prisma.serviceCatalogItem.update({
            where: { id: id as string },
            data: req.body,
        });
        res.json(service);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update service' });
    }
};

export const toggleStatus = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { active } = req.body;
    try {
        const service = await prisma.serviceCatalogItem.update({
            where: { id: id as string },
            data: { active },
        });
        res.json(service);
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle service status' });
    }
};

export const deleteService = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.serviceCatalogItem.delete({ where: { id: id as string } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete service' });
    }
};
