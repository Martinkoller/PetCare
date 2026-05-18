import nodemailer from 'nodemailer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export interface AppointmentReminderData {
    clientName: string;
    clientEmail: string;
    petName: string;
    serviceType: string;
    date: Date;
    professionalName?: string;
    clinicName: string;
    clinicPhone?: string;
}

const SERVICE_LABELS: Record<string, string> = {
    grooming: 'Banho e Tosa',
    veterinary: 'Consulta Veterinária',
    boarding: 'Hospedagem',
    vaccination: 'Vacinação',
};

export const sendAppointmentReminderEmail = async (data: AppointmentReminderData) => {
    const serviceLabel = SERVICE_LABELS[data.serviceType] || data.serviceType;
    const dateFormatted = format(data.date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const timeFormatted = format(data.date, 'HH:mm');

    await transporter.sendMail({
        from: FROM,
        to: data.clientEmail,
        subject: `Lembrete: ${serviceLabel} amanhã — AgiliPet`,
        html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
                <div style="background:#f97316;padding:24px;border-radius:12px 12px 0 0">
                    <h1 style="color:#fff;margin:0;font-size:22px">🐾 Lembrete de Agendamento</h1>
                </div>
                <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
                    <p>Olá, <strong>${data.clientName}</strong>!</p>
                    <p>Este é um lembrete do agendamento de <strong>${data.petName}</strong> para amanhã.</p>

                    <table style="width:100%;border-collapse:collapse;margin:16px 0">
                        <tr>
                            <td style="padding:8px 0;color:#64748b;font-size:14px">Serviço</td>
                            <td style="padding:8px 0;font-weight:600">${serviceLabel}</td>
                        </tr>
                        <tr>
                            <td style="padding:8px 0;color:#64748b;font-size:14px">Data e Hora</td>
                            <td style="padding:8px 0;font-weight:600">${dateFormatted} às ${timeFormatted}</td>
                        </tr>
                        ${data.professionalName ? `
                        <tr>
                            <td style="padding:8px 0;color:#64748b;font-size:14px">Profissional</td>
                            <td style="padding:8px 0;font-weight:600">${data.professionalName}</td>
                        </tr>` : ''}
                        <tr>
                            <td style="padding:8px 0;color:#64748b;font-size:14px">Local</td>
                            <td style="padding:8px 0;font-weight:600">${data.clinicName}</td>
                        </tr>
                        ${data.clinicPhone ? `
                        <tr>
                            <td style="padding:8px 0;color:#64748b;font-size:14px">Contato</td>
                            <td style="padding:8px 0;font-weight:600">${data.clinicPhone}</td>
                        </tr>` : ''}
                    </table>

                    <p style="color:#64748b;font-size:13px;margin-top:24px">
                        Precisa reagendar? Entre em contato conosco o quanto antes.
                    </p>
                    <p style="color:#94a3b8;font-size:12px;margin-top:16px">
                        AgiliPet — Gestão inteligente para petshops e clínicas veterinárias
                    </p>
                </div>
            </div>
        `,
    });
};
