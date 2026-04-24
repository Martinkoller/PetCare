import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

export const generateToken = (userId: string, role: string, organizationId?: string | null, extra?: Record<string, unknown>): string => {
    return jwt.sign({ userId, role, organizationId: organizationId ?? null, ...(extra ?? {}) }, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): any => {
    return jwt.verify(token, JWT_SECRET);
};
