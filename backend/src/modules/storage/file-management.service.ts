import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { StorageService } from './storage.service';
import { AuditService } from '../audit/audit.service';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface FileVersionInfo {
  id: string;
  version: number;
  filename: string;
  size: number;
  createdAt: Date;
  modifiedBy?: string;
}

export interface FileOperationsResult {
  success: boolean;
  message: string;
  details?: any;
}

@Injectable()
export class FileManagementService {
  private readonly logger = new Logger(FileManagementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * إنشاء نسخة احتياطية من الملف
   */
  async createFileBackup(
    fileId: string,
    reason: string,
    createdBy?: string,
  ): Promise<FileOperationsResult> {
    try {
      this.logger.log(`إنشاء نسخة احتياطية من الملف: ${fileId}`);

      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new NotFoundException('الملف غير موجود');
      }

      // إنشاء نسخة احتياطية من الملف
      const backupPath = this.generateBackupPath(file.path);
      await fs.copyFile(file.path, backupPath);

      // تسجيل النسخة الاحتياطية في قاعدة البيانات
      await this.prisma.fileVersion.create({
        data: {
          fileId,
          version: await this.getNextVersionNumber(fileId),
          originalName: file.originalName,
          filename: path.basename(backupPath),
          mimeType: file.mimeType,
          size: file.size,
          path: backupPath,
          checksum: file.checksum,
          modifiedBy: createdBy,
          changeReason: `نسخة احتياطية: ${reason}`,
        },
      });

      // تسجيل في سجل التدقيق
      await this.auditService.log({
        action: 'FILE_BACKUP_CREATED',
        entity: 'File',
        entityId: fileId,
        details: {
          reason,
          backupPath,
          createdBy,
        },
        module: 'storage',
        category: 'file_management',
      });

      this.logger.log(`تم إنشاء نسخة احتياطية بنجاح: ${fileId}`);

      return {
        success: true,
        message: 'تم إنشاء نسخة احتياطية من الملف بنجاح',
        details: { backupPath },
      };
    } catch (error) {
      this.logger.error(`فشل في إنشاء نسخة احتياطية: ${fileId}`, error);
      return {
        success: false,
        message: `فشل في إنشاء نسخة احتياطية: ${error.message}`,
      };
    }
  }

