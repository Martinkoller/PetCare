import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
        organizationId: string | null;
    };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = verifyToken(token);
            req.user = {
                id: decoded.userId,
                role: decoded.role,
                organizationId: decoded.organizationId ?? null,
            };
        } catch (_error) {
            // invalid token
        }
    }

    if (!req.user) {
        return res.status(401).json({ error: 'Não autenticado.' });
    }

    next();
};

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.id === 'public-user') {
        return res.status(401).json({ error: 'Não autenticado.' });
    }
    next();
};

export const requireSaasAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'saas_admin') {
        return res.status(403).json({ error: 'Acesso restrito.' });
    }
    next();
};

export const requireTenant = async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.organizationId) {
        return res.status(403).json({ error: 'Organização não identificada.' });
    }
    next();
};
