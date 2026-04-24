import { Request, Response } from 'express';
import { prisma } from '../index';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middlewares/auth.middleware';

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(401).json({ error: 'Credenciais inválidas.' });

        const isValid = await comparePassword(password, user.passwordHash);
        if (!isValid) return res.status(401).json({ error: 'Credenciais inválidas.' });

        // Verifica organização (saas_admin não tem organizationId)
        if (user.role !== 'saas_admin' && user.organizationId) {
            const org = await prisma.organization.findUnique({
                where: { id: user.organizationId },
                select: { status: true, trialEndsAt: true, confirmedAt: true },
            });

            if (org) {
                if (!org.confirmedAt) {
                    return res.status(403).json({ error: 'E-mail não confirmado. Verifique sua caixa de entrada.' });
                }
                if (org.status === 'inactive') {
                    return res.status(403).json({ error: 'Conta inativa. Entre em contato pelo fone 49 999715125.' });
                }
                if (org.status === 'trial' && new Date() > org.trialEndsAt) {
                    return res.status(403).json({ error: 'trial_expired' });
                }
            }
        }

        const token = generateToken(user.id, user.role, user.organizationId);

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                organizationId: user.organizationId,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno.' });
    }
};

export const me = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.id) return res.status(401).json({ error: 'Não autenticado.' });

        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, name: true, role: true, organizationId: true },
        });

        if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

        res.json(user);
    } catch (_error) {
        res.status(500).json({ error: 'Erro interno.' });
    }
};

export const register = async (req: Request, res: Response) => {
    const { email, password, name, role } = req.body;
    try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ error: 'E-mail já cadastrado.' });

        const passwordHash = await hashPassword(password);
        const user = await prisma.user.create({
            data: { email, passwordHash, name, role: role || 'attendant' },
        });

        const token = generateToken(user.id, user.role, user.organizationId);
        res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno.' });
    }
};
