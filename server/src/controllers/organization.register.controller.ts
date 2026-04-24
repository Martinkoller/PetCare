import { Request, Response } from 'express';
import { prisma } from '../index';
import { hashPassword } from '../utils/hash';
import { sendConfirmationEmail } from '../services/email.service';
import crypto from 'crypto';

function validateCNPJ(cnpj: string): boolean {
    const c = cnpj.replace(/\D/g, '');
    if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;

    const calc = (mod: number) => {
        const weights = mod === 1
            ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
            : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        const sum = weights.reduce((acc, w, i) => acc + Number(c[i]) * w, 0);
        const rem = sum % 11;
        return rem < 2 ? 0 : 11 - rem;
    };

    return calc(1) === Number(c[12]) && calc(2) === Number(c[13]);
}

export const registerOrganization = async (req: Request, res: Response) => {
    const {
        companyName, cnpj, email, password, name,
        zipCode, street, number, complement, neighborhood, city, state, phone, plan,
    } = req.body;

    const validPlans = ['essencial', 'hotel', 'clinica'];
    const selectedPlan = validPlans.includes(plan) ? plan : 'essencial';

    if (!companyName || !cnpj || !email || !password || !name) {
        return res.status(400).json({ error: 'Campos obrigatórios não informados.' });
    }

    if (!validateCNPJ(cnpj)) {
        return res.status(400).json({ error: 'CNPJ inválido.' });
    }

    try {
        const existingOrg = await prisma.organization.findUnique({ where: { cnpj: cnpj.replace(/\D/g, '') } });
        if (existingOrg) return res.status(400).json({ error: 'CNPJ já cadastrado.' });

        const existingEmail = await prisma.organization.findUnique({ where: { email } });
        if (existingEmail) return res.status(400).json({ error: 'E-mail já cadastrado.' });

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ error: 'E-mail já cadastrado.' });

        const token = crypto.randomBytes(32).toString('hex');
        const trialEndsAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const org = await prisma.organization.create({
            data: {
                name: companyName,
                cnpj: cnpj.replace(/\D/g, ''),
                email,
                phone,
                zipCode,
                street,
                number,
                complement,
                neighborhood,
                city,
                state,
                status: 'trial',
                plan: selectedPlan,
                trialEndsAt,
                emailConfirmationToken: token,
                emailConfirmationExpiresAt: expiresAt,
            },
        });

        const passwordHash = await hashPassword(password);
        await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                role: 'admin',
                organizationId: org.id,
            },
        });

        await sendConfirmationEmail(email, name, token);

        res.status(201).json({ message: 'Cadastro realizado! Verifique seu e-mail para confirmar a conta.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno.' });
    }
};

export const confirmEmail = async (req: Request, res: Response) => {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'Token inválido.' });
    }

    try {
        const org = await prisma.organization.findFirst({
            where: { emailConfirmationToken: token },
        });

        if (!org) return res.status(400).json({ error: 'Token inválido ou já utilizado.' });

        if (org.emailConfirmationExpiresAt && new Date() > org.emailConfirmationExpiresAt) {
            return res.status(400).json({ error: 'Token expirado. Solicite um novo cadastro.' });
        }

        await prisma.organization.update({
            where: { id: org.id },
            data: {
                confirmedAt: new Date(),
                emailConfirmationToken: null,
                emailConfirmationExpiresAt: null,
            },
        });

        res.json({ message: 'E-mail confirmado com sucesso! Você já pode fazer login.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno.' });
    }
};
