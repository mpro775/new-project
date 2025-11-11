import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface AccessToken {
  token: string;
  fileId: string;
  permissions: AccessPermission[];
  expiresAt: Date;
  maxDownloads?: number;
  downloadsCount: number;
  createdBy: string;
}

export interface AccessPermission {
  action: 'read' | 'write' | 'delete' | 'share';
  granted: boolean;
}

export interface FileAccessRule {
  fileId: string;
  userId?: string;
  roleId?: string;
  permissions: AccessPermission[];
  expiresAt?: Date;
  ipWhitelist?: string[];
  userAgentPattern?: string;
  maxAccessCount?: number;
  accessCount: number;
}

@Injectable()
export class AccessControlService {
  private readonly logger = new Logger(AccessControlService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * التحقق من صلاحية الوصول للملف
   */
  async checkFileAccess(
    fileId: string,
    userId: string,
    action: 'read' | 'write' | 'delete' | 'share',
    context?: {
      ip?: string;
      userAgent?: string;
      accessToken?: string;
    },
  ): Promise<boolean> {
    try {
      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
        include: {
          uploader: {
            select: { id: true, role: true },
          },
        },
      });

      if (!file) {
        throw new NotFoundException('الملف غير موجود');
      }

      // التحقق من الملكية
      if (file.uploader?.id === userId) {
        return true;
      }

      // التحقق من الصلاحيات العامة
      if (file.isPublic && action === 'read') {
        return true;
      }

      // التحقق من الرمز المميز للوصول
      if (context?.accessToken) {
        const tokenValid = await this.validateAccessToken(
          context.accessToken,
          fileId,
          action,
        );
        if (tokenValid) {
          return true;
        }
      }

      // التحقق من قواعد الوصول
      const hasAccess = await this.checkAccessRules(fileId, userId, action, context);

      // تسجيل محاولة الوصول
      await this.logAccessAttempt(fileId, userId, action, hasAccess, context);

      return hasAccess;
    } catch (error) {
      this.logger.error(`فشل في التحقق من صلاحية الوصول: ${fileId}`, error);
      return false;
    }
  }

  /**
   * إنشاء رمز وصول للملف
   */
  async createAccessToken(
    fileId: string,
    userId: string,
    permissions: AccessPermission[],
    options: {
      expiresIn?: number; // بالدقائق
      maxDownloads?: number;
      ipWhitelist?: string[];
      userAgentPattern?: string;
    } = {},
  ): Promise<AccessToken> {
    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(
        expiresAt.getMinutes() + (options.expiresIn || 60), // افتراضي ساعة واحدة
      );

      const token = this.generateSecureToken();

      const accessToken = await this.prisma.fileAccess.create({
        data: {
          fileId,
          accessType: 'token',
          accessMethod: 'api',
          ipAddress: '', // سيتم تحديثه عند الاستخدام
          userAgent: '',
          responseStatus: 200,
          accessedAt: new Date(),
          metadata: {
            token,
            permissions,
            expiresAt,
            maxDownloads: options.maxDownloads,
            downloadsCount: 0,
            ipWhitelist: options.ipWhitelist,
            userAgentPattern: options.userAgentPattern,
            createdBy: userId,
          },
        },
      });

      const tokenData: AccessToken = {
        token,
        fileId,
        permissions,
        expiresAt,
        maxDownloads: options.maxDownloads,
        downloadsCount: 0,
        createdBy: userId,
      };

      // تسجيل في السجل
      await this.auditService.log({
        action: 'CREATE',
        entity: 'FileAccess',
        entityId: accessToken.id,
        details: {
          fileId,
          token: token.substring(0, 8) + '...', // تسجيل جزء من الرمز فقط
          permissions,
          expiresAt,
        },
        module: 'storage',
        category: 'access_control',
        userId,
        severity: 'info',
      });

      return tokenData;
    } catch (error) {
      this.logger.error(`فشل في إنشاء رمز الوصول: ${fileId}`, error);
      throw error;
    }
  }

  /**
   * التحقق من صحة رمز الوصول
   */
  async validateAccessToken(
    token: string,
    fileId: string,
    action: 'read' | 'write' | 'delete' | 'share',
  ): Promise<boolean> {
    try {
      const accessRecord = await this.prisma.fileAccess.findFirst({
        where: {
          fileId,
          metadata: {
            path: ['token'],
            equals: token,
          },
        },
      });

      if (!accessRecord || !accessRecord.metadata) {
        return false;
      }

      const tokenData = accessRecord.metadata as any;

      // التحقق من انتهاء الصلاحية
      if (new Date() > new Date(tokenData.expiresAt)) {
        return false;
      }

      // التحقق من عدد التنزيلات
      if (
        tokenData.maxDownloads &&
        tokenData.downloadsCount >= tokenData.maxDownloads
      ) {
        return false;
      }

      // التحقق من الصلاحيات
      const permission = tokenData.permissions?.find(
        (p: AccessPermission) => p.action === action,
      );

      return permission?.granted || false;
    } catch (error) {
      this.logger.error(`فشل في التحقق من رمز الوصول: ${token}`, error);
      return false;
    }
  }

  /**
   * إضافة قاعدة وصول للملف
   */
  async addAccessRule(
    fileId: string,
    userId: string,
    rule: Omit<FileAccessRule, 'fileId' | 'accessCount'>,
  ): Promise<FileAccessRule> {
    try {
      const accessRule = await this.prisma.fileAccess.create({
        data: {
          fileId,
          accessType: 'rule',
          accessMethod: 'api',
          ipAddress: '',
          userAgent: '',
          responseStatus: 200,
          accessedAt: new Date(),
          metadata: {
            ...rule,
            accessCount: 0,
          },
        },
      });

      const ruleData: FileAccessRule = {
        fileId,
        ...rule,
        accessCount: 0,
      };

      // تسجيل في السجل
      await this.auditService.log({
        action: 'CREATE',
        entity: 'FileAccess',
        entityId: accessRule.id,
        details: {
          fileId,
          rule: ruleData,
        },
        module: 'storage',
        category: 'access_control',
        userId,
        severity: 'info',
      });

      return ruleData;
    } catch (error) {
      this.logger.error(`فشل في إضافة قاعدة الوصول: ${fileId}`, error);
      throw error;
    }
  }

  /**
   * إزالة قاعدة وصول
   */
  async removeAccessRule(fileId: string, ruleId: string, userId: string): Promise<void> {
    try {
      await this.prisma.fileAccess.delete({
        where: { id: ruleId },
      });

      // تسجيل في السجل
      await this.auditService.log({
        action: 'DELETE',
        entity: 'FileAccess',
        entityId: ruleId,
        details: {
          fileId,
        },
        module: 'storage',
        category: 'access_control',
        userId,
        severity: 'info',
      });
    } catch (error) {
      this.logger.error(`فشل في إزالة قاعدة الوصول: ${ruleId}`, error);
      throw error;
    }
  }

  /**
   * الحصول على قائمة قواعد الوصول للملف
   */
  async getFileAccessRules(fileId: string): Promise<FileAccessRule[]> {
    try {
      const rules = await this.prisma.fileAccess.findMany({
        where: {
          fileId,
          accessType: 'rule',
        },
        orderBy: {
          accessedAt: 'desc',
        },
      });

      return rules.map(rule => ({
        fileId: rule.fileId,
        accessCount: 0,
        ...(rule.metadata as Omit<FileAccessRule, 'fileId' | 'accessCount'>),
      }));
    } catch (error) {
      this.logger.error(`فشل في الحصول على قواعد الوصول: ${fileId}`, error);
      return [];
    }
  }

  /**
   * إنشاء رابط عام للملف
   */
  async createPublicLink(
    fileId: string,
    userId: string,
    options: {
      expiresIn?: number; // بالدقائق
      maxDownloads?: number;
    } = {},
  ): Promise<string> {
    try {
      const token = await this.createAccessToken(fileId, userId, [
        { action: 'read', granted: true },
      ], options);

      const baseUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
      return `${baseUrl}/api/storage/files/${fileId}/download?token=${token.token}`;
    } catch (error) {
      this.logger.error(`فشل في إنشاء الرابط العام: ${fileId}`, error);
      throw error;
    }
  }

  /**
   * إبطال جميع رموز الوصول للملف
   */
  async revokeAllAccessTokens(fileId: string, userId: string): Promise<number> {
    try {
      const result = await this.prisma.fileAccess.deleteMany({
        where: {
          fileId,
          accessType: 'token',
        },
      });

      // تسجيل في السجل
      await this.auditService.log({
        action: 'DELETE',
        entity: 'FileAccess',
        entityId: fileId,
        details: {
          fileId,
          revokedTokens: result.count,
        },
        module: 'storage',
        category: 'access_control',
        userId,
        severity: 'warning',
      });

      return result.count;
    } catch (error) {
      this.logger.error(`فشل في إبطال رموز الوصول: ${fileId}`, error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات الوصول للملف
   */
  async getFileAccessStats(fileId: string): Promise<{
    totalAccess: number;
    uniqueUsers: number;
    recentAccess: Array<{
      accessedBy: string;
      accessType: string;
      accessedAt: Date;
      ipAddress: string | null;
    }>;
    accessByType: Record<string, number>;
  }> {
    try {
      const accesses = await this.prisma.fileAccess.findMany({
        where: { fileId },
        orderBy: { accessedAt: 'desc' },
        take: 50,
      });

      const totalAccess = accesses.length;
      const uniqueUsers = new Set(accesses.map(a => a.accessedBy)).size;

      const accessByType = accesses.reduce((acc, access) => {
        acc[access.accessType] = (acc[access.accessType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const recentAccess = accesses.slice(0, 10).map(access => ({
        accessedBy: access.accessedBy || 'unknown',
        accessType: access.accessType,
        accessedAt: access.accessedAt,
        ipAddress: access.ipAddress,
      }));

      return {
        totalAccess,
        uniqueUsers,
        recentAccess,
        accessByType,
      };
    } catch (error) {
      this.logger.error(`فشل في الحصول على إحصائيات الوصول: ${fileId}`, error);
      throw error;
    }
  }

  /**
   * تنظيف الرموز المنتهية الصلاحية
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      this.logger.log('تنظيف الرموز المنتهية الصلاحية');

      const expiredTokens = await this.prisma.fileAccess.findMany({
        where: {
          accessType: 'token',
          metadata: {
            path: ['expiresAt'],
            lt: new Date(),
          },
        },
      });

      if (expiredTokens.length > 0) {
        await this.prisma.fileAccess.deleteMany({
          where: {
            id: {
              in: expiredTokens.map(t => t.id),
            },
          },
        });
      }

      this.logger.log(`تم حذف ${expiredTokens.length} رمز منتهي الصلاحية`);
      return expiredTokens.length;
    } catch (error) {
      this.logger.error('فشل في تنظيف الرموز المنتهية الصلاحية', error);
      return 0;
    }
  }

  // ========== PRIVATE METHODS ==========

  /**
   * التحقق من قواعد الوصول
   */
  private async checkAccessRules(
    fileId: string,
    userId: string,
    action: 'read' | 'write' | 'delete' | 'share',
    context?: { ip?: string; userAgent?: string },
  ): Promise<boolean> {
    try {
      const rules = await this.prisma.fileAccess.findMany({
        where: {
          fileId,
          accessType: 'rule',
        },
      });

      for (const rule of rules) {
        const ruleData = rule.metadata as any;

        // التحقق من المستخدم
        if (ruleData.userId && ruleData.userId !== userId) {
          continue;
        }

        // التحقق من الدور
        if (ruleData.roleId) {
          const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
          });

          if (user?.role?.id !== ruleData.roleId) {
            continue;
          }
        }

        // التحقق من انتهاء الصلاحية
        if (ruleData.expiresAt && new Date() > new Date(ruleData.expiresAt)) {
          continue;
        }

        // التحقق من عدد الوصول
        if (
          ruleData.maxAccessCount &&
          ruleData.accessCount >= ruleData.maxAccessCount
        ) {
          continue;
        }

        // التحقق من IP
        if (
          ruleData.ipWhitelist &&
          context?.ip &&
          !ruleData.ipWhitelist.includes(context.ip)
        ) {
          continue;
        }

        // التحقق من User Agent
        if (
          ruleData.userAgentPattern &&
          context?.userAgent &&
          !new RegExp(ruleData.userAgentPattern).test(context.userAgent)
        ) {
          continue;
        }

        // التحقق من الصلاحية
        const permission = ruleData.permissions?.find(
          (p: AccessPermission) => p.action === action,
        );

        if (permission?.granted) {
          // تحديث عدد الوصول
          await this.prisma.fileAccess.update({
            where: { id: rule.id },
            data: {
              metadata: {
                ...ruleData,
                accessCount: ruleData.accessCount + 1,
              },
              accessedAt: new Date(),
            },
          });

          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error(`فشل في التحقق من قواعد الوصول: ${fileId}`, error);
      return false;
    }
  }

  /**
   * تسجيل محاولة الوصول
   */
  private async logAccessAttempt(
    fileId: string,
    userId: string,
    action: string,
    success: boolean,
    context?: { ip?: string; userAgent?: string; accessToken?: string },
  ): Promise<void> {
    try {
      await this.prisma.fileAccess.create({
        data: {
          fileId,
          accessedBy: userId,
          accessType: context?.accessToken ? 'token' : 'direct',
          accessMethod: 'api',
          ipAddress: context?.ip || '',
          userAgent: context?.userAgent || '',
          responseStatus: success ? 200 : 403,
          accessedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`فشل في تسجيل محاولة الوصول: ${fileId}`, error);
    }
  }

  /**
   * إنشاء رمز آمن
   */
  private generateSecureToken(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }
}
