import { Request, Response } from 'express';
import { prisma } from '../index';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middlewares/auth.middleware';

const PUBLIC_USER = {
    id: 'public-user',
    email: 'public@petcare.local',
    name: 'Acesso Livre',
    role: 'admin',
    organizationId: null,
};

export const register = async (req: Request, res: Response) => {
    const { email, password, name, role } = req.body;

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const passwordHash = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                role: role || 'attendant',
            },
        });

        const token = generateToken(user.id, user.role);

        res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValid = await comparePassword(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(user.id, user.role);

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const me = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.id || req.user.id === PUBLIC_USER.id) {
            return res.json(PUBLIC_USER);
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, name: true, role: true, organizationId: true },
        });

        if (!user) {
            return res.json(PUBLIC_USER);
        }

        res.json(user);
    } catch (_error) {
        res.json(PUBLIC_USER);
    }
};
