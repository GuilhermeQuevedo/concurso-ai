import type { IEmailProvider, SendEmailOptions, EmailResult } from './email.interfaces.js';

export class ConsoleEmailProvider implements IEmailProvider {
  isConfigured(): boolean {
    return true;
  }

  async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    const urlMatch = options.html.match(/href="([^"]+)"/);
    const primaryUrl = urlMatch ? urlMatch[1] : null;

    console.log('\n================== 📧 [DEV EMAIL SIMULATOR] ==================');
    console.log(`Para: ${options.to}`);
    console.log(`Assunto: ${options.subject}`);
    if (primaryUrl) {
      console.log(`🔗 Link de Ação: ${primaryUrl}`);
    }
    console.log('--------------------------------------------------------------');
    console.log(options.text ?? options.html.replace(/<[^>]+>/g, ' ').slice(0, 300));
    console.log('==============================================================\n');

    return {
      success: true,
      messageId: `dev-simulated-${Date.now()}`,
      previewUrl: primaryUrl ?? undefined,
    };
  }
}
