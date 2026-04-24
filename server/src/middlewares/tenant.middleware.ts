import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { prisma } from '../index';

export const tenantGuard = async (req: AuthRequest, res: Response, next: NextFunction) => {
    // saas_admin não pertence a nenhuma organização
    if (req.user?.role === 'saas_admin') return next();

    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        return res.status(403).json({ error: 'Organização não identificada.' });
    }

    const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { status: true, trialEndsAt: true, confirmedAt: true },
    });

    if (!org) {
        return res.status(403).json({ error: 'Organização não encontrada.' });
    }

    if (!org.confirmedAt) {
        return res.status(403).json({ error: 'E-mail não confirmado. Verifique sua caixa de entrada.' });
    }

    if (org.status === 'inactive') {
        return res.status(403).json({ error: 'Conta inativa. Entre em contato pelo fone 49 999715125.' });
    }

    if (org.status === 'trial' && new Date() > org.trialEndsAt) {
        return res.status(403).json({ error: 'trial_expired' });
    }

    next();
};
