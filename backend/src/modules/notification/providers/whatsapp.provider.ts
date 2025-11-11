import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface WhatsAppConfig {
  provider: 'whatsapp_business' | '360dialog' | 'twilio' | 'local';
  accessToken: string;
  phoneNumberId?: string;
  accountId?: string;
  apiVersion: string;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
}

export interface WhatsAppMessage {
  to: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contacts' | 'interactive';
  text?: {
    body: string;
    preview_url?: boolean;
  };
  image?: {
    link?: string;
    id?: string;
    caption?: string;
  };
  document?: {
    link?: string;
    id?: string;
    caption?: string;
    filename?: string;
  };
  audio?: {
    link?: string;
    id?: string;
  };
  video?: {
    link?: string;
    id?: string;
    caption?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  contacts?: Array<{
    name: {
      formatted_name: string;
      first_name?: string;
      last_name?: string;
    };
    phones?: Array<{
      phone: string;
      type?: string;
    }>;
  }>;
  interactive?: {
    type: 'button' | 'list';
    header?: {
      type: 'text';
      text: string;
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: any; // يختلف حسب النوع
  };
  metadata?: Record<string, any>;
}

export interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  provider: string;
  conversationId?: string;
  cost?: number;
  error?: string;
  response?: any;
}

@Injectable()
export class WhatsAppProvider {
  private readonly logger = new Logger(WhatsAppProvider.name);
  private readonly config: WhatsAppConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = this.loadConfig();
  }

  /**
   * إرسال رسالة WhatsApp
   */
  async sendWhatsApp(message: WhatsAppMessage): Promise<WhatsAppResult> {
    try {
      this.logger.log(`إرسال WhatsApp إلى: ${message.to} - نوع: ${message.type}`);

      switch (this.config.provider) {
        case 'whatsapp_business':
          return this.sendViaWhatsAppBusiness(message);
        case '360dialog':
          return this.sendVia360Dialog(message);
        case 'twilio':
          return this.sendViaTwilio(message);
        case 'local':
          return this.sendViaLocal(message);
        default:
          throw new Error(`مزود WhatsApp غير مدعوم: ${this.config.provider}`);
      }
    } catch (error) {
      this.logger.error('فشل في إرسال WhatsApp', error);
      return {
        success: false,
        provider: this.config.provider,
        error: error.message,
      };
    }
  }

