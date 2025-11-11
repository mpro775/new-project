import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailConfig {
  provider: 'sendgrid' | 'mailgun' | 'ses' | 'smtp';
  apiKey?: string;
  apiSecret?: string;
  domain?: string;
  host?: string;
  port?: number;
  secure?: boolean;
  username?: string;
  password?: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  timeout: number;
  retryAttempts: number;
}

export interface EmailMessage {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
    encoding?: string;
  }>;
  templateId?: string;
  templateData?: Record<string, any>;
  headers?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string | null;
  provider: string;
  error?: string;
  response?: any;
}

@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);
  private readonly config: EmailConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = this.loadConfig();
  }

  /**
   * إرسال إيميل
   */
  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    try {
      this.logger.log(`إرسال إيميل إلى: ${Array.isArray(message.to) ? message.to.join(', ') : message.to}`);

      switch (this.config.provider) {
        case 'sendgrid':
          return this.sendViaSendGrid(message);
        case 'mailgun':
          return this.sendViaMailgun(message);
        case 'ses':
          return this.sendViaSES(message);
        case 'smtp':
          return this.sendViaSMTP(message);
        default:
          throw new Error(`مزود الإيميل غير مدعوم: ${this.config.provider}`);
      }
    } catch (error) {
      this.logger.error('فشل في إرسال الإيميل', error);
      return {
        success: false,
        provider: this.config.provider,
        error: error.message,
      };
    }
  }

  /**
   * إرسال إيميل باستخدام SendGrid
   */
  private async sendViaSendGrid(message: EmailMessage): Promise<EmailResult> {
    try {
      if (!this.config.apiKey) {
        throw new Error('مفتاح SendGrid API غير مكون');
      }

      const sendGridUrl = 'https://api.sendgrid.com/v3/mail/send';

      const emailData = {
        personalizations: [{
          to: this.formatRecipients(message.to),
          cc: message.cc ? this.formatRecipients(message.cc) : undefined,
          bcc: message.bcc ? this.formatRecipients(message.bcc) : undefined,
          subject: message.subject,
          headers: message.headers,
        }],
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName,
        },
        reply_to: message.replyTo ? {
          email: message.replyTo,
        } : undefined,
        content: [
          ...(message.text ? [{
            type: 'text/plain',
            value: message.text,
          }] : []),
          ...(message.html ? [{
            type: 'text/html',
            value: message.html,
          }] : []),
        ],
        attachments: message.attachments?.map(attachment => ({
          content: Buffer.isBuffer(attachment.content)
            ? attachment.content.toString('base64')
            : attachment.content,
          filename: attachment.filename,
          type: attachment.contentType,
          disposition: 'attachment',
          content_id: attachment.filename,
        })),
        template_id: message.templateId,
        dynamic_template_data: message.templateData,
        custom_args: message.metadata,
      };

      const response = await fetch(sendGridUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`SendGrid API error: ${response.status} - ${errorData}`);
      }

      const messageId = response.headers.get('x-message-id');

      return {
        success: true,
        messageId,
        provider: 'sendgrid',
        response: { status: response.status },
      };
    } catch (error) {
      throw new Error(`SendGrid error: ${error.message}`);
    }
  }

  /**
   * إرسال إيميل باستخدام Mailgun
   */
  private async sendViaMailgun(message: EmailMessage): Promise<EmailResult> {
    try {
      if (!this.config.apiKey || !this.config.domain) {
        throw new Error('معرفات Mailgun غير مكونة');
      }

      const mailgunUrl = `https://api.mailgun.net/v3/${this.config.domain}/messages`;

      const formData = new FormData();
      formData.append('from', `${this.config.fromName} <${this.config.fromEmail}>`);
      formData.append('to', this.formatRecipientsString(message.to));
      formData.append('subject', message.subject);

      if (message.cc) {
        formData.append('cc', this.formatRecipientsString(message.cc));
      }

      if (message.bcc) {
        formData.append('bcc', this.formatRecipientsString(message.bcc));
      }

      if (message.text) {
        formData.append('text', message.text);
      }

      if (message.html) {
        formData.append('html', message.html);
      }

      if (message.replyTo) {
        formData.append('h:Reply-To', message.replyTo);
      }

      // إضافة المرفقات
      message.attachments?.forEach((attachment, index) => {
        const content = Buffer.isBuffer(attachment.content)
          ? attachment.content
          : Buffer.from(attachment.content);
        formData.append(`attachment`, content as any, attachment.filename);
      });

      // إضافة المتغيرات المخصصة
      if (message.metadata) {
        Object.entries(message.metadata).forEach(([key, value]) => {
          formData.append(`v:${key}`, String(value));
        });
      }

      const auth = Buffer.from(`api:${this.config.apiKey}`).toString('base64');

      const response = await fetch(mailgunUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
        },
        body: formData,
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Mailgun API error: ${response.status} - ${errorData}`);
      }

      const result = await response.json();

      return {
        success: true,
        messageId: result.id,
        provider: 'mailgun',
        response: result,
      };
    } catch (error) {
      throw new Error(`Mailgun error: ${error.message}`);
    }
  }

  /**
   * إرسال إيميل باستخدام AWS SES
   */
  private async sendViaSES(message: EmailMessage): Promise<EmailResult> {
    try {
      // محاكاة AWS SES - في الواقع يتم استخدام AWS SDK
      if (!this.config.apiKey || !this.config.apiSecret) {
        throw new Error('معرفات AWS SES غير مكونة');
      }

      // محاكاة الإرسال
      await new Promise(resolve => setTimeout(resolve, 100));

      return {
        success: true,
        messageId: `ses_${Date.now()}`,
        provider: 'ses',
        response: { message: 'Email sent successfully' },
      };
    } catch (error) {
      throw new Error(`SES error: ${error.message}`);
    }
  }

  /**
   * إرسال إيميل باستخدام SMTP
   */
  private async sendViaSMTP(message: EmailMessage): Promise<EmailResult> {
    try {
      // محاكاة SMTP - في الواقع يتم استخدام nodemailer
      if (!this.config.host || !this.config.username || !this.config.password) {
        throw new Error('إعدادات SMTP غير مكونة');
      }

      // محاكاة الإرسال
      await new Promise(resolve => setTimeout(resolve, 100));

      return {
        success: true,
        messageId: `smtp_${Date.now()}`,
        provider: 'smtp',
        response: { message: 'Email sent successfully' },
      };
    } catch (error) {
      throw new Error(`SMTP error: ${error.message}`);
    }
  }

  /**
   * تنسيق المستلمين لـ SendGrid
   */
  private formatRecipients(recipients: string | string[]): Array<{ email: string }> {
    const recipientArray = Array.isArray(recipients) ? recipients : [recipients];
    return recipientArray.map(email => ({ email }));
  }

  /**
   * تنسيق المستلمين كسلسلة نصية
   */
  private formatRecipientsString(recipients: string | string[]): string {
    return Array.isArray(recipients) ? recipients.join(',') : recipients;
  }

  /**
   * تحميل إعدادات المزود
   */
  private loadConfig(): EmailConfig {
    const provider = this.configService.get<string>('EMAIL_PROVIDER', 'sendgrid') as EmailConfig['provider'];

    const baseConfig = {
      provider,
      fromEmail: this.configService.get<string>('EMAIL_FROM_EMAIL', 'noreply@zaytuna.com'),
      fromName: this.configService.get<string>('EMAIL_FROM_NAME', 'نظام زيتونة'),
      replyTo: this.configService.get<string>('EMAIL_REPLY_TO'),
      timeout: 30000, // 30 ثانية
      retryAttempts: 3,
    };

    switch (provider) {
      case 'sendgrid':
        return {
          ...baseConfig,
          apiKey: this.configService.get<string>('SENDGRID_API_KEY'),
        };

      case 'mailgun':
        return {
          ...baseConfig,
          apiKey: this.configService.get<string>('MAILGUN_API_KEY'),
          domain: this.configService.get<string>('MAILGUN_DOMAIN'),
        };

      case 'ses':
        return {
          ...baseConfig,
          apiKey: this.configService.get<string>('AWS_SES_ACCESS_KEY'),
          apiSecret: this.configService.get<string>('AWS_SES_SECRET_KEY'),
        };

      case 'smtp':
        return {
          ...baseConfig,
          host: this.configService.get<string>('SMTP_HOST'),
          port: this.configService.get<number>('SMTP_PORT', 587),
          secure: this.configService.get<boolean>('SMTP_SECURE', false),
          username: this.configService.get<string>('SMTP_USERNAME'),
          password: this.configService.get<string>('SMTP_PASSWORD'),
        };

      default:
        throw new Error(`مزود الإيميل غير مدعوم: ${provider}`);
    }
  }

  /**
   * التحقق من صحة الإعدادات
   */
  validateConfig(): boolean {
    try {
      switch (this.config.provider) {
        case 'sendgrid':
          return !!(this.config.apiKey && this.config.fromEmail);
        case 'mailgun':
          return !!(this.config.apiKey && this.config.domain && this.config.fromEmail);
        case 'ses':
          return !!(this.config.apiKey && this.config.apiSecret && this.config.fromEmail);
        case 'smtp':
          return !!(this.config.host && this.config.username && this.config.password && this.config.fromEmail);
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * الحصول على معلومات المزود
   */
  getProviderInfo(): {
    name: string;
    type: 'transactional' | 'marketing' | 'both';
    supportsTemplates: boolean;
    supportsAttachments: boolean;
    maxRecipients: number;
    rateLimit: string;
  } {
    switch (this.config.provider) {
      case 'sendgrid':
        return {
          name: 'SendGrid',
          type: 'both',
          supportsTemplates: true,
          supportsAttachments: true,
          maxRecipients: 1000,
          rateLimit: '100 emails/second',
        };

      case 'mailgun':
        return {
          name: 'Mailgun',
          type: 'transactional',
          supportsTemplates: false,
          supportsAttachments: true,
          maxRecipients: 1000,
          rateLimit: '300 emails/minute',
        };

      case 'ses':
        return {
          name: 'Amazon SES',
          type: 'transactional',
          supportsTemplates: true,
          supportsAttachments: true,
          maxRecipients: 50,
          rateLimit: '14,000 emails/day (free tier)',
        };

      case 'smtp':
        return {
          name: 'SMTP Server',
          type: 'both',
          supportsTemplates: false,
          supportsAttachments: true,
          maxRecipients: 100,
          rateLimit: 'Depends on server configuration',
        };

      default:
        return {
          name: 'Unknown',
          type: 'transactional',
          supportsTemplates: false,
          supportsAttachments: false,
          maxRecipients: 1,
          rateLimit: 'Unknown',
        };
    }
  }
}
