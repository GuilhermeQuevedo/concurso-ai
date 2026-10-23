import { EmailFactory } from '../providers/email/email.factory.js';
import { EmailTemplates } from '../providers/email/email.templates.js';
import type { IEmailProvider } from '../providers/email/email.interfaces.js';

export class EmailService {
  constructor(private readonly provider: IEmailProvider = EmailFactory.createProvider()) {}

  async sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<boolean> {
    const { html, text } = EmailTemplates.passwordReset(name, resetUrl);
    const result = await this.provider.sendEmail({
      to,
      subject: 'Redefinição de Senha - Engrama',
      html,
      text,
    });
    return result.success;
  }

  async sendWelcomeEmail(to: string, name: string, loginUrl: string): Promise<boolean> {
    const { html, text } = EmailTemplates.welcome(name, loginUrl);
    const result = await this.provider.sendEmail({
      to,
      subject: 'Bem-vindo ao Engrama! 🚀',
      html,
      text,
    });
    return result.success;
  }
}
