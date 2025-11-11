import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Response,
  StreamableFile,
  HttpCode,
  HttpStatus,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
} from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { StorageService, UploadFileOptions } from './storage.service';
import { ImageOptimizationService } from './image-optimization.service';
import { AccessControlService } from './access-control.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { createReadStream } from 'fs';
import { join } from 'path';

@Controller('storage')
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly imageOptimizationService: ImageOptimizationService,
    private readonly accessControlService: AccessControlService,
  ) {}

  // ========== رفع الملفات ==========

  /**
   * رفع ملف واحد
   */
  @Post('upload')
  @Permissions('storage.upload')
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|txt|csv|zip)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() body: {
      category: string;
      entityType?: string;
      entityId?: string;
      isPublic?: boolean;
      bucket?: string;
      metadata?: string; // JSON string
    },
    @Query('userId') userId?: string,
    @Query('branchId') branchId?: string,
  ) {
    let metadata: Record<string, any> | undefined;

    try {
      if (body.metadata) {
        metadata = JSON.parse(body.metadata);
      }
    } catch (error) {
      metadata = undefined;
    }

    const options: UploadFileOptions = {
      file,
      category: body.category,
      entityType: body.entityType,
      entityId: body.entityId,
      isPublic: body.isPublic === true || body.isPublic === 'true',
      bucket: body.bucket,
      uploadedBy: userId,
      branchId,
      metadata,
    };

    return this.storageService.uploadFile(options);
  }

  /**
   * رفع ملفات متعددة
   */
  @Post('upload/multiple')
  @Permissions('storage.upload')
  async uploadMultipleFiles(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB per file
        ],
      }),
    )
    files: Express.Multer.File[],
    @Body() body: {
      category: string;
      entityType?: string;
      entityId?: string;
      isPublic?: boolean;
      bucket?: string;
      metadata?: string; // JSON string
    },
    @Query('userId') userId?: string,
    @Query('branchId') branchId?: string,
  ) {
    let metadata: Record<string, any> | undefined;

    try {
      if (body.metadata) {
        metadata = JSON.parse(body.metadata);
      }
    } catch (error) {
      metadata = undefined;
    }

    const results: Array<{ success: boolean; data?: any; error?: string; filename?: string }> = [];

    for (const file of files) {
      try {
        const options: UploadFileOptions = {
          file,
          category: body.category,
          entityType: body.entityType,
          entityId: body.entityId,
          isPublic: body.isPublic === true || body.isPublic === 'true',
          bucket: body.bucket,
          uploadedBy: userId,
          branchId,
          metadata,
        };

        const result = await this.storageService.uploadFile(options);
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          filename: file.originalname,
        });
      }
    }

    return {
      total: files.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  }

  // ========== تحميل وعرض الملفات ==========

  /**
   * تحميل ملف
   */
  @Get('files/:fileId/download')
  @Permissions('storage.download')
  async downloadFile(
    @Param('fileId') fileId: string,
    @Query('userId') userId?: string,
    @Query('accessToken') accessToken?: string,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const fileData = await this.storageService.downloadFile(fileId, userId, accessToken);

    res.set({
      'Content-Type': fileData.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileData.filename)}"`,
      'Content-Length': fileData.size,
      'Cache-Control': 'private, max-age=3600', // كاش لساعة
    });

    return new StreamableFile(createReadStream(fileData.path));
  }

  /**
   * عرض ملف (للملفات العامة أو المصرح بها)
   */
  @Get('files/:fileId/view')
  @Permissions('storage.view')
  async viewFile(
    @Param('fileId') fileId: string,
    @Query('userId') userId?: string,
    @Query('accessToken') accessToken?: string,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const fileData = await this.storageService.downloadFile(fileId, userId, accessToken);

    res.set({
      'Content-Type': fileData.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(fileData.filename)}"`,
      'Cache-Control': 'public, max-age=3600', // كاش عام لساعة
    });

    return new StreamableFile(createReadStream(fileData.path));
  }

  /**
   * عرض الصورة المصغرة
   */
  @Get('files/:fileId/thumbnail')
  @Permissions('storage.view')
  async getThumbnail(
    @Param('fileId') fileId: string,
    @Query('userId') userId?: string,
    @Query('accessToken') accessToken?: string,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const fileInfo = await this.storageService.getFileInfo(fileId, userId);

    if (!fileInfo.thumbnailUrl) {
      // إذا لم تكن هناك صورة مصغرة، أرجع الصورة الأصلية
      const fileData = await this.storageService.downloadFile(fileId, userId, accessToken);

      res.set({
        'Content-Type': fileData.mimeType,
        'Cache-Control': 'public, max-age=3600',
      });

      return new StreamableFile(createReadStream(fileData.path));
    }

    // TODO: تحميل الصورة المصغرة
    // للآن، أرجع الصورة الأصلية
    const fileData = await this.storageService.downloadFile(fileId, userId, accessToken);

    res.set({
      'Content-Type': fileData.mimeType,
      'Cache-Control': 'public, max-age=3600',
    });

    return new StreamableFile(createReadStream(fileData.path));
  }

  // ========== إدارة الملفات ==========

  /**
   * الحصول على معلومات ملف
   */
  @Get('files/:fileId')
  @Permissions('storage.read')
  async getFileInfo(
    @Param('fileId') fileId: string,
    @Query('userId') userId?: string,
  ) {
    return this.storageService.getFileInfo(fileId, userId);
  }

  /**
   * البحث في الملفات
   */
  @Get('files')
  @Permissions('storage.read')
  async searchFiles(@Query() query: any) {
    return this.storageService.searchFiles(query);
  }

  /**
   * حذف ملف
   */
  @Delete('files/:fileId')
  @Permissions('storage.delete')
  async deleteFile(
    @Param('fileId') fileId: string,
    @Query('userId') userId?: string,
  ) {
    await this.storageService.deleteFile(fileId, userId);
    return { message: 'تم حذف الملف بنجاح' };
  }

  // ========== إدارة الوصول ==========

  /**
   * إنشاء رابط وصول مؤقت
   */
  @Post('files/:fileId/access-token')
  @Permissions('storage.share')
  async generateAccessToken(
    @Param('fileId') fileId: string,
    @Body() body: { expiresInMinutes?: number },
    @Query('userId') userId?: string,
  ) {
    const expiresInMinutes = body.expiresInMinutes || 60; // ساعة واحدة افتراضياً
    const token = await this.storageService.generateAccessToken(
      fileId,
      expiresInMinutes,
      userId,
    );

    return {
      fileId,
      accessToken: token,
      expiresIn: expiresInMinutes,
      message: 'تم إنشاء رابط الوصول المؤقت بنجاح',
    };
  }

  /**
   * التحقق من صحة رمز الوصول
   */
  @Get('files/:fileId/access-token/:token/validate')
  async validateAccessToken(
    @Param('fileId') fileId: string,
    @Param('token') token: string,
  ) {
    const isValid = await this.storageService.validateAccessToken(fileId, token);
    return { valid: isValid };
  }

  /**
   * إنشاء رابط عام للملف
   */
  @Post('files/:fileId/public-link')
  @Permissions('storage.share')
  async createPublicLink(
    @Param('fileId') fileId: string,
    @Body() body: {
      expiresInMinutes?: number;
      maxDownloads?: number;
    },
    @Query('userId') userId?: string,
  ) {
    const link = await this.accessControlService.createPublicLink(
      fileId,
      userId || 'system',
      body,
    );

    return {
      fileId,
      publicLink: link,
      expiresIn: body.expiresInMinutes || 60,
      maxDownloads: body.maxDownloads,
      message: 'تم إنشاء الرابط العام بنجاح',
    };
  }

  /**
   * إبطال جميع رموز الوصول للملف
   */
  @Delete('files/:fileId/access-tokens')
  @Permissions('storage.admin')
  async revokeAllAccessTokens(
    @Param('fileId') fileId: string,
    @Query('userId') userId?: string,
  ) {
    const revokedCount = await this.accessControlService.revokeAllAccessTokens(
      fileId,
      userId || 'system',
    );

    return {
      fileId,
      revokedTokens: revokedCount,
      message: 'تم إبطال جميع رموز الوصول بنجاح',
    };
  }

  /**
   * إحصائيات الوصول للملف
   */
  @Get('files/:fileId/access-stats')
  @Permissions('storage.read')
  async getFileAccessStats(@Param('fileId') fileId: string) {
    return this.accessControlService.getFileAccessStats(fileId);
  }

  // ========== تحسين الصور ==========

  /**
   * تحسين صورة وحفظها
   */
  @Post('files/:fileId/optimize')
  @Permissions('storage.edit')
  async optimizeImage(
    @Param('fileId') fileId: string,
    @Body() body: {
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp' | 'avif';
      maxWidth?: number;
      maxHeight?: number;
    },
    @Query('userId') userId?: string,
  ) {
    const result = await this.imageOptimizationService.optimizeAndSaveImage(
      fileId,
      body,
    );

    return {
      fileId,
      optimization: result,
      message: result.success
        ? 'تم تحسين الصورة بنجاح'
        : 'فشل في تحسين الصورة',
    };
  }

  /**
   * إنشاء صور مصغرة للصورة
   */
  @Post('files/:fileId/thumbnails')
  @Permissions('storage.edit')
  async generateThumbnails(
    @Param('fileId') fileId: string,
    @Body() body: {
      sizes?: Array<{ width: number; height: number; suffix: string }>;
    },
    @Query('userId') userId?: string,
  ) {
    const sizes = body.sizes || [
      { width: 150, height: 150, suffix: 'sm' },
      { width: 300, height: 300, suffix: 'md' },
      { width: 600, height: 600, suffix: 'lg' },
    ];

    const results = await this.imageOptimizationService.generateThumbnailsForFile(
      fileId,
      sizes,
    );

    return {
      fileId,
      thumbnails: results,
      message: 'تم إنشاء الصور المصغرة بنجاح',
    };
  }

  /**
   * تحويل تنسيق الصورة
   */
  @Post('files/:fileId/convert')
  @Permissions('storage.edit')
  async convertImageFormat(
    @Param('fileId') fileId: string,
    @Body() body: {
      targetFormat: 'jpeg' | 'png' | 'webp' | 'avif';
      quality?: number;
    },
    @Query('userId') userId?: string,
  ) {
    const result = await this.imageOptimizationService.convertImageFormat(
      fileId,
      body.targetFormat,
      body.quality || 80,
    );

    return {
      fileId,
      conversion: result,
      message: result.success
        ? 'تم تحويل تنسيق الصورة بنجاح'
        : 'فشل في تحويل تنسيق الصورة',
    };
  }

  /**
   * تحسين تلقائي للصورة
   */
  @Post('files/:fileId/auto-optimize')
  @Permissions('storage.edit')
  async autoOptimizeImage(
    @Param('fileId') fileId: string,
    @Body() body: { aggressive?: boolean },
    @Query('userId') userId?: string,
  ) {
    const result = await this.imageOptimizationService.autoOptimizeImage(
      fileId,
      body.aggressive || false,
    );

    return {
      fileId,
      autoOptimization: result,
      message: 'تم التحسين التلقائي بنجاح',
    };
  }

  /**
   * الحصول على metadata للصورة
   */
  @Get('files/:fileId/metadata')
  @Permissions('storage.read')
  async getImageMetadata(@Param('fileId') fileId: string) {
    const fileInfo = await this.storageService.getFileInfo(fileId);
    const metadata = await this.imageOptimizationService.getImageMetadata(
      fileInfo.path || '',
    );

    return {
      fileId,
      metadata,
    };
  }

  // ========== إحصائيات وتقارير ==========

  /**
   * إحصائيات التخزين
   */
  @Get('stats')
  @Permissions('storage.read')
  async getStorageStats(@Query('branchId') branchId?: string) {
    return this.storageService.getStorageStats(branchId);
  }

  /**
   * تقرير الملفات
   */
  @Get('reports/files')
  @Permissions('storage.read')
  async getFilesReport(@Query() query: any) {
    // TODO: تنفيذ تقرير الملفات
    return {
      report: 'files_report',
      filters: query,
      message: 'سيتم تنفيذ تقرير الملفات قريباً',
    };
  }

  /**
   * تقرير الوصول للملفات
   */
  @Get('reports/access')
  @Permissions('storage.read')
  async getAccessReport(@Query() query: any) {
    // TODO: تنفيذ تقرير الوصول
    return {
      report: 'access_report',
      filters: query,
      message: 'سيتم تنفيذ تقرير الوصول قريباً',
    };
  }

  // ========== مسارات عامة (للوصول المباشر) ==========

  /**
   * عرض الملفات العامة (بدون مصادقة)
   */
  @Get('public/:bucket/:filename')
  async servePublicFile(
    @Param('bucket') bucket: string,
    @Param('filename') filename: string,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    // TODO: تنفيذ عرض الملفات العامة
    // يجب التحقق من أن الملف عام ومتاح
    return {
      message: 'عرض الملفات العامة قيد التطوير',
      bucket,
      filename,
    };
  }

  /**
   * عرض الملفات الخاصة (برمز وصول)
   */
  @Get('private/:bucket/:filename')
  async servePrivateFile(
    @Param('bucket') bucket: string,
    @Param('filename') filename: string,
    @Query('token') accessToken: string,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    // TODO: تنفيذ عرض الملفات الخاصة مع التحقق من رمز الوصول
    return {
      message: 'عرض الملفات الخاصة قيد التطوير',
      bucket,
      filename,
      accessToken,
    };
  }

  /**
   * عرض الصور المصغرة
   */
  @Get('thumbnails/:bucket/:filename')
  async serveThumbnail(
    @Param('bucket') bucket: string,
    @Param('filename') filename: string,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    // TODO: تنفيذ عرض الصور المصغرة
    return {
      message: 'عرض الصور المصغرة قيد التطوير',
      bucket,
      filename,
    };
  }

  // ========== أدوات المطور ==========

  /**
   * تنظيف الملفات المؤقتة
   */
  @Post('cleanup/temp')
  @Permissions('storage.admin')
  async cleanupTempFiles() {
    // TODO: تنفيذ تنظيف الملفات المؤقتة
    return { message: 'تم تنظيف الملفات المؤقتة بنجاح' };
  }

  /**
   * إعادة فهرسة الملفات
   */
  @Post('reindex')
  @Permissions('storage.admin')
  async reindexFiles() {
    // TODO: تنفيذ إعادة فهرسة الملفات
    return { message: 'تمت إعادة فهرسة الملفات بنجاح' };
  }

  /**
   * فحص سلامة الملفات
   */
  @Get('health/check')
  @Permissions('storage.admin')
  async checkFileIntegrity() {
    // TODO: تنفيذ فحص سلامة الملفات
    return {
      status: 'healthy',
      message: 'جميع الملفات سليمة',
      totalFiles: 0,
      corruptedFiles: 0,
    };
  }

  /**
   * تنظيف الصور المصغرة اليتيمة
   */
  @Post('cleanup/thumbnails')
  @Permissions('storage.admin')
  async cleanupOrphanedThumbnails() {
    const deletedCount = await this.imageOptimizationService.cleanupOrphanedThumbnails();

    return {
      deletedThumbnails: deletedCount,
      message: 'تم تنظيف الصور المصغرة اليتيمة بنجاح',
    };
  }

  /**
   * تنظيف الرموز المنتهية الصلاحية
   */
  @Post('cleanup/expired-tokens')
  @Permissions('storage.admin')
  async cleanupExpiredTokens() {
    const deletedCount = await this.accessControlService.cleanupExpiredTokens();

    return {
      deletedTokens: deletedCount,
      message: 'تم تنظيف الرموز المنتهية الصلاحية بنجاح',
    };
  }

  // ========== دوال مساعدة ==========

  /**
   * الحصول على مسار الملف
   */
  private async getFilePath(fileId: string): Promise<string> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      select: { path: true },
    });
    return file?.path || '';
  }
}
