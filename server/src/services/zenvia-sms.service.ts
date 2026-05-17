import axios from 'axios';

const ZENVIA_API_URL = 'https://api.zenvia.com/v2/channels/sms/messages';

interface SmsPayload {
  phone: string;
  message: string;
  clientName?: string;
}

export const zenviaSmsService = {
  isConfigured(): boolean {
    return !!process.env.ZENVIA_API_TOKEN && !!process.env.ZENVIA_SMS_FROM;
  },

  async sendSms({ phone, message }: SmsPayload): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('[ZenviaSMS] ZENVIA_API_TOKEN ou ZENVIA_SMS_FROM não configurados.');
    }

    const normalized = this.normalizePhone(phone);
    if (!normalized) {
      throw new Error(`[ZenviaSMS] Número inválido: ${phone}`);
    }

    await axios.post(
      ZENVIA_API_URL,
      {
        from: process.env.ZENVIA_SMS_FROM,
        to: normalized,
        contents: [{ type: 'text', text: message.slice(0, 160) }],
      },
      {
        headers: {
          'X-API-TOKEN': process.env.ZENVIA_API_TOKEN!,
          'Content-Type': 'application/json',
        },
        timeout: 10_000,
      }
    );

    console.log(`[ZenviaSMS] SMS enviado para ${normalized}`);
  },

  normalizePhone(phone: string): string | null {
    const digits = phone.replace(/\D/g, '');
    // Already has country code (55 for Brazil)
    if (digits.startsWith('55') && digits.length >= 12) return digits;
    // Add Brazil country code
    if (digits.length === 10 || digits.length === 11) return `55${digits}`;
    return null;
  },
};
