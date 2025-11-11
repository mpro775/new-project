import { Injectable, Logger, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { NotificationService } from './notification.service';
import { EmailProvider } from './providers/email.provider';
import { SMSProvider } from './providers/sms.provider';
import { WhatsAppProvider } from './providers/whatsapp.provider';

export interface QueueJob {
  id: string;
  notificationId: string;
  type: 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledAt?: Date;
  maxRetries: number;
  retryCount: number;
  data: any;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  nextRetryAt?: Date;
  lastError?: string;
}

@Injectable()
export class NotificationQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationQueueService.name);
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly processingIntervalMs = 5000; // 5 ثوانٍ
  private readonly maxConcurrentJobs = 10;
  private activeJobs = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly emailProvider: EmailProvider,
    private readonly smsProvider: SMSProvider,
    private readonly whatsappProvider: WhatsAppProvider,
  ) {}

  async onModuleInit() {
    this.logger.log('تشغيل خدمة طوابير الإشعارات');
    this.startProcessing();
  }

  async onModuleDestroy() {
    this.logger.log('إيقاف خدمة طوابير الإشعارات');
    this.stopProcessing();
  }

  /**
   * إضافة مهمة إلى الطابور
   */
  async addToQueue(notificationData: {
    notificationId: string;
    type: 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    scheduledAt?: Date;
    data: any;
  }): Promise<void> {
    try {
      // إنشاء سجل المهمة في قاعدة البيانات (محاكاة)
      // في الواقع، يمكن استخدام جدول منفصل للطوابير أو Redis

      const job: QueueJob = {
        id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        notificationId: notificationData.notificationId,
        type: notificationData.type,
        priority: notificationData.priority,
        scheduledAt: notificationData.scheduledAt,
        maxRetries: 3,
        retryCount: 0,
        data: notificationData.data,
        status: notificationData.scheduledAt ? 'queued' : 'queued',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // حفظ المهمة (محاكاة - في الواقع يتم حفظ في Redis أو قاعدة البيانات)
      await this.saveJob(job);

      this.logger.log(`تم إضافة المهمة إلى الطابور: ${job.id} - ${notificationData.type}`);
    } catch (error) {
      this.logger.error('فشل في إضافة المهمة إلى الطابور', error);
      throw error;
    }
  }

  /**
   * إلغاء مهمة من الطابور
   */
  async cancelJob(jobId: string): Promise<void> {
    try {
      const job = await this.getJob(jobId);
      if (!job) {
        throw new Error(`المهمة غير موجودة: ${jobId}`);
      }

      if (job.status === 'processing') {
        throw new Error(`لا يمكن إلغاء مهمة قيد المعالجة: ${jobId}`);
      }

      job.status = 'cancelled';
      job.updatedAt = new Date();

      await this.saveJob(job);

      // تحديث حالة الإشعار
      await this.prisma.notification.update({
        where: { id: job.notificationId },
        data: { status: 'cancelled' },
      });

      this.logger.log(`تم إلغاء المهمة: ${jobId}`);
    } catch (error) {
      this.logger.error(`فشل في إلغاء المهمة: ${jobId}`, error);
      throw error;
    }
  }

  /**
   * إعادة محاولة مهمة فاشلة
   */
  async retryJob(jobId: string): Promise<void> {
    try {
      const job = await this.getJob(jobId);
      if (!job) {
        throw new Error(`المهمة غير موجودة: ${jobId}`);
      }

      if (job.status !== 'failed') {
        throw new Error(`المهمة غير فاشلة: ${jobId} - ${job.status}`);
      }

      if (job.retryCount >= job.maxRetries) {
        throw new Error(`تم تجاوز الحد الأقصى للمحاولات: ${jobId}`);
      }

      job.status = 'queued';
      job.retryCount++;
      job.nextRetryAt = new Date(Date.now() + this.calculateBackoffDelay(job.retryCount));
      job.lastError = undefined;
      job.updatedAt = new Date();

      await this.saveJob(job);

      this.logger.log(`تم جدولة إعادة المحاولة للمهمة: ${jobId} (المحاولة ${job.retryCount})`);
    } catch (error) {
      this.logger.error(`فشل في إعادة محاولة المهمة: ${jobId}`, error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات الطابور
   */
  async getQueueStats(): Promise<{
    totalJobs: number;
    queuedJobs: number;
    processingJobs: number;
    completedJobs: number;
    failedJobs: number;
    cancelledJobs: number;
    averageProcessingTime: number;
    jobsByType: Record<string, number>;
    jobsByPriority: Record<string, number>;
  }> {
    try {
      // محاكاة - في الواقع يتم الحصول من Redis أو قاعدة البيانات
      return {
        totalJobs: 0,
        queuedJobs: 0,
        processingJobs: this.activeJobs.size,
        completedJobs: 0,
        failedJobs: 0,
        cancelledJobs: 0,
        averageProcessingTime: 0,
        jobsByType: {},
        jobsByPriority: {},
      };
    } catch (error) {
      this.logger.error('فشل في الحصول على إحصائيات الطابور', error);
      return {
        totalJobs: 0,
        queuedJobs: 0,
        processingJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        cancelledJobs: 0,
        averageProcessingTime: 0,
        jobsByType: {},
        jobsByPriority: {},
      };
    }
  }

  /**
   * تنظيف المهام القديمة
   */
  async cleanupOldJobs(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      // محاكاة حذف المهام القديمة
      this.logger.log(`تم تنظيف المهام القديمة (أقدم من ${daysOld} يوماً)`);
      return 0;
    } catch (error) {
      this.logger.error('فشل في تنظيف المهام القديمة', error);
      return 0;
    }
  }

  /**
   * إعادة تشغيل معالجة الطابور
   */
  async restartProcessing(): Promise<void> {
    this.logger.log('إعادة تشغيل معالجة الطابور');
    this.stopProcessing();
    this.startProcessing();
  }

  // ========== PRIVATE METHODS ==========

  /**
   * بدء معالجة الطابور
   */
  private startProcessing(): void {
    if (this.processingInterval) {
      return;
    }

    this.logger.log('بدء معالجة طابور الإشعارات');
    this.isProcessing = true;

    this.processingInterval = setInterval(async () => {
      try {
        await this.processQueue();
      } catch (error) {
        this.logger.error('خطأ في معالجة الطابور', error);
      }
    }, this.processingIntervalMs);
  }

  /**
   * إيقاف معالجة الطابور
   */
  private stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    this.isProcessing = false;
    this.logger.log('تم إيقاف معالجة الطابور');
  }

  /**
   * معالجة الطابور
   */
  private async processQueue(): Promise<void> {
    if (!this.isProcessing || this.activeJobs.size >= this.maxConcurrentJobs) {
      return;
    }

    try {
      // الحصول على المهام المجدولة للتنفيذ الآن
      const jobsToProcess = await this.getJobsToProcess();

      for (const job of jobsToProcess) {
        if (this.activeJobs.size >= this.maxConcurrentJobs) {
          break;
        }

        if (this.activeJobs.has(job.id)) {
          continue; // المهمة قيد المعالجة بالفعل
        }

        // معالجة المهمة في الخلفية
        this.processJob(job).catch(error => {
          this.logger.error(`خطأ في معالجة المهمة ${job.id}`, error);
        });
      }
    } catch (error) {
      this.logger.error('خطأ في معالجة الطابور', error);
    }
  }

  /**
   * معالجة مهمة واحدة
   */
  private async processJob(job: QueueJob): Promise<void> {
    const startTime = Date.now();

    try {
      this.activeJobs.add(job.id);
      job.status = 'processing';
      job.updatedAt = new Date();
      await this.saveJob(job);

      this.logger.log(`بدء معالجة المهمة: ${job.id} - ${job.type}`);

      // معالجة المهمة حسب النوع
      const result = await this.executeJob(job);

      // تحديث حالة المهمة
      job.status = result.success ? 'completed' : 'failed';
      job.updatedAt = new Date();

      if (!result.success) {
        job.lastError = result.error;
        job.retryCount++;

        // جدولة إعادة المحاولة إذا لم يتم تجاوز الحد الأقصى
        if (job.retryCount < job.maxRetries) {
          job.status = 'queued';
          job.nextRetryAt = new Date(Date.now() + this.calculateBackoffDelay(job.retryCount));
        }
      }

      await this.saveJob(job);

      // تحديث حالة الإشعار في قاعدة البيانات
      await this.updateNotificationStatus(job.notificationId, job.status, result);

      const processingTime = Date.now() - startTime;
      this.logger.log(`تمت معالجة المهمة: ${job.id} - ${job.status} (${processingTime}ms)`);

    } catch (error) {
      this.logger.error(`فشل في معالجة المهمة: ${job.id}`, error);

      job.status = 'failed';
      job.lastError = error.message;
      job.updatedAt = new Date();
      job.retryCount++;

      if (job.retryCount < job.maxRetries) {
        job.status = 'queued';
        job.nextRetryAt = new Date(Date.now() + this.calculateBackoffDelay(job.retryCount));
      }

      await this.saveJob(job);
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  /**
   * تنفيذ المهمة
   */
  private async executeJob(job: QueueJob): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      switch (job.type) {
        case 'email':
          return await this.sendEmail(job.data);
        case 'sms':
          return await this.sendSMS(job.data);
        case 'whatsapp':
          return await this.sendWhatsApp(job.data);
        case 'push':
          return await this.sendPush(job.data);
        case 'in_app':
          return await this.sendInApp(job.data);
        default:
          throw new Error(`نوع الإشعار غير مدعوم: ${job.type}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * إرسال إيميل
   */
  private async sendEmail(data: any): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const result = await this.emailProvider.sendEmail({
        to: data.recipientEmail,
        subject: data.title,
        text: data.message,
        html: data.htmlContent,
      });

      return {
        success: result.success,
        messageId: result.messageId || undefined,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * إرسال SMS
   */
  private async sendSMS(data: any): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const result = await this.smsProvider.sendSMS({
        to: data.recipientPhone,
        message: data.message,
      });

      return {
        success: result.success,
        messageId: result.messageId || undefined,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * إرسال WhatsApp
   */
  private async sendWhatsApp(data: any): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const result = await this.whatsappProvider.sendWhatsApp(
        this.whatsappProvider.createTextMessage(data.recipientPhone, data.message)
      );

      return {
        success: result.success,
        messageId: result.messageId || undefined,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * إرسال دفع (محاكاة)
   */
  private async sendPush(data: any): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      // محاكاة إرسال دفع
      await new Promise(resolve => setTimeout(resolve, 100));

      return {
        success: true,
        messageId: `push_${Date.now()}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * إرسال إشعار داخل التطبيق (محاكاة)
   */
  private async sendInApp(data: any): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      // الإشعارات داخل التطبيق تُعتبر ناجحة فوراً
      return {
        success: true,
        messageId: `in_app_${Date.now()}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * الحصول على المهام المجدولة للتنفيذ
   */
  private async getJobsToProcess(): Promise<QueueJob[]> {
    try {
      // محاكاة - في الواقع يتم الحصول من Redis أو قاعدة البيانات
      const now = new Date();

      // إرجاع مهام وهمية للاختبار
      return [
        {
          id: `job_${Date.now()}_1`,
          notificationId: `notif_${Date.now()}`,
          type: 'email',
          priority: 'normal',
          maxRetries: 3,
          retryCount: 0,
          data: {
            recipientEmail: 'test@example.com',
            title: 'Test Notification',
            message: 'This is a test notification',
          },
          status: 'queued',
          createdAt: now,
          updatedAt: now,
        },
      ];
    } catch (error) {
      this.logger.error('فشل في الحصول على المهام للمعالجة', error);
      return [];
    }
  }

  /**
   * حفظ المهمة
   */
  private async saveJob(job: QueueJob): Promise<void> {
    // محاكاة - في الواقع يتم حفظ في Redis أو قاعدة البيانات
    // يمكن استخدام Redis للطوابير عالية الأداء
  }

  /**
   * الحصول على مهمة
   */
  private async getJob(jobId: string): Promise<QueueJob | null> {
    // محاكاة - في الواقع يتم الحصول من Redis أو قاعدة البيانات
    return null;
  }

  /**
   * حساب تأخير إعادة المحاولة
   */
  private calculateBackoffDelay(retryCount: number): number {
    // exponential backoff: 1م, 2م, 4م, 8م, ...
    const baseDelay = 60 * 1000; // دقيقة واحدة
    const maxDelay = 24 * 60 * 60 * 1000; // 24 ساعة

    const delay = baseDelay * Math.pow(2, retryCount - 1);
    return Math.min(delay, maxDelay);
  }

  /**
   * تحديث حالة الإشعار
   */
  private async updateNotificationStatus(
    notificationId: string,
    jobStatus: string,
    result: any,
  ): Promise<void> {
    try {
      const updateData: any = {
        updatedAt: new Date(),
      };

      switch (jobStatus) {
        case 'completed':
          updateData.status = 'sent';
          updateData.sentAt = new Date();
          updateData.providerMessageId = result.messageId;
          break;

        case 'failed':
          updateData.status = 'failed';
          updateData.failedAt = new Date();
          updateData.lastError = result.error;
          break;

        case 'cancelled':
          updateData.status = 'cancelled';
          break;
      }

      await this.prisma.notification.update({
        where: { id: notificationId },
        data: updateData,
      });
    } catch (error) {
      this.logger.error(`فشل في تحديث حالة الإشعار: ${notificationId}`, error);
    }
  }
}
