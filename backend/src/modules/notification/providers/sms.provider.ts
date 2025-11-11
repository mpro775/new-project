import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SMSConfig {
  provider: 'twilio' | 'aws_sns' | 'messagebird' | 'nexmo' | 'local';
  accountSid?: string;
  authToken?: string;
  apiKey?: string;
  apiSecret?: string;
  phoneNumber: string;
  region?: string;
  timeout: number;
  retryAttempts: number;
}

export interface SMSMessage {
  to: string | string[];
  from?: string;
  message: string;
  mediaUrl?: string[];
  statusCallback?: string;
  metadata?: Record<string, any>;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  provider: string;
  cost?: number;
  error?: string;
  response?: any;
}

@Injectable()
export class SMSProvider {
  private readonly logger = new Logger(SMSProvider.name);
  private readonly config: SMSConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = this.loadConfig();
  }

  /**
   * إرسال SMS
   */
  async sendSMS(message: SMSMessage): Promise<SMSResult> {
    try {
      const recipients = Array.isArray(message.to) ? message.to : [message.to];
      this.logger.log(`إرسال SMS إلى ${recipients.length} مستلم: ${recipients.join(', ')}`);

      switch (this.config.provider) {
        case 'twilio':
          return this.sendViaTwilio(message);
        case 'aws_sns':
          return this.sendViaAWSSNS(message);
        case 'messagebird':
          return this.sendViaMessageBird(message);
        case 'nexmo':
          return this.sendViaNexmo(message);
        case 'local':
          return this.sendViaLocal(message);
        default:
          throw new Error(`مزود SMS غير مدعوم: ${this.config.provider}`);
      }
    } catch (error) {
      this.logger.error('فشل في إرسال SMS', error);
      return {
        success: false,
        provider: this.config.provider,
        error: error.message,
      };
    }
  }

  /**
   * إرسال SMS باستخدام Twilio
   */
  private async sendViaTwilio(message: SMSMessage): Promise<SMSResult> {
    try {
      if (!this.config.accountSid || !this.config.authToken) {
        throw new Error('معرفات Twilio غير مكونة');
      }

      const recipients = Array.isArray(message.to) ? message.to : [message.to];
      const results: SMSResult[] = [];

      // Twilio يدعم إرسال إلى عدة أرقام في نفس الوقت
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`;

      const formData = new FormData();
      formData.append('From', message.from || this.config.phoneNumber);
      formData.append('Body', message.message);

      if (message.mediaUrl && message.mediaUrl.length > 0) {
        message.mediaUrl.forEach(url => {
          formData.append('MediaUrl', url);
        });
      }

      if (message.statusCallback) {
        formData.append('StatusCallback', message.statusCallback);
      }

      const auth = Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString('base64');

      // إرسال إلى كل مستلم على حدة (Twilio لا يدعم إرسال جماعي في نفس الطلب)
      for (const recipient of recipients) {
        try {
          const recipientFormData = new FormData();
          recipientFormData.append('From', message.from || this.config.phoneNumber);
          recipientFormData.append('To', recipient);
          recipientFormData.append('Body', message.message);

          if (message.mediaUrl && message.mediaUrl.length > 0) {
            message.mediaUrl.forEach(url => {
              recipientFormData.append('MediaUrl', url);
            });
          }

          if (message.statusCallback) {
            recipientFormData.append('StatusCallback', message.statusCallback);
          }

          const response = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
            },
            body: recipientFormData,
            signal: AbortSignal.timeout(this.config.timeout),
          });

          if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Twilio API error: ${response.status} - ${errorData}`);
          }

          const result = await response.json();

          results.push({
            success: true,
            messageId: result.sid,
            provider: 'twilio',
            cost: parseFloat(result.price || '0'),
            response: result,
          });
        } catch (error) {
          results.push({
            success: false,
            provider: 'twilio',
            error: error.message,
          });
        }
      }

      // إرجاع نتيجة أول رسالة ناجحة أو آخر خطأ
      const successfulResult = results.find(r => r.success);
      if (successfulResult) {
        return successfulResult;
      }

      return results[results.length - 1];
    } catch (error) {
      throw new Error(`Twilio error: ${error.message}`);
    }
  }

  /**
   * إرسال SMS باستخدام AWS SNS
   */
  private async sendViaAWSSNS(message: SMSMessage): Promise<SMSResult> {
    try {
      // محاكاة AWS SNS - في الواقع يتم استخدام AWS SDK
      if (!this.config.apiKey || !this.config.apiSecret) {
        throw new Error('معرفات AWS SNS غير مكونة');
      }

      const recipients = Array.isArray(message.to) ? message.to : [message.to];

      // محاكاة الإرسال
      await new Promise(resolve => setTimeout(resolve, 100));

      return {
        success: true,
        messageId: `sns_${Date.now()}`,
        provider: 'aws_sns',
        cost: recipients.length * 0.00645, // تكلفة تقريبية للرسائل
        response: { recipients: recipients.length },
      };
    } catch (error) {
      throw new Error(`AWS SNS error: ${error.message}`);
    }
  }

  /**
   * إرسال SMS باستخدام MessageBird
   */
  private async sendViaMessageBird(message: SMSMessage): Promise<SMSResult> {
    try {
      if (!this.config.apiKey) {
        throw new Error('مفتاح MessageBird API غير مكون');
      }

      const messageBirdUrl = 'https://rest.messagebird.com/messages';

      const recipients = Array.isArray(message.to) ? message.to : [message.to];

      const messageData = {
        originator: message.from || this.config.phoneNumber,
        recipients: recipients,
        body: message.message,
        datacoding: 'plain',
      };

      const response = await fetch(messageBirdUrl, {
        method: 'POST',
        headers: {
          'Authorization': `AccessKey ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`MessageBird API error: ${response.status} - ${errorData}`);
      }

      const result = await response.json();

      return {
        success: true,
        messageId: result.id,
        provider: 'messagebird',
        cost: parseFloat(result.totalCost || '0'),
        response: result,
      };
    } catch (error) {
      throw new Error(`MessageBird error: ${error.message}`);
    }
  }

  /**
   * إرسال SMS باستخدام Nexmo (Vonage)
   */
  private async sendViaNexmo(message: SMSMessage): Promise<SMSResult> {
    try {
      if (!this.config.apiKey || !this.config.apiSecret) {
        throw new Error('معرفات Nexmo غير مكونة');
      }

      const recipients = Array.isArray(message.to) ? message.to : [message.to];

      // Nexmo يدعم إرسال إلى عدة أرقام في نفس الوقت
      const nexmoUrl = 'https://rest.nexmo.com/sms/json';

      const messageData = {
        api_key: this.config.apiKey,
        api_secret: this.config.apiSecret,
        from: message.from || this.config.phoneNumber,
        to: recipients.join(','),
        text: message.message,
        type: 'text',
      };

      const response = await fetch(nexmoUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(messageData).toString(),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Nexmo API error: ${response.status} - ${errorData}`);
      }

      const result = await response.json();

      // Nexmo يرجع مصفوفة من الرسائل
      const firstMessage = result.messages?.[0];
      if (!firstMessage || firstMessage.status !== '0') {
        throw new Error(`Nexmo message failed: ${firstMessage?.['error-text'] || 'Unknown error'}`);
      }

      return {
        success: true,
        messageId: firstMessage['message-id'],
        provider: 'nexmo',
        response: result,
      };
    } catch (error) {
      throw new Error(`Nexmo error: ${error.message}`);
    }
  }

  /**
   * إرسال SMS محلي (محاكاة)
   */
  private async sendViaLocal(message: SMSMessage): Promise<SMSResult> {
    try {
      // للاختبار والتطوير - لا يرسل رسائل حقيقية
      const recipients = Array.isArray(message.to) ? message.to : [message.to];

      this.logger.log(`[LOCAL SMS] إرسال إلى: ${recipients.join(', ')}`);
      this.logger.log(`[LOCAL SMS] الرسالة: ${message.message}`);

      // محاكاة الإرسال
      await new Promise(resolve => setTimeout(resolve, 50));

      return {
        success: true,
        messageId: `local_sms_${Date.now()}`,
        provider: 'local',
        cost: 0,
        response: {
          recipients: recipients.length,
          message: 'Local SMS sent (simulation)',
        },
      };
    } catch (error) {
      throw new Error(`Local SMS error: ${error.message}`);
    }
  }

  /**
   * تنسيق رقم الهاتف
   */
  formatPhoneNumber(phoneNumber: string): string {
    // إزالة جميع الأحرف غير الرقمية
    let cleaned = phoneNumber.replace(/\D/g, '');

    // إضافة رمز البلد إذا لم يكن موجوداً
    if (!cleaned.startsWith('+')) {
      // افتراضاً السعودية
      if (cleaned.startsWith('05')) {
        cleaned = '+966' + cleaned.substring(1);
      } else if (cleaned.startsWith('5')) {
        cleaned = '+966' + cleaned;
      } else {
        cleaned = '+966' + cleaned;
      }
    }

    return cleaned;
  }

  /**
   * التحقق من صحة رقم الهاتف
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    try {
      const formatted = this.formatPhoneNumber(phoneNumber);
      // التحقق من أن الرقم يبدأ بـ + ويحتوي على 10-15 رقم
      const phoneRegex = /^\+\d{10,15}$/;
      return phoneRegex.test(formatted);
    } catch (error) {
      return false;
    }
  }

  /**
   * تحميل إعدادات المزود
   */
  private loadConfig(): SMSConfig {
    const provider = this.configService.get<string>('SMS_PROVIDER', 'twilio') as SMSConfig['provider'];

    const baseConfig = {
      provider,
      phoneNumber: this.configService.get<string>('SMS_FROM_NUMBER', '+966500000000'),
      timeout: 30000, // 30 ثانية
      retryAttempts: 3,
    };

    switch (provider) {
      case 'twilio':
        return {
          ...baseConfig,
          accountSid: this.configService.get<string>('TWILIO_ACCOUNT_SID'),
          authToken: this.configService.get<string>('TWILIO_AUTH_TOKEN'),
        };

      case 'aws_sns':
        return {
          ...baseConfig,
          apiKey: this.configService.get<string>('AWS_SNS_ACCESS_KEY'),
          apiSecret: this.configService.get<string>('AWS_SNS_SECRET_KEY'),
          region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
        };

      case 'messagebird':
        return {
          ...baseConfig,
          apiKey: this.configService.get<string>('MESSAGEBIRD_API_KEY'),
        };

      case 'nexmo':
        return {
          ...baseConfig,
          apiKey: this.configService.get<string>('NEXMO_API_KEY'),
          apiSecret: this.configService.get<string>('NEXMO_API_SECRET'),
        };

      case 'local':
        return {
          ...baseConfig,
        };

      default:
        throw new Error(`مزود SMS غير مدعوم: ${provider}`);
    }
  }

  /**
   * التحقق من صحة الإعدادات
   */
  validateConfig(): boolean {
    try {
      switch (this.config.provider) {
        case 'twilio':
          return !!(this.config.accountSid && this.config.authToken && this.config.phoneNumber);
        case 'aws_sns':
          return !!(this.config.apiKey && this.config.apiSecret && this.config.phoneNumber);
        case 'messagebird':
          return !!(this.config.apiKey && this.config.phoneNumber);
        case 'nexmo':
          return !!(this.config.apiKey && this.config.apiSecret && this.config.phoneNumber);
        case 'local':
          return !!this.config.phoneNumber;
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
    supportsUnicode: boolean;
    supportsMedia: boolean;
    maxMessageLength: number;
    costPerMessage: string;
    deliveryTime: string;
  } {
    switch (this.config.provider) {
      case 'twilio':
        return {
          name: 'Twilio',
          supportsUnicode: true,
          supportsMedia: true,
          maxMessageLength: 160,
          costPerMessage: '$0.0075 - $0.05',
          deliveryTime: 'Instant - 5 minutes',
        };

      case 'aws_sns':
        return {
          name: 'AWS SNS',
          supportsUnicode: true,
          supportsMedia: false,
          maxMessageLength: 160,
          costPerMessage: '$0.00645 - $0.0225',
          deliveryTime: 'Instant - 10 minutes',
        };

      case 'messagebird':
        return {
          name: 'MessageBird',
          supportsUnicode: true,
          supportsMedia: true,
          maxMessageLength: 160,
          costPerMessage: '€0.04 - €0.08',
          deliveryTime: 'Instant - 5 minutes',
        };

      case 'nexmo':
        return {
          name: 'Nexmo (Vonage)',
          supportsUnicode: true,
          supportsMedia: false,
          maxMessageLength: 160,
          costPerMessage: '$0.005 - $0.05',
          deliveryTime: 'Instant - 5 minutes',
        };

      case 'local':
        return {
          name: 'Local SMS (Testing)',
          supportsUnicode: true,
          supportsMedia: false,
          maxMessageLength: 160,
          costPerMessage: 'Free (simulation)',
          deliveryTime: 'Instant',
        };

      default:
        return {
          name: 'Unknown',
          supportsUnicode: false,
          supportsMedia: false,
          maxMessageLength: 160,
          costPerMessage: 'Unknown',
          deliveryTime: 'Unknown',
        };
    }
  }

  /**
   * تقدير التكلفة
   */
  estimateCost(message: SMSMessage): number {
    const recipients = Array.isArray(message.to) ? message.to.length : 1;
    const messageLength = message.message.length;
    const messagesCount = Math.ceil(messageLength / 160); // تقدير عدد الرسائل

    switch (this.config.provider) {
      case 'twilio':
        return recipients * messagesCount * 0.03; // متوسط التكلفة
      case 'aws_sns':
        return recipients * messagesCount * 0.01; // متوسط التكلفة
      case 'messagebird':
        return recipients * messagesCount * 0.06; // متوسط التكلفة
      case 'nexmo':
        return recipients * messagesCount * 0.03; // متوسط التكلفة
      case 'local':
        return 0; // مجاني
      default:
        return 0;
    }
  }
}
