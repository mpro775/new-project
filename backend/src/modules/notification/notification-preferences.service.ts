import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface UserNotificationPreferences {
  userId: string;
  preferences: NotificationPreference[];
}

export interface NotificationPreference {
  notificationType: 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app';
  event: string;
  enabled: boolean;
  frequency?: 'immediate' | 'daily' | 'weekly' | 'monthly';
  quietHoursStart?: string; // HH:MM
  quietHoursEnd?: string; // HH:MM
}

export interface DefaultPreferences {
  [event: string]: {
    [type: string]: {
      enabled: boolean;
      frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
      priority: 'low' | 'normal' | 'high' | 'urgent';
    };
  };
}

@Injectable()
export class NotificationPreferencesService {
  private readonly logger = new Logger(NotificationPreferencesService.name);

  // التفضيلات الافتراضية للأحداث المختلفة
  private readonly defaultPreferences: DefaultPreferences = {
    // أحداث المبيعات
    'sale_created': {
      'email': { enabled: true, frequency: 'immediate', priority: 'high' },
      'sms': { enabled: false, frequency: 'immediate', priority: 'high' },
      'whatsapp': { enabled: false, frequency: 'immediate', priority: 'high' },
      'push': { enabled: true, frequency: 'immediate', priority: 'high' },
      'in_app': { enabled: true, frequency: 'immediate', priority: 'high' },
    },
    'payment_received': {
      'email': { enabled: true, frequency: 'immediate', priority: 'high' },
      'sms': { enabled: true, frequency: 'immediate', priority: 'high' },
      'whatsapp': { enabled: false, frequency: 'immediate', priority: 'high' },
      'push': { enabled: true, frequency: 'immediate', priority: 'high' },
      'in_app': { enabled: true, frequency: 'immediate', priority: 'high' },
    },

    // أحداث المخزون
    'stock_low': {
      'email': { enabled: true, frequency: 'immediate', priority: 'urgent' },
      'sms': { enabled: false, frequency: 'immediate', priority: 'urgent' },
      'whatsapp': { enabled: false, frequency: 'immediate', priority: 'urgent' },
      'push': { enabled: true, frequency: 'immediate', priority: 'urgent' },
      'in_app': { enabled: true, frequency: 'immediate', priority: 'urgent' },
    },
    'stock_out': {
      'email': { enabled: true, frequency: 'immediate', priority: 'urgent' },
      'sms': { enabled: true, frequency: 'immediate', priority: 'urgent' },
      'whatsapp': { enabled: false, frequency: 'immediate', priority: 'urgent' },
      'push': { enabled: true, frequency: 'immediate', priority: 'urgent' },
      'in_app': { enabled: true, frequency: 'immediate', priority: 'urgent' },
    },

    // أحداث العملاء
    'customer_birthday': {
      'email': { enabled: true, frequency: 'daily', priority: 'normal' },
      'sms': { enabled: false, frequency: 'daily', priority: 'normal' },
      'whatsapp': { enabled: true, frequency: 'daily', priority: 'normal' },
      'push': { enabled: false, frequency: 'daily', priority: 'normal' },
      'in_app': { enabled: true, frequency: 'daily', priority: 'normal' },
    },
    'loyalty_tier_upgraded': {
      'email': { enabled: true, frequency: 'immediate', priority: 'high' },
      'sms': { enabled: false, frequency: 'immediate', priority: 'high' },
      'whatsapp': { enabled: true, frequency: 'immediate', priority: 'high' },
      'push': { enabled: true, frequency: 'immediate', priority: 'high' },
      'in_app': { enabled: true, frequency: 'immediate', priority: 'high' },
    },

    // أحداث المحاسبة
    'period_closed': {
      'email': { enabled: true, frequency: 'weekly', priority: 'normal' },
      'sms': { enabled: false, frequency: 'weekly', priority: 'normal' },
      'whatsapp': { enabled: false, frequency: 'weekly', priority: 'normal' },
      'push': { enabled: false, frequency: 'weekly', priority: 'normal' },
      'in_app': { enabled: true, frequency: 'weekly', priority: 'normal' },
    },

    // أحداث النظام
    'user_login_failed': {
      'email': { enabled: true, frequency: 'immediate', priority: 'urgent' },
      'sms': { enabled: false, frequency: 'immediate', priority: 'urgent' },
      'whatsapp': { enabled: false, frequency: 'immediate', priority: 'urgent' },
      'push': { enabled: false, frequency: 'immediate', priority: 'urgent' },
      'in_app': { enabled: true, frequency: 'immediate', priority: 'urgent' },
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * الحصول على تفضيلات المستخدم
   */
  async getUserPreferences(userId: string): Promise<NotificationPreference[]> {
    try {
      const preferences = await this.prisma.notificationPreference.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });

      // إذا لم تكن هناك تفضيلات مخصصة، إرجاع الافتراضية
      if (preferences.length === 0) {
        return this.getDefaultPreferences();
      }

      // تحويل البيانات من قاعدة البيانات
      return preferences.map(pref => ({
        notificationType: pref.notificationType as any,
        event: pref.event,
        enabled: pref.enabled,
        frequency: pref.frequency as any,
        quietHoursStart: pref.quietHoursStart || undefined,
        quietHoursEnd: pref.quietHoursEnd || undefined,
      }));
    } catch (error) {
      this.logger.error(`فشل في الحصول على تفضيلات المستخدم: ${userId}`, error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * تحديث تفضيلات المستخدم
   */
  async updateUserPreferences(
    userId: string,
    preferences: NotificationPreference[],
    updatedBy?: string,
  ): Promise<void> {
    try {
      this.logger.log(`تحديث تفضيلات المستخدم: ${userId}`);

      for (const pref of preferences) {
        await this.prisma.notificationPreference.upsert({
          where: {
            userId_notificationType_event: {
              userId,
              notificationType: pref.notificationType,
              event: pref.event,
            },
          },
          update: {
            enabled: pref.enabled,
            frequency: pref.frequency,
            quietHoursStart: pref.quietHoursStart,
            quietHoursEnd: pref.quietHoursEnd,
            updatedAt: new Date(),
          },
          create: {
            userId,
            notificationType: pref.notificationType,
            event: pref.event,
            enabled: pref.enabled,
            frequency: pref.frequency || 'immediate',
            quietHoursStart: pref.quietHoursStart,
            quietHoursEnd: pref.quietHoursEnd,
          },
        });
      }

      // تسجيل في سجل التدقيق
      await this.auditService.log({
        action: 'USER_PREFERENCES_UPDATED',
        entity: 'NotificationPreference',
        entityId: userId,
        details: {
          userId,
          preferencesCount: preferences.length,
          updatedBy,
        },
        module: 'notification',
        category: 'user_settings',
      });

      this.logger.log(`تم تحديث تفضيلات المستخدم بنجاح: ${userId}`);
    } catch (error) {
      this.logger.error(`فشل في تحديث تفضيلات المستخدم: ${userId}`, error);
      throw error;
    }
  }

  /**
   * إعادة تعيين تفضيلات المستخدم للافتراضية
   */
  async resetUserPreferences(userId: string, resetBy?: string): Promise<void> {
    try {
      this.logger.log(`إعادة تعيين تفضيلات المستخدم للافتراضية: ${userId}`);

      // حذف جميع التفضيلات المخصصة
      await this.prisma.notificationPreference.deleteMany({
        where: { userId },
      });

      // تسجيل في سجل التدقيق
      await this.auditService.log({
        action: 'USER_PREFERENCES_RESET',
        entity: 'NotificationPreference',
        entityId: userId,
        details: {
          userId,
          resetBy,
        },
        module: 'notification',
        category: 'user_settings',
      });

      this.logger.log(`تم إعادة تعيين تفضيلات المستخدم بنجاح: ${userId}`);
    } catch (error) {
      this.logger.error(`فشل في إعادة تعيين تفضيلات المستخدم: ${userId}`, error);
      throw error;
    }
  }

  /**
   * الحصول على التفضيلات الافتراضية
   */
  getDefaultPreferences(): NotificationPreference[] {
    const preferences: NotificationPreference[] = [];

    for (const [event, eventPrefs] of Object.entries(this.defaultPreferences)) {
      for (const [type, pref] of Object.entries(eventPrefs)) {
        preferences.push({
          notificationType: type as any,
          event,
          enabled: pref.enabled,
          frequency: pref.frequency,
        });
      }
    }

    return preferences;
  }

  /**
   * التحقق من إمكانية إرسال إشعار لمستخدم
   */
  async canSendNotification(
    userId: string,
    notificationType: string,
    event: string,
  ): Promise<boolean> {
    try {
      // الحصول على التفضيل المخصص أو الافتراضي
      const preference = await this.prisma.notificationPreference.findUnique({
        where: {
          userId_notificationType_event: {
            userId,
            notificationType,
            event,
          },
        },
      });

      if (preference) {
        // فحص إذا كان الإشعار مفعلاً
        if (!preference.enabled) {
          return false;
        }

        // فحص ساعات الهدوء
        if (preference.quietHoursStart && preference.quietHoursEnd) {
          if (this.isInQuietHours(preference.quietHoursStart, preference.quietHoursEnd)) {
            return false;
          }
        }

        return true;
      }

      // إذا لم يكن هناك تفضيل مخصص، استخدم الافتراضي
      const defaultPref = this.defaultPreferences[event]?.[notificationType];
      return defaultPref?.enabled || false;

    } catch (error) {
      this.logger.error(`فشل في التحقق من إمكانية إرسال الإشعار: ${userId}`, error);
      // في حالة الخطأ، لا نرسل الإشعار
      return false;
    }
  }

  /**
   * الحصول على إحصائيات تفضيلات الإشعارات
   */
  async getPreferencesStats(): Promise<{
    totalUsers: number;
    usersWithCustomPreferences: number;
    mostPopularPreferences: Array<{
      type: string;
      event: string;
      enabledCount: number;
      disabledCount: number;
    }>;
    quietHoursUsage: number;
  }> {
    try {
      const [
        totalUsers,
        customPreferences,
        allPreferences,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.notificationPreference.findMany(),
        this.prisma.notificationPreference.findMany({
          select: {
            notificationType: true,
            event: true,
            enabled: true,
            quietHoursStart: true,
          },
        }),
      ]);

      const usersWithCustomPreferences = new Set(
        customPreferences.map(p => p.userId)
      ).size;

      // حساب التفضيلات الأكثر شيوعاً
      const preferenceStats: Record<string, { enabled: number; disabled: number }> = {};

      allPreferences.forEach(pref => {
        const key = `${pref.notificationType}:${pref.event}`;
        if (!preferenceStats[key]) {
          preferenceStats[key] = { enabled: 0, disabled: 0 };
        }

        if (pref.enabled) {
          preferenceStats[key].enabled++;
        } else {
          preferenceStats[key].disabled++;
        }
      });

      const mostPopularPreferences = Object.entries(preferenceStats)
        .map(([key, stats]) => {
          const [type, event] = key.split(':');
          return {
            type,
            event,
            enabledCount: stats.enabled,
            disabledCount: stats.disabled,
          };
        })
        .sort((a, b) => (b.enabledCount + b.disabledCount) - (a.enabledCount + a.disabledCount))
        .slice(0, 10);

      // حساب استخدام ساعات الهدوء
      const quietHoursUsage = allPreferences.filter(pref => pref.quietHoursStart).length;

      return {
        totalUsers,
        usersWithCustomPreferences,
        mostPopularPreferences,
        quietHoursUsage,
      };
    } catch (error) {
      this.logger.error('فشل في حساب إحصائيات التفضيلات', error);
      return {
        totalUsers: 0,
        usersWithCustomPreferences: 0,
        mostPopularPreferences: [],
        quietHoursUsage: 0,
      };
    }
  }

  /**
   * تصدير تفضيلات المستخدم
   */
  async exportUserPreferences(userId: string): Promise<any> {
    try {
      const preferences = await this.getUserPreferences(userId);

      return {
        userId,
        preferences,
        exportedAt: new Date(),
        version: '1.0',
      };
    } catch (error) {
      this.logger.error(`فشل في تصدير تفضيلات المستخدم: ${userId}`, error);
      throw error;
    }
  }

  /**
   * استيراد تفضيلات المستخدم
   */
  async importUserPreferences(
    userId: string,
    preferencesData: any,
    importedBy?: string,
  ): Promise<void> {
    try {
      if (!preferencesData.preferences || !Array.isArray(preferencesData.preferences)) {
        throw new Error('بيانات التفضيلات غير صحيحة');
      }

      await this.updateUserPreferences(userId, preferencesData.preferences, importedBy);

      // تسجيل في سجل التدقيق
      await this.auditService.log({
        action: 'USER_PREFERENCES_IMPORTED',
        entity: 'NotificationPreference',
        entityId: userId,
        details: {
          userId,
          preferencesCount: preferencesData.preferences.length,
          importedBy,
          version: preferencesData.version,
        },
        module: 'notification',
        category: 'user_settings',
      });

      this.logger.log(`تم استيراد تفضيلات المستخدم بنجاح: ${userId}`);
    } catch (error) {
      this.logger.error(`فشل في استيراد تفضيلات المستخدم: ${userId}`, error);
      throw error;
    }
  }

  /**
   * إنشاء تفضيلات افتراضية لمستخدم جديد
   */
  async createDefaultPreferencesForUser(userId: string): Promise<void> {
    try {
      this.logger.log(`إنشاء تفضيلات افتراضية للمستخدم: ${userId}`);

      const defaultPrefs = this.getDefaultPreferences();

      for (const pref of defaultPrefs) {
        await this.prisma.notificationPreference.create({
          data: {
            userId,
            notificationType: pref.notificationType,
            event: pref.event,
            enabled: pref.enabled,
            frequency: pref.frequency || 'immediate',
            quietHoursStart: pref.quietHoursStart,
            quietHoursEnd: pref.quietHoursEnd,
          },
        });
      }

      this.logger.log(`تم إنشاء التفضيلات الافتراضية بنجاح للمستخدم: ${userId}`);
    } catch (error) {
      this.logger.error(`فشل في إنشاء التفضيلات الافتراضية للمستخدم: ${userId}`, error);
      // لا نرمي خطأ هنا لأن إنشاء المستخدم يجب أن ينجح حتى لو فشلت التفضيلات
    }
  }

  /**
   * تحديث التفضيلات الافتراضية لجميع المستخدمين
   */
  async updateGlobalPreferences(
    updates: Partial<DefaultPreferences>,
    updatedBy?: string,
  ): Promise<void> {
    try {
      this.logger.log('تحديث التفضيلات الافتراضية العامة');

      // دمج التحديثات مع التفضيلات الحالية
      Object.assign(this.defaultPreferences, updates);

      // تسجيل في سجل التدقيق
      await this.auditService.log({
        action: 'GLOBAL_PREFERENCES_UPDATED',
        entity: 'NotificationPreference',
        entityId: 'system',
        details: {
          updates,
          updatedBy,
        },
        module: 'notification',
        category: 'system_settings',
      });

      this.logger.log('تم تحديث التفضيلات الافتراضية العامة بنجاح');
    } catch (error) {
      this.logger.error('فشل في تحديث التفضيلات الافتراضية العامة', error);
      throw error;
    }
  }

  // ========== PRIVATE METHODS ==========

  /**
   * التحقق من أن الوقت الحالي ضمن ساعات الهدوء
   */
  private isInQuietHours(startTime: string, endTime: string): boolean {
    try {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const startMinutes = this.timeToMinutes(startTime);
      const endMinutes = this.timeToMinutes(endTime);

      if (startMinutes <= endMinutes) {
        // فترة الهدوء في نفس اليوم
        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
      } else {
        // فترة الهدوء تمتد إلى اليوم التالي
        return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * تحويل الوقت إلى دقائق
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

}
