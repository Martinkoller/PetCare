import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const FROM = process.env.SMTP_FROM || '"AgiliPet" <noreply@agilipet.com.br>';

export const sendConfirmationEmail = async (to: string, name: string, token: string) => {
    const url = `${APP_URL}/confirm-email?token=${token}`;

    await transporter.sendMail({
        from: FROM,
        to,
        subject: 'Confirme seu cadastro — AgiliPet',
        html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
                <h2 style="color:#f97316">Bem-vindo ao AgiliPet!</h2>
                <p>Olá, <strong>${name}</strong>!</p>
                <p>Clique no botão abaixo para confirmar seu e-mail e ativar seu período de trial de 15 dias.</p>
                <a href="${url}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#f97316;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
                    Confirmar E-mail
                </a>
                <p style="color:#888;font-size:12px">Este link expira em 24 horas. Se você não solicitou o cadastro, ignore este e-mail.</p>
            </div>
        `,
    });
};
