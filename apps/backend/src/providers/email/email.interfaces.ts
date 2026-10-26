export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  error?: string;
}

export interface IEmailProvider {
  sendEmail(options: SendEmailOptions): Promise<EmailResult>;
  isConfigured(): boolean;
}
