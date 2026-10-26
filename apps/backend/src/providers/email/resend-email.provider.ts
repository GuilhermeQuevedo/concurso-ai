import { env } from '../../config/env.js';
import type { IEmailProvider, SendEmailOptions, EmailResult } from './email.interfaces.js';

interface ResendSuccessResponse {
  id: string;
}

interface ResendErrorResponse {
  message?: string;
  statusCode?: number;
}

export class ResendEmailProvider implements IEmailProvider {
  private readonly apiKey = env.RESEND_API_KEY;
  private readonly from = env.EMAIL_FROM;

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    if (!this.apiKey) {
      return { success: false, error: 'RESEND_API_KEY não configurada no servidor' };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.from,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as ResendErrorResponse;
        const message = errorData.message ?? `Erro HTTP ${response.status} ao enviar e-mail via Resend`;
        console.error('❌ [Resend] Falha no envio:', message);
        return { success: false, error: message };
      }

      const data = (await response.json()) as ResendSuccessResponse;
      return { success: true, messageId: data.id };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha desconhecida no envio com Resend';
      console.error('❌ [Resend] Erro de rede ou execução:', message);
      return { success: false, error: message };
    }
  }
}
