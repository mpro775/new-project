import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

export interface UploadFileOptions {
  file: any; // Express.Multer.File
  category: string;
  entityType?: string;
  entityId?: string;
  isPublic?: boolean;
  bucket?: string;
  uploadedBy?: string;
  branchId?: string;
  metadata?: Record<string, any>;
}

export interface UploadResult {
  fileId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  checksum: string;
}

export interface FileInfo {
  id: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  category: string;
  entityType?: string;
  entityId?: string;
  isPublic: boolean;
  uploadedBy?: string;
  branchId?: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  filesByCategory: Record<string, number>;
  filesByType: Record<string, number>;
  storageUsedByProvider: Record<string, number>;
  recentUploads: Array<{
    id: string;
    originalName: string;
    size: number;
    uploadedAt: Date;
  }>;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir: string;
  private readonly tempDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    this.tempDir = path.join(this.uploadDir, 'temp');
    this.ensureDirectories();
  }

  /**
   * رفع ملف جديد
   */
  async uploadFile(options: UploadFileOptions): Promise<UploadResult> {
    try {
      this.logger.log(`رفع ملف: ${options.file.originalname}`);

      // التحقق من صحة الملف
      await this.validateFile(options.file, options.bucket);

      // إنشاء اسم ملف فريد
      const filename = this.generateUniqueFilename(options.file.originalname);
      const filePath = this.getFilePath(filename, options.bucket || 'default');

      // التأكد من وجود المجلد
      await this.ensureFileDirectory(filePath);

      // نقل الملف إلى الموقع النهائي
      await pipeline(
        createReadStream(options.file.path),
        createWriteStream(filePath)
      );

      // حساب checksum
      const checksum = await this.calculateChecksum(filePath);

      // حفظ معلومات الملف في قاعدة البيانات
      const fileRecord = await this.prisma.file.create({
        data: {
          originalName: options.file.originalname,
          filename,
          mimeType: options.file.mimetype,
          size: BigInt(options.file.size),
          extension: path.extname(options.file.originalname).toLowerCase(),
          path: filePath,
          url: this.generateFileUrl(filename, options.bucket, options.isPublic),
          bucket: options.bucket || 'default',
          storageProvider: 'local',
          category: options.category,
          entityType: options.entityType,
          entityId: options.entityId,
          metadata: options.metadata as any,
          checksum,
          isPublic: options.isPublic || false,
          uploadedBy: options.uploadedBy,
          branchId: options.branchId,
        },
      });

      // إنشاء صورة مصغرة إذا كان الملف صورة
      let thumbnailUrl: string | undefined;
      if (this.isImageFile(options.file.mimetype)) {
        thumbnailUrl = await this.generateThumbnail(fileRecord.id, filePath, filename, options.bucket);
        if (thumbnailUrl) {
          await this.prisma.file.update({
            where: { id: fileRecord.id },
            data: { thumbnailPath: thumbnailUrl },
          });
        }
      }

      // تحديث إحصائيات الحاوية
      await this.updateBucketStats(options.bucket || 'default');

      // تسجيل في سجل التدقيق
      await this.auditService.log({
        action: 'FILE_UPLOADED',
        entity: 'File',
        entityId: fileRecord.id,
        details: {
          filename: options.file.originalname,
          size: options.file.size,
          category: options.category,
          bucket: options.bucket,
        },
        module: 'storage',
        category: 'file_management',
      });

      // تنظيف الملف المؤقت
      await this.cleanupTempFile(options.file.path);

      this.logger.log(`تم رفع الملف بنجاح: ${fileRecord.id}`);

      return {
        fileId: fileRecord.id,
        filename: fileRecord.filename,
        originalName: fileRecord.originalName,
        mimeType: fileRecord.mimeType,
        size: Number(fileRecord.size),
        url: fileRecord.url || '',
        thumbnailUrl,
        checksum,
      };
    } catch (error) {
      this.logger.error(`فشل في رفع الملف: ${options.file.originalname}`, error);
      throw error;
    }
  }

  /**
   * تحميل ملف
   */
  async downloadFile(
    fileId: string,
    userId?: string,
    accessToken?: string,
  ): Promise<{
    stream: NodeJS.ReadableStream;
    filename: string;
    mimeType: string;
    size: number;
  }> {
    try {
      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new NotFoundException('الملف غير موجود');
      }

      // التحقق من صلاحية الوصول
      await this.checkFileAccess(file, userId, accessToken);

      // التحقق من وجود الملف
      try {
        await fs.access(file.path);
      } catch (error) {
        throw new NotFoundException('الملف غير موجود على النظام');
      }

      // تسجيل الوصول
      await this.logFileAccess(file.id, userId || accessToken || 'anonymous', 'download', 'api');

      const stream = createReadStream(file.path);

      return {
        stream,
        filename: file.originalName,
        mimeType: file.mimeType,
        size: Number(file.size),
      };
    } catch (error) {
      this.logger.error(`فشل في تحميل الملف: ${fileId}`, error);
      throw error;
    }
  }

  /**
   * حذف ملف
   */
  async deleteFile(fileId: string, deletedBy?: string): Promise<void> {
    try {
      this.logger.log(`حذف ملف: ${fileId}`);

      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new NotFoundException('الملف غير موجود');
      }

      // حذف الملف من النظام
      try {
        await fs.unlink(file.path);
      } catch (error) {
        this.logger.warn(`فشل في حذف الملف من النظام: ${file.path}`, error);
      }

      // حذف الصورة المصغرة إذا وجدت
      if (file.thumbnailPath) {
        try {
          await fs.unlink(file.thumbnailPath);
        } catch (error) {
          this.logger.warn(`فشل في حذف الصورة المصغرة: ${file.thumbnailPath}`, error);
        }
      }

      // حذف سجلات الإصدارات
      await this.prisma.fileVersion.deleteMany({
        where: { fileId },
      });

      // حذف سجلات الوصول
      await this.prisma.fileAccess.deleteMany({
        where: { fileId },
      });

      // حذف سجل الملف
      await this.prisma.file.delete({
        where: { id: fileId },
      });

      // تحديث إحصائيات الحاوية
      await this.updateBucketStats(file.bucket);

      // تسجيل في سجل التدقيق
      await this.auditService.log({
        action: 'FILE_DELETED',
        entity: 'File',
        entityId: fileId,
        details: {
          filename: file.originalName,
          size: Number(file.size),
          category: file.category,
        },
        module: 'storage',
        category: 'file_management',
      });

      this.logger.log(`تم حذف الملف بنجاح: ${fileId}`);
    } catch (error) {
      this.logger.error(`فشل في حذف الملف: ${fileId}`, error);
      throw error;
    }
  }

  /**
   * الحصول على معلومات ملف
   */
  async getFileInfo(fileId: string, userId?: string): Promise<FileInfo> {
    try {
      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new NotFoundException('الملف غير موجود');
      }

      // التحقق من صلاحية الوصول
      await this.checkFileAccess(file, userId);

      return {
        id: file.id,
        originalName: file.originalName,
        filename: file.filename,
        mimeType: file.mimeType,
        size: Number(file.size),
        url: file.url || '',
        thumbnailUrl: file.thumbnailPath ? this.generateThumbnailUrl(file.filename, file.bucket) : undefined,
        category: file.category,
        entityType: file.entityType || undefined,
        entityId: file.entityId || undefined,
        isPublic: file.isPublic,
        uploadedBy: file.uploadedBy || undefined,
        branchId: file.branchId || undefined,
        createdAt: file.createdAt,
        metadata: file.metadata as Record<string, any> | undefined,
      };
    } catch (error) {
      this.logger.error(`فشل في الحصول على معلومات الملف: ${fileId}`, error);
      throw error;
    }
  }

  /**
   * البحث في الملفات
   */
  async searchFiles(filters: {
    category?: string;
    entityType?: string;
    entityId?: string;
    uploadedBy?: string;
    branchId?: string;
    isPublic?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    files: FileInfo[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        category,
        entityType,
        entityId,
        uploadedBy,
        branchId,
        isPublic,
        search,
        page = 1,
        limit = 20,
      } = filters;

      const where: any = {};

      if (category) where.category = category;
      if (entityType) where.entityType = entityType;
      if (entityId) where.entityId = entityId;
      if (uploadedBy) where.uploadedBy = uploadedBy;
      if (branchId) where.branchId = branchId;
      if (isPublic !== undefined) where.isPublic = isPublic;

      if (search) {
        where.OR = [
          { originalName: { contains: search, mode: 'insensitive' } },
          { filename: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [files, total] = await Promise.all([
        this.prisma.file.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.file.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      const fileInfos: FileInfo[] = files.map(file => ({
        id: file.id,
        originalName: file.originalName,
        filename: file.filename,
        mimeType: file.mimeType,
        size: Number(file.size),
        url: file.url || '',
        thumbnailUrl: file.thumbnailPath ? this.generateThumbnailUrl(file.filename, file.bucket) : undefined,
        category: file.category,
        entityType: file.entityType || undefined,
        entityId: file.entityId || undefined,
        isPublic: file.isPublic,
        uploadedBy: file.uploadedBy || undefined,
        branchId: file.branchId || undefined,
        createdAt: file.createdAt,
        metadata: file.metadata as Record<string, any> | undefined,
      }));

      return {
        files: fileInfos,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error('فشل في البحث في الملفات', error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات التخزين
   */
  async getStorageStats(branchId?: string): Promise<StorageStats> {
    try {
      const where: any = {};
      if (branchId) where.branchId = branchId;

      const files = await this.prisma.file.findMany({
        where,
        select: {
          category: true,
          mimeType: true,
          storageProvider: true,
          size: true,
          createdAt: true,
          originalName: true,
          id: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10, // آخر 10 ملفات
      });

      const totalFiles = await this.prisma.file.count({ where });
      const totalSizeResult = await this.prisma.file.aggregate({
        where,
        _sum: { size: true },
      });

      const filesByCategory: Record<string, number> = {};
      const filesByType: Record<string, number> = {};
      const storageUsedByProvider: Record<string, number> = {};

      files.forEach(file => {
        // تصنيف حسب الفئة
        filesByCategory[file.category] = (filesByCategory[file.category] || 0) + 1;

        // تصنيف حسب النوع
        const type = this.getFileTypeFromMime(file.mimeType);
        filesByType[type] = (filesByType[type] || 0) + 1;

        // حجم التخزين حسب المزود
        storageUsedByProvider[file.storageProvider] = (storageUsedByProvider[file.storageProvider] || 0) + Number(file.size);
      });

      const recentUploads = files.slice(0, 10).map(file => ({
        id: file.id,
        originalName: file.originalName,
        size: Number(file.size),
        uploadedAt: file.createdAt,
      }));

      return {
        totalFiles,
        totalSize: Number(totalSizeResult._sum.size || 0),
        filesByCategory,
        filesByType,
        storageUsedByProvider,
        recentUploads,
      };
    } catch (error) {
      this.logger.error('فشل في حساب إحصائيات التخزين', error);
      throw error;
    }
  }

  /**
   * إنشاء رابط مؤقت للوصول لملف خاص
   */
  async generateAccessToken(
    fileId: string,
    expiresInMinutes: number = 60,
    generatedBy?: string,
  ): Promise<string> {
    try {
      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new NotFoundException('الملف غير موجود');
      }

      if (file.isPublic) {
        throw new BadRequestException('لا يمكن إنشاء رمز وصول لملف عام');
      }

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

      const accessToken = crypto.randomBytes(32).toString('hex');

      await this.prisma.file.update({
        where: { id: fileId },
        data: {
          accessToken,
          expiresAt,
          updatedAt: new Date(),
        },
      });

      // تسجيل في سجل التدقيق
      await this.auditService.log({
        action: 'ACCESS_TOKEN_GENERATED',
        entity: 'File',
        entityId: fileId,
        details: {
          expiresAt,
          generatedBy,
        },
        module: 'storage',
        category: 'access_control',
      });

      return accessToken;
    } catch (error) {
      this.logger.error(`فشل في إنشاء رمز الوصول: ${fileId}`, error);
      throw error;
    }
  }

  /**
   * التحقق من صحة رمز الوصول
   */
  async validateAccessToken(fileId: string, accessToken: string): Promise<boolean> {
    try {
      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file || !file.accessToken || file.accessToken !== accessToken) {
        return false;
      }

      if (file.expiresAt && file.expiresAt < new Date()) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`فشل في التحقق من رمز الوصول: ${fileId}`, error);
      return false;
    }
  }

  // ========== PRIVATE METHODS ==========

  /**
   * التأكد من وجود المجلدات المطلوبة
   */
  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      this.logger.error('فشل في إنشاء مجلدات التخزين', error);
    }
  }

  /**
   * التحقق من صحة الملف
   */
  private async validateFile(file: any, bucket?: string): Promise<void> {
    // التحقق من حجم الملف
    const maxSize = this.configService.get<number>('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException(`حجم الملف كبير جداً. الحد الأقصى: ${maxSize} بايت`);
    }

    // التحقق من نوع الملف
    const allowedTypes = this.configService.get<string[]>('ALLOWED_FILE_TYPES', []);
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(`نوع الملف غير مسموح: ${file.mimetype}`);
    }

    // التحقق من الحاوية إذا تم تحديدها
    if (bucket) {
      await this.validateBucket(bucket);
    }
  }

  /**
   * التحقق من صحة الحاوية
   */
  private async validateBucket(bucketName: string): Promise<void> {
    // TODO: التحقق من إعدادات الحاوية من قاعدة البيانات
    // للآن، نقبل أي اسم حاوية
  }

  /**
   * إنشاء اسم ملف فريد
   */
  private generateUniqueFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');

    return `${baseName}_${timestamp}_${random}${ext}`;
  }

  /**
   * الحصول على مسار الملف
   */
  private getFilePath(filename: string, bucket: string): string {
    return path.join(this.uploadDir, bucket, filename);
  }

  /**
   * التأكد من وجود مجلد الملف
   */
  private async ensureFileDirectory(filePath: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
  }

  /**
   * إنشاء رابط URL للملف
   */
  private generateFileUrl(filename: string, bucket?: string, isPublic?: boolean): string {
    const baseUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');

    if (isPublic) {
      return `${baseUrl}/storage/public/${bucket || 'default'}/${filename}`;
    } else {
      return `${baseUrl}/storage/private/${bucket || 'default'}/${filename}`;
    }
  }

  /**
   * إنشاء رابط URL للصورة المصغرة
   */
  private generateThumbnailUrl(filename: string, bucket?: string): string {
    const baseUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
    const thumbnailName = `thumb_${filename}`;

    return `${baseUrl}/storage/thumbnails/${bucket || 'default'}/${thumbnailName}`;
  }

  /**
   * حساب checksum للملف
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash('md5').update(fileBuffer).digest('hex');
  }

  /**
   * التحقق من أن الملف صورة
   */
  private isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * إنشاء صورة مصغرة
   */
  private async generateThumbnail(
    fileId: string,
    filePath: string,
    filename: string,
    bucket?: string,
  ): Promise<string | undefined> {
    try {
      // TODO: استخدام مكتبة sharp لإنشاء الصور المصغرة
      // للآن، نرجع undefined
      return undefined;
    } catch (error) {
      this.logger.warn(`فشل في إنشاء الصورة المصغرة للملف: ${fileId}`, error);
      return undefined;
    }
  }

  /**
   * تحديث إحصائيات الحاوية
   */
  private async updateBucketStats(bucketName: string): Promise<void> {
    try {
      // TODO: تحديث إحصائيات الحاوية في قاعدة البيانات
      // حساب العدد الإجمالي للملفات وحجمها
    } catch (error) {
      this.logger.warn(`فشل في تحديث إحصائيات الحاوية: ${bucketName}`, error);
    }
  }

  /**
   * تنظيف الملف المؤقت
   */
  private async cleanupTempFile(tempPath: string): Promise<void> {
    try {
      await fs.unlink(tempPath);
    } catch (error) {
      this.logger.warn(`فشل في حذف الملف المؤقت: ${tempPath}`, error);
    }
  }

  /**
   * التحقق من صلاحية الوصول للملف
   */
  private async checkFileAccess(
    file: any,
    userId?: string,
    accessToken?: string,
  ): Promise<void> {
    // الملفات العامة متاحة للجميع
    if (file.isPublic) {
      return;
    }

    // التحقق من رمز الوصول للملفات الخاصة
    if (accessToken && file.accessToken === accessToken) {
      if (file.expiresAt && file.expiresAt < new Date()) {
        throw new ForbiddenException('انتهت صلاحية رمز الوصول');
      }
      return;
    }

    // التحقق من ملكية الملف
    if (userId && file.uploadedBy === userId) {
      return;
    }

    throw new ForbiddenException('ليس لديك صلاحية الوصول لهذا الملف');
  }

  /**
   * تسجيل الوصول للملف
   */
  private async logFileAccess(
    fileId: string,
    accessedBy: string,
    accessType: string,
    accessMethod: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      await this.prisma.fileAccess.create({
        data: {
          fileId,
          accessedBy,
          accessType,
          accessMethod,
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      this.logger.warn(`فشل في تسجيل الوصول للملف: ${fileId}`, error);
    }
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
