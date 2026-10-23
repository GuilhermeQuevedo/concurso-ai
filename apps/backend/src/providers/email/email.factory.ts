import { ResendEmailProvider } from './resend-email.provider.js';
import { SmtpEmailProvider } from './smtp-email.provider.js';
import { ConsoleEmailProvider } from './console-email.provider.js';
import type { IEmailProvider } from './email.interfaces.js';

export class EmailFactory {
  static createProvider(): IEmailProvider {
    const resend = new ResendEmailProvider();
    if (resend.isConfigured()) {
      return resend;
    }

    const smtp = new SmtpEmailProvider();
    if (smtp.isConfigured()) {
      return smtp;
    }

    return new ConsoleEmailProvider();
  }
}
