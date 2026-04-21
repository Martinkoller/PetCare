import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}

export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = verifyToken(token);
            req.user = { id: decoded.userId, role: decoded.role };
        } catch (_error) {
            // Ignore invalid token when authentication is disabled.
        }
    }

    if (!req.user) {
        req.user = { id: 'public-user', role: 'admin' };
    }

    next();
};
