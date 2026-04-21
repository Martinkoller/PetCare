import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

export const generateToken = (userId: string, role: string): string => {
    return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): any => {
    return jwt.verify(token, JWT_SECRET);
};