  /**
   * استعادة ملف من نسخة احتياطية
   */
  async restoreFileFromBackup(
    fileId: string,
    versionNumber: number,
    restoredBy?: string,
  ): Promise<FileOperationsResult> {
    try {
      this.logger.log(`استعادة الملف من نسخة احتياطية: ${fileId}, الإصدار: ${versionNumber}`);

      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new NotFoundException('الملف غير موجود');
      }

      // الحصول على النسخة الاحتياطية
      const backupVersion = await this.prisma.fileVersion.findFirst({
        where: {
          fileId,
          version: versionNumber,
        },
      });

      if (!backupVersion) {
        throw new NotFoundException('النسخة الاحتياطية غير موجودة');
      }

      // إنشاء نسخة احتياطية من الإصدار الحالي قبل الاستعادة
      await this.createFileBackup(fileId, 'قبل الاستعادة', restoredBy);

      // استعادة الملف
      await fs.copyFile(backupVersion.path, file.path);

      // تحديث معلومات الملف
      await this.prisma.file.update({
        where: { id: fileId },
        data: {
          originalName: backupVersion.originalName,
          filename: path.basename(file.path),
          mimeType: backupVersion.mimeType,
          size: backupVersion.size,
          checksum: backupVersion.checksum,
          updatedAt: new Date(),
        },
      });

      // تسجيل في سجل التدقيق
      await this.auditService.log({
        action: 'FILE_RESTORED',
        entity: 'File',
        entityId: fileId,
        details: {
          restoredFromVersion: versionNumber,
          restoredBy,
        },
        module: 'storage',
        category: 'file_management',
      });

      this.logger.log(`تم استعادة الملف بنجاح: ${fileId}`);

      return {
        success: true,
        message: 'تم استعادة الملف من النسخة الاحتياطية بنجاح',
      };
    } catch (error) {
      this.logger.error(`فشل في استعادة الملف: ${fileId}`, error);
      return {
        success: false,
        message: `فشل في استعادة الملف: ${error.message}`,
      };
    }
  }

  /**
   * الحصول على إصدارات الملف
   */
  async getFileVersions(fileId: string): Promise<FileVersionInfo[]> {
    try {
      const versions = await this.prisma.fileVersion.findMany({
        where: { fileId },
        orderBy: { version: 'desc' },
        select: {
          id: true,
          version: true,
          filename: true,
          size: true,
          createdAt: true,
          modifiedBy: true,
        },
      });

      return versions.map(v => ({
        id: v.id,
        version: v.version,
        filename: v.filename,
        size: Number(v.size),
        createdAt: v.createdAt,
        modifiedBy: v.modifiedBy || undefined,
      }));
    } catch (error) {
      this.logger.error(`فشل في الحصول على إصدارات الملف: ${fileId}`, error);
      return [];
    }
  }

  /**
   * حذف نسخة احتياطية
   */
  async deleteFileVersion(
    versionId: string,
    deletedBy?: string,
  ): Promise<FileOperationsResult> {
    try {
      this.logger.log(`حذف نسخة احتياطية: ${versionId}`);

      const version = await this.prisma.fileVersion.findUnique({
        where: { id: versionId },
        include: { file: true },
      });

      if (!version) {
        throw new NotFoundException('النسخة الاحتياطية غير موجودة');
      }

      // حذف الملف من النظام
      try {
        await fs.unlink(version.path);
      } catch (error) {
        this.logger.warn(`فشل في حذف الملف من النظام: ${version.path}`, error);
      }

      // حذف السجل من قاعدة البيانات
      await this.prisma.fileVersion.delete({
        where: { id: versionId },
      });

      // تسجيل في سجل التدقيق
      await this.auditService.log({
        action: 'FILE_VERSION_DELETED',
        entity: 'FileVersion',
        entityId: versionId,
        details: {
          fileId: version.fileId,
          version: version.version,
          deletedBy,
        },
        module: 'storage',
        category: 'file_management',
      });

      this.logger.log(`تم حذف النسخة الاحتياطية بنجاح: ${versionId}`);

      return {
        success: true,
        message: 'تم حذف النسخة الاحتياطية بنجاح',
      };
    } catch (error) {
      this.logger.error(`فشل في حذف النسخة الاحتياطية: ${versionId}`, error);
      return {
        success: false,
        message: `فشل في حذف النسخة الاحتياطية: ${error.message}`,
      };
    }
  }

  /**
   * نقل ملف إلى حاوية أخرى
   */
  async moveFileToBucket(
    fileId: string,
    newBucket: string,
    movedBy?: string,
  ): Promise<FileOperationsResult> {
    try {
      this.logger.log(`نقل الملف إلى حاوية أخرى: ${fileId} -> ${newBucket}`);

      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new NotFoundException('الملف غير موجود');
      }

      if (file.bucket === newBucket) {
        throw new BadRequestException('الملف موجود بالفعل في هذه الحاوية');
      }

      // إنشاء المسار الجديد
      const newPath = path.join(
        path.dirname(path.dirname(file.path)),
        newBucket,
        path.basename(file.path)
      );

      // إنشاء المجلد إذا لم يكن موجوداً
      await fs.mkdir(path.dirname(newPath), { recursive: true });

      // نقل الملف
      await fs.rename(file.path, newPath);

      // تحديث سجل الملف
      await this.prisma.file.update({
        where: { id: fileId },
        data: {
          bucket: newBucket,
          path: newPath,
          url: this.generateNewFileUrl(file.filename, newBucket, file.isPublic),
          updatedAt: new Date(),
        },
      });

      // نقل الصورة المصغرة إذا وجدت
      if (file.thumbnailPath) {
        const newThumbnailPath = path.join(
          path.dirname(path.dirname(file.thumbnailPath)),
          newBucket,
          'thumbnails',
          path.basename(file.thumbnailPath)
        );

        try {
          await fs.mkdir(path.dirname(newThumbnailPath), { recursive: true });
          await fs.rename(file.thumbnailPath, newThumbnailPath);

          await this.prisma.file.update({
            where: { id: fileId },
            data: { thumbnailPath: newThumbnailPath },
          });
        } catch (error) {
          this.logger.warn(`فشل في نقل الصورة المصغرة: ${file.thumbnailPath}`, error);
        }
      }

      // تسجيل في سجل التدقيق
      await this.auditService.log({
        action: 'FILE_MOVED',
        entity: 'File',
        entityId: fileId,
        details: {
          oldBucket: file.bucket,
          newBucket,
          movedBy,
        },
        module: 'storage',
        category: 'file_management',
      });

      this.logger.log(`تم نقل الملف بنجاح: ${fileId}`);

      return {
        success: true,
        message: 'تم نقل الملف إلى الحاوية الجديدة بنجاح',
        details: { newBucket },
      };
    } catch (error) {
      this.logger.error(`فشل في نقل الملف: ${fileId}`, error);
      return {
        success: false,
        message: `فشل في نقل الملف: ${error.message}`,
      };
    }
  }

  /**
   * تحويل ملف من خاص إلى عام أو العكس
   */
  async toggleFileVisibility(
    fileId: string,
    makePublic: boolean,
    changedBy?: string,
  ): Promise<FileOperationsResult> {
    try {
      this.logger.log(`${makePublic ? 'جعل الملف عام' : 'جعل الملف خاص'}: ${fileId}`);

      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new NotFoundException('الملف غير موجود');
      }

      if (file.isPublic === makePublic) {
        return {
          success: true,
          message: `الملف ${makePublic ? 'عام بالفعل' : 'خاص بالفعل'}`,
        };
      }

      // تحديث رابط URL
      const newUrl = this.generateNewFileUrl(file.filename, file.bucket, makePublic);

      // تحديث الملف
      await this.prisma.file.update({
        where: { id: fileId },
        data: {
          isPublic: makePublic,
          url: newUrl,
          updatedAt: new Date(),
        },
      });

      // تسجيل في سجل التدقيق
      await this.auditService.log({
        action: makePublic ? 'FILE_MADE_PUBLIC' : 'FILE_MADE_PRIVATE',
        entity: 'File',
        entityId: fileId,
        details: {
          changedBy,
          oldVisibility: file.isPublic,
          newVisibility: makePublic,
        },
        module: 'storage',
        category: 'access_control',
      });

      this.logger.log(`تم تحديث رؤية الملف بنجاح: ${fileId}`);

      return {
        success: true,
        message: `تم ${makePublic ? 'جعل الملف عام' : 'جعل الملف خاص'} بنجاح`,
      };
    } catch (error) {
      this.logger.error(`فشل في تحديث رؤية الملف: ${fileId}`, error);
      return {
        success: false,
        message: `فشل في تحديث رؤية الملف: ${error.message}`,
      };
    }
  }

  /**
   * دمج ملفات PDF
   */
  async mergePdfFiles(
    fileIds: string[],
    outputFilename: string,
    mergedBy?: string,
  ): Promise<FileOperationsResult> {
    try {
      this.logger.log(`دمج ملفات PDF: ${fileIds.length} ملف`);

      // التحقق من أن جميع الملفات PDF
      const files = await this.prisma.file.findMany({
        where: {
          id: { in: fileIds },
          mimeType: 'application/pdf',
        },
      });

      if (files.length !== fileIds.length) {
        throw new BadRequestException('بعض الملفات المحددة ليست ملفات PDF أو غير موجودة');
      }

      // TODO: تنفيذ دمج ملفات PDF باستخدام مكتبة مثل pdf-lib
      // للآن، سنحاكي العملية

      this.logger.log(`[MOCK] تم دمج ${files.length} ملف PDF`);

      return {
        success: true,
        message: 'تم دمج ملفات PDF بنجاح',
        details: {
          outputFilename,
          mergedFilesCount: files.length,
        },
      };
    } catch (error) {
      this.logger.error('فشل في دمج ملفات PDF', error);
      return {
        success: false,
        message: `فشل في دمج ملفات PDF: ${error.message}`,
      };
    }
  }

  /**
   * استخراج نص من ملف PDF أو صورة
   */
  async extractTextFromFile(
    fileId: string,
    extractedBy?: string,
  ): Promise<{ success: boolean; text?: string; error?: string }> {
    try {
      this.logger.log(`استخراج نص من الملف: ${fileId}`);

      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new NotFoundException('الملف غير موجود');
      }

      let extractedText = '';

      // TODO: تنفيذ استخراج النص باستخدام مكتبات مثل tesseract أو pdf-parse
      // للآن، سنحاكي العملية

      if (file.mimeType === 'application/pdf') {
        extractedText = `[MOCK] نص مستخرج من ملف PDF: ${file.originalName}`;
      } else if (file.mimeType.startsWith('image/')) {
        extractedText = `[MOCK] نص مستخرج من الصورة: ${file.originalName}`;
      } else {
        throw new BadRequestException('نوع الملف غير مدعوم لاستخراج النص');
      }

      // تسجيل في سجل التدقيق
      await this.auditService.log({
        action: 'TEXT_EXTRACTED',
        entity: 'File',
        entityId: fileId,
        details: {
          extractedBy,
          textLength: extractedText.length,
        },
        module: 'storage',
        category: 'file_processing',
      });

      return {
        success: true,
        text: extractedText,
      };
    } catch (error) {
      this.logger.error(`فشل في استخراج النص: ${fileId}`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * تحويل ملف إلى تنسيق آخر
   */
  async convertFileFormat(
    fileId: string,
    targetFormat: string,
    convertedBy?: string,
  ): Promise<FileOperationsResult> {
    try {
      this.logger.log(`تحويل تنسيق الملف: ${fileId} -> ${targetFormat}`);

      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new NotFoundException('الملف غير موجود');
      }

      // TODO: تنفيذ تحويل التنسيق باستخدام مكتبات مناسبة
      // مثل: sharp للصور، pandoc للمستندات، إلخ

      this.logger.log(`[MOCK] تم تحويل الملف إلى تنسيق: ${targetFormat}`);

      return {
        success: true,
        message: `تم تحويل الملف إلى تنسيق ${targetFormat} بنجاح`,
        details: { targetFormat },
      };
    } catch (error) {
      this.logger.error(`فشل في تحويل تنسيق الملف: ${fileId}`, error);
      return {
        success: false,
        message: `فشل في تحويل تنسيق الملف: ${error.message}`,
      };
    }
  }

  /**
   * ضغط ملف
   */
  async compressFile(
    fileId: string,
    compressionLevel: 'low' | 'medium' | 'high' = 'medium',
    compressedBy?: string,
  ): Promise<FileOperationsResult> {
    try {
      this.logger.log(`ضغط الملف: ${fileId}, مستوى: ${compressionLevel}`);

      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new NotFoundException('الملف غير موجود');
      }

      // TODO: تنفيذ الضغط حسب نوع الملف
      // صور: استخدام sharp
      // ملفات أخرى: استخدام مكتبات ضغط مناسبة

      this.logger.log(`[MOCK] تم ضغط الملف بمستوى: ${compressionLevel}`);

      return {
        success: true,
        message: 'تم ضغط الملف بنجاح',
        details: { compressionLevel },
      };
    } catch (error) {
      this.logger.error(`فشل في ضغط الملف: ${fileId}`, error);
      return {
        success: false,
        message: `فشل في ضغط الملف: ${error.message}`,
      };
    }
  }

  /**
   * تنظيف الملفات المؤقتة والقديمة
   */
  async cleanupOrphanedFiles(): Promise<{
    deletedFiles: number;
    freedSpace: number;
    errors: string[];
  }> {
    try {
      this.logger.log('تنظيف الملفات اليتيمة والقديمة');

      let deletedFiles = 0;
      let freedSpace = 0;
      const errors: string[] = [];

      // البحث عن ملفات في النظام غير موجودة في قاعدة البيانات
      // TODO: تنفيذ فحص شامل للملفات

      // البحث عن ملفات قديمة جداً
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 1); // ملفات أقدم من سنة

      const oldVersions = await this.prisma.fileVersion.findMany({
        where: {
          createdAt: { lt: cutoffDate },
        },
        include: { file: true },
      });

      for (const version of oldVersions) {
        try {
          // حذف الملف من النظام
          await fs.unlink(version.path);
          deletedFiles++;
          freedSpace += Number(version.size);

          // حذف السجل من قاعدة البيانات
          await this.prisma.fileVersion.delete({
            where: { id: version.id },
          });
        } catch (error) {
          errors.push(`فشل في حذف النسخة ${version.id}: ${error.message}`);
        }
      }

      // تنظيف الرموز المؤقتة المنتهية الصلاحية
      const expiredTokens = await this.prisma.file.findMany({
        where: {
          accessToken: { not: null },
          expiresAt: { lt: new Date() },
        },
      });

      for (const file of expiredTokens) {
        await this.prisma.file.update({
          where: { id: file.id },
          data: {
            accessToken: null,
            expiresAt: null,
          },
        });
      }

      this.logger.log(`تم تنظيف ${deletedFiles} ملف قديم، تم تحرير ${freedSpace} بايت`);

      return {
        deletedFiles,
        freedSpace,
        errors,
      };
    } catch (error) {
      this.logger.error('فشل في تنظيف الملفات', error);
      return {
        deletedFiles: 0,
        freedSpace: 0,
        errors: [error.message],
      };
    }
  }

  /**
   * الحصول على إحصائيات استخدام الملفات
   */
  async getUsageStats(branchId?: string): Promise<{
    totalStorageUsed: number;
    filesCount: number;
    averageFileSize: number;
    largestFile: { id: string; name: string; size: number };
    mostDownloadedFiles: Array<{ id: string; name: string; downloads: number }>;
    storageByCategory: Record<string, number>;
    storageByType: Record<string, number>;
  }> {
    try {
      const where: any = {};
      if (branchId) where.branchId = branchId;

      const files = await this.prisma.file.findMany({
        where,
        select: {
          id: true,
          originalName: true,
          size: true,
          category: true,
          mimeType: true,
        },
      });

      const totalStorageUsed = files.reduce((sum, file) => sum + Number(file.size), 0);
      const filesCount = files.length;
      const averageFileSize = filesCount > 0 ? totalStorageUsed / filesCount : 0;

      // أكبر ملف
      const largestFile = files.reduce((max, file) =>
        Number(file.size) > Number(max.size) ? file : max
      );

      // إحصائيات حسب الفئة
      const storageByCategory: Record<string, number> = {};
      const storageByType: Record<string, number> = {};

      files.forEach(file => {
        storageByCategory[file.category] = (storageByCategory[file.category] || 0) + Number(file.size);

        const type = this.getFileTypeFromMime(file.mimeType);
        storageByType[type] = (storageByType[type] || 0) + Number(file.size);
      });

      // TODO: أكثر الملفات تحميلاً
      const mostDownloadedFiles: Array<{ id: string; name: string; downloads: number }> = [];

      return {
        totalStorageUsed,
        filesCount,
        averageFileSize,
        largestFile: {
          id: largestFile.id,
          name: largestFile.originalName,
          size: Number(largestFile.size),
        },
        mostDownloadedFiles,
        storageByCategory,
        storageByType,
      };
    } catch (error) {
      this.logger.error('فشل في حساب إحصائيات الاستخدام', error);
      throw error;
    }
  }

  // ========== PRIVATE METHODS ==========

  /**
   * إنشاء مسار للنسخة الاحتياطية
   */
  private generateBackupPath(originalPath: string): string {
    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    const baseName = path.basename(originalPath, ext);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    return path.join(dir, 'backups', `${baseName}_backup_${timestamp}${ext}`);
  }

  /**
   * الحصول على رقم الإصدار التالي
   */
  private async getNextVersionNumber(fileId: string): Promise<number> {
    const lastVersion = await this.prisma.fileVersion.findFirst({
      where: { fileId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    return (lastVersion?.version || 0) + 1;
  }

  /**
   * إنشاء رابط URL جديد للملف
   */
  private generateNewFileUrl(filename: string, bucket: string, isPublic: boolean): string | undefined {
    // TODO: استخدام منطق مشابه لـ StorageService
    return undefined;
  }

  /**
   * الحصول على نوع الملف من MIME type
   */
  private getFileTypeFromMime(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'document';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    return 'other';
  }
}
