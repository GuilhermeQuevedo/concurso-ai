import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../../config/env.js';
import type { IEmailProvider, SendEmailOptions, EmailResult } from './email.interfaces.js';

export class SmtpEmailProvider implements IEmailProvider {
  private transporter: Transporter | null = null;
  private readonly host = env.SMTP_HOST;
  private readonly port = env.SMTP_PORT;
  private readonly user = env.SMTP_USER;
  private readonly pass = env.SMTP_PASS;
  private readonly secure = env.SMTP_SECURE;
  private readonly from = env.EMAIL_FROM;

  isConfigured(): boolean {
    return Boolean(this.host && this.user && this.pass);
  }

  private getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: this.secure,
        auth: {
          user: this.user,
          pass: this.pass,
        },
      });
    }
    return this.transporter;
  }

  async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Credenciais SMTP incompletas no servidor' };
    }

    try {
      const transporter = this.getTransporter();
      const info = await transporter.sendMail({
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao enviar e-mail via SMTP';
      console.error('❌ [SMTP] Erro no envio:', message);
      return { success: false, error: message };
    }
  }
}