  /**
   * إرسال رسالة باستخدام WhatsApp Business API
   */
  private async sendViaWhatsAppBusiness(message: WhatsAppMessage): Promise<WhatsAppResult> {
    try {
      if (!this.config.phoneNumberId) {
        throw new Error('معرف رقم الهاتف غير مكون');
      }

      const url = `${this.config.baseUrl}/${this.config.phoneNumberId}/messages`;

      const { to, type, ...messageContent } = message;
      const messageData = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.formatPhoneNumber(to),
        type,
        ...messageContent,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`WhatsApp Business API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();

      return {
        success: true,
        messageId: result.messages?.[0]?.id,
        provider: 'whatsapp_business',
        conversationId: result.conversation?.id,
        response: result,
      };
    } catch (error) {
      throw new Error(`WhatsApp Business API error: ${error.message}`);
    }
  }

  /**
   * إرسال رسالة باستخدام 360Dialog
   */
  private async sendVia360Dialog(message: WhatsAppMessage): Promise<WhatsAppResult> {
    try {
      const url = `${this.config.baseUrl}/messages`;

      const { to, type, ...messageContent } = message;
      const messageData = {
        recipient_type: 'individual',
        to: this.formatPhoneNumber(to),
        type,
        ...messageContent,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'D360-API-KEY': this.config.accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`360Dialog API error: ${response.status} - ${errorData}`);
      }

      const result = await response.json();

      return {
        success: true,
        messageId: result.messages?.[0]?.id,
        provider: '360dialog',
        response: result,
      };
    } catch (error) {
      throw new Error(`360Dialog error: ${error.message}`);
    }
  }

  /**
   * إرسال رسالة باستخدام Twilio
   */
  private async sendViaTwilio(message: WhatsAppMessage): Promise<WhatsAppResult> {
    try {
      if (!this.config.accountId) {
        throw new Error('معرف حساب Twilio غير مكون');
      }

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountId}/Messages.json`;

      const messageData = {
        From: `whatsapp:${this.config.phoneNumberId}`,
        To: `whatsapp:${this.formatPhoneNumber(message.to)}`,
        Body: message.text?.body || '',
      };

      const auth = Buffer.from(`${this.config.accountId}:${this.config.accessToken}`).toString('base64');

      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(messageData).toString(),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Twilio WhatsApp API error: ${response.status} - ${errorData}`);
      }

      const result = await response.json();

      return {
        success: true,
        messageId: result.sid,
        provider: 'twilio',
        cost: parseFloat(result.price || '0'),
        response: result,
      };
    } catch (error) {
      throw new Error(`Twilio WhatsApp error: ${error.message}`);
    }
  }

  /**
   * إرسال رسالة محلية (محاكاة)
   */
  private async sendViaLocal(message: WhatsAppMessage): Promise<WhatsAppResult> {
    try {
      // للاختبار والتطوير - لا يرسل رسائل حقيقية
      this.logger.log(`[LOCAL WhatsApp] إرسال إلى: ${message.to}`);
      this.logger.log(`[LOCAL WhatsApp] النوع: ${message.type}`);
      if (message.text) {
        this.logger.log(`[LOCAL WhatsApp] النص: ${message.text.body}`);
      }

      // محاكاة الإرسال
      await new Promise(resolve => setTimeout(resolve, 50));

      return {
        success: true,
        messageId: `local_wa_${Date.now()}`,
        provider: 'local',
        response: {
          message: 'Local WhatsApp sent (simulation)',
          type: message.type,
          recipient: message.to,
        },
      };
    } catch (error) {
      throw new Error(`Local WhatsApp error: ${error.message}`);
    }
  }

  /**
   * إنشاء رسالة نصية بسيطة
   */
  createTextMessage(to: string, body: string, previewUrl: boolean = false): WhatsAppMessage {
    return {
      to,
      type: 'text',
      text: {
        body,
        preview_url: previewUrl,
      },
    };
  }

  /**
   * إنشاء رسالة مع صورة
   */
  createImageMessage(to: string, imageUrl: string, caption?: string): WhatsAppMessage {
    return {
      to,
      type: 'image',
      image: {
        link: imageUrl,
        caption,
      },
    };
  }

  /**
   * إنشاء رسالة مع مستند
   */
  createDocumentMessage(to: string, documentUrl: string, filename?: string, caption?: string): WhatsAppMessage {
    return {
      to,
      type: 'document',
      document: {
        link: documentUrl,
        filename,
        caption,
      },
    };
  }

  /**
   * إنشاء رسالة تفاعلية مع أزرار
   */
  createButtonMessage(
    to: string,
    body: string,
    buttons: Array<{ id: string; title: string }>,
    header?: string,
    footer?: string,
  ): WhatsAppMessage {
    return {
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        ...(header && {
          header: {
            type: 'text',
            text: header,
          },
        }),
        body: {
          text: body,
        },
        ...(footer && {
          footer: {
            text: footer,
          },
        }),
        action: {
          buttons: buttons.map(btn => ({
            type: 'reply',
            reply: {
              id: btn.id,
              title: btn.title,
            },
          })),
        },
      },
    };
  }

  /**
   * إنشاء رسالة تفاعلية مع قائمة
   */
  createListMessage(
    to: string,
    body: string,
    buttonText: string,
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>,
    header?: string,
    footer?: string,
  ): WhatsAppMessage {
    return {
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        ...(header && {
          header: {
            type: 'text',
            text: header,
          },
        }),
        body: {
          text: body,
        },
        ...(footer && {
          footer: {
            text: footer,
          },
        }),
        action: {
          button: buttonText,
          sections,
        },
      },
    };
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
  private loadConfig(): WhatsAppConfig {
    const provider = this.configService.get<string>('WHATSAPP_PROVIDER', 'whatsapp_business') as WhatsAppConfig['provider'];

    const baseConfig = {
      provider,
      accessToken: this.configService.get<string>('WHATSAPP_ACCESS_TOKEN', ''),
      timeout: 30000, // 30 ثانية
      retryAttempts: 3,
    };

    switch (provider) {
      case 'whatsapp_business':
        return {
          ...baseConfig,
          apiVersion: 'v18.0',
          baseUrl: 'https://graph.facebook.com',
          phoneNumberId: this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID'),
        };

      case '360dialog':
        return {
          ...baseConfig,
          apiVersion: 'v1',
          baseUrl: 'https://waba-v2.360dialog.io',
        };

      case 'twilio':
        return {
          ...baseConfig,
          apiVersion: 'v1',
          accountId: this.configService.get<string>('TWILIO_ACCOUNT_SID'),
          phoneNumberId: this.configService.get<string>('WHATSAPP_FROM_NUMBER'),
          baseUrl: '',
        };

      case 'local':
        return {
          ...baseConfig,
          apiVersion: 'v1',
          baseUrl: '',
        };

      default:
        throw new Error(`مزود WhatsApp غير مدعوم: ${provider}`);
    }
  }

  /**
   * التحقق من صحة الإعدادات
   */
  validateConfig(): boolean {
    try {
      switch (this.config.provider) {
        case 'whatsapp_business':
          return !!(this.config.accessToken && this.config.phoneNumberId);
        case '360dialog':
          return !!this.config.accessToken;
        case 'twilio':
          return !!(this.config.accessToken && this.config.accountId && this.config.phoneNumberId);
        case 'local':
          return true;
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
    supportsTemplates: boolean;
    supportsInteractive: boolean;
    supportsMedia: boolean;
    maxMessageLength: number;
    costPerMessage: string;
    deliveryTime: string;
  } {
    switch (this.config.provider) {
      case 'whatsapp_business':
        return {
          name: 'WhatsApp Business API',
          supportsTemplates: true,
          supportsInteractive: true,
          supportsMedia: true,
          maxMessageLength: 4096,
          costPerMessage: '$0.005 - $0.05',
          deliveryTime: 'Instant - 30 minutes',
        };

      case '360dialog':
        return {
          name: '360Dialog',
          supportsTemplates: true,
          supportsInteractive: true,
          supportsMedia: true,
          maxMessageLength: 4096,
          costPerMessage: '$0.005 - $0.05',
          deliveryTime: 'Instant - 30 minutes',
        };

      case 'twilio':
        return {
          name: 'Twilio WhatsApp',
          supportsTemplates: false,
          supportsInteractive: false,
          supportsMedia: true,
          maxMessageLength: 4096,
          costPerMessage: '$0.005',
          deliveryTime: 'Instant - 30 minutes',
        };

      case 'local':
        return {
          name: 'Local WhatsApp (Testing)',
          supportsTemplates: false,
          supportsInteractive: false,
          supportsMedia: false,
          maxMessageLength: 4096,
          costPerMessage: 'Free (simulation)',
          deliveryTime: 'Instant',
        };

      default:
        return {
          name: 'Unknown',
          supportsTemplates: false,
          supportsInteractive: false,
          supportsMedia: false,
          maxMessageLength: 4096,
          costPerMessage: 'Unknown',
          deliveryTime: 'Unknown',
        };
    }
  }

  /**
   * تقدير التكلفة
   */
  estimateCost(message: WhatsAppMessage): number {
    switch (this.config.provider) {
      case 'whatsapp_business':
      case '360dialog':
        return 0.03; // متوسط التكلفة للرسالة
      case 'twilio':
        return 0.005; // تكلفة ثابتة
      case 'local':
        return 0; // مجاني
      default:
        return 0;
    }
  }

  /**
   * التحقق من حالة الرسالة
   */
  async checkMessageStatus(messageId: string): Promise<any> {
    try {
      switch (this.config.provider) {
        case 'whatsapp_business':
          const url = `${this.config.baseUrl}/${this.config.phoneNumberId}/messages/${messageId}`;
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${this.config.accessToken}`,
            },
          });

          if (response.ok) {
            return await response.json();
          }
          break;

        case '360dialog':
          // 360Dialog لا يدعم التحقق من حالة الرسالة بشكل مباشر
          break;

        case 'twilio':
          // Twilio يدعم التحقق من حالة الرسالة
          break;
      }

      return { status: 'unknown' };
    } catch (error) {
      this.logger.error(`فشل في التحقق من حالة الرسالة: ${messageId}`, error);
      return { status: 'error', error: error.message };
    }
  }
}
