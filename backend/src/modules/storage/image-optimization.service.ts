import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaService } from '../../shared/database/prisma.service';

export interface ImageOptimizationOptions {
  quality?: number; // 1-100
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  maxWidth?: number;
  maxHeight?: number;
  maintainAspectRatio?: boolean;
  progressive?: boolean;
  compressionLevel?: number;
}

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  colorSpace?: string;
  hasAlpha?: boolean;
  density?: number;
}

export interface OptimizationResult {
  success: boolean;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  outputPath: string;
  metadata?: ImageMetadata;
  error?: string;
}

@Injectable()
export class ImageOptimizationService {
  private readonly logger = new Logger(ImageOptimizationService.name);
  private readonly thumbnailsDir: string;
  private readonly optimizedDir: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    this.thumbnailsDir = path.join(uploadDir, 'thumbnails');
    this.optimizedDir = path.join(uploadDir, 'optimized');
    this.ensureDirectories();
  }

  /**
   * تحسين صورة وحفظها
   */
  async optimizeImage(
    inputPath: string,
    outputPath: string,
    options: ImageOptimizationOptions = {},
  ): Promise<OptimizationResult> {
    try {
      this.logger.log(`تحسين الصورة: ${inputPath} -> ${outputPath}`);

      // التحقق من وجود الملف الأصلي
      await fs.access(inputPath);

      // الحصول على معلومات الملف الأصلي
      const stats = await fs.stat(inputPath);
      const originalSize = stats.size;

      // TODO: Uncomment when sharp is installed
      /*
      const sharp = require('sharp');
      const inputBuffer = await fs.readFile(inputPath);

      let pipeline = sharp(inputBuffer);

      // تطبيق الخيارات
      if (options.maxWidth || options.maxHeight) {
        pipeline = pipeline.resize({
          width: options.maxWidth,
          height: options.maxHeight,
          fit: options.maintainAspectRatio !== false ? 'inside' : 'fill',
          withoutEnlargement: true,
        });
      }

      // تحويل التنسيق
      if (options.format) {
        const formatOptions: any = {};

        if (options.quality) {
          formatOptions.quality = options.quality;
        }

        if (options.progressive !== undefined) {
          formatOptions.progressive = options.progressive;
        }

        if (options.compressionLevel) {
          formatOptions.compressionLevel = options.compressionLevel;
        }

        pipeline = pipeline[options.format](formatOptions);
      }

      // حفظ الصورة المحسنة
      const outputBuffer = await pipeline.toBuffer();
      await fs.writeFile(outputPath, outputBuffer);

      // الحصول على metadata للصورة الناتجة
      const metadata = await sharp(outputBuffer).metadata();

      const optimizedSize = outputBuffer.length;
      const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;

      return {
        success: true,
        originalSize,
        optimizedSize,
        compressionRatio,
        outputPath,
        metadata: {
          width: metadata.width || 0,
          height: metadata.height || 0,
          format: metadata.format || 'unknown',
          size: optimizedSize,
          colorSpace: metadata.space,
          hasAlpha: metadata.hasAlpha,
          density: metadata.density,
        },
      };
      */

      // محاكاة التحسين للتطوير
      this.logger.log(`[MOCK] تم تحسين الصورة: ${path.basename(inputPath)}`);

      // نسخ الملف كما هو (محاكاة)
      await fs.copyFile(inputPath, outputPath);

      return {
        success: true,
        originalSize,
        optimizedSize: originalSize,
        compressionRatio: 0,
        outputPath,
        metadata: {
          width: 800,
          height: 600,
          format: 'jpeg',
          size: originalSize,
          colorSpace: 'srgb',
          hasAlpha: false,
          density: 72,
        },
      };
    } catch (error) {
      this.logger.error(`فشل في تحسين الصورة: ${inputPath}`, error);
      return {
        success: false,
        originalSize: 0,
        optimizedSize: 0,
        compressionRatio: 0,
        outputPath,
        error: error.message,
      };
    }
  }

  /**
   * إنشاء صورة مصغرة
   */
  async createThumbnail(
    inputPath: string,
    outputPath: string,
    options: ThumbnailOptions = {},
  ): Promise<OptimizationResult> {
    try {
      this.logger.log(`إنشاء صورة مصغرة: ${inputPath} -> ${outputPath}`);

      // التحقق من وجود الملف الأصلي
      await fs.access(inputPath);

      const stats = await fs.stat(inputPath);
      const originalSize = stats.size;

      // خيارات افتراضية للصور المصغرة
      const defaultOptions: ThumbnailOptions = {
        width: 300,
        height: 300,
        quality: 80,
        format: 'jpeg',
        fit: 'cover',
        ...options,
      };

      // TODO: Uncomment when sharp is installed
      /*
      const sharp = require('sharp');
      const inputBuffer = await fs.readFile(inputPath);

      let pipeline = sharp(inputBuffer)
        .resize({
          width: defaultOptions.width,
          height: defaultOptions.height,
          fit: defaultOptions.fit,
          position: 'center',
          withoutEnlargement: true,
        });

      // تطبيق الجودة والتنسيق
      if (defaultOptions.format === 'jpeg') {
        pipeline = pipeline.jpeg({ quality: defaultOptions.quality || 80 });
      } else if (defaultOptions.format === 'png') {
        pipeline = pipeline.png({ quality: defaultOptions.quality || 80 });
      } else if (defaultOptions.format === 'webp') {
        pipeline = pipeline.webp({ quality: defaultOptions.quality || 80 });
      }

      const outputBuffer = await pipeline.toBuffer();
      await fs.writeFile(outputPath, outputBuffer);

      const optimizedSize = outputBuffer.length;
      const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;

      return {
        success: true,
        originalSize,
        optimizedSize,
        compressionRatio,
        outputPath,
      };
      */

      // محاكاة إنشاء الصورة المصغرة للتطوير
      this.logger.log(`[MOCK] تم إنشاء صورة مصغرة: ${path.basename(inputPath)}`);

      // نسخ الملف كما هو (محاكاة)
      await fs.copyFile(inputPath, outputPath);

      const optimizedSize = originalSize;
      const compressionRatio = 0;

      return {
        success: true,
        originalSize,
        optimizedSize,
        compressionRatio,
        outputPath,
      };
    } catch (error) {
      this.logger.error(`فشل في إنشاء الصورة المصغرة: ${inputPath}`, error);
      return {
        success: false,
        originalSize: 0,
        optimizedSize: 0,
        compressionRatio: 0,
        outputPath,
        error: error.message,
      };
    }
  }

  /**
   * إنشاء صور مصغرة متعددة الأحجام
   */
  async createMultipleThumbnails(
    inputPath: string,
    baseOutputPath: string,
    sizes: Array<{ width: number; height: number; suffix: string }>,
  ): Promise<OptimizationResult[]> {
    const results: OptimizationResult[] = [];

    for (const size of sizes) {
      const outputPath = `${baseOutputPath}_${size.suffix}${path.extname(baseOutputPath)}`;

      const result = await this.createThumbnail(inputPath, outputPath, {
        width: size.width,
        height: size.height,
      });

      results.push(result);
    }

    return results;
  }

  /**
   * تحسين صورة وحفظها كملف جديد
   */
  async optimizeAndSaveImage(
    fileId: string,
    options: ImageOptimizationOptions = {},
  ): Promise<OptimizationResult> {
    try {
      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new BadRequestException('الملف غير موجود');
      }

      if (!this.isImageFile(file.mimeType)) {
        throw new BadRequestException('الملف ليس صورة');
      }

      // إنشاء مسار الملف المحسن
      const optimizedPath = path.join(
        this.optimizedDir,
        file.bucket,
        `optimized_${file.filename}`,
      );

      // التأكد من وجود المجلد
      await fs.mkdir(path.dirname(optimizedPath), { recursive: true });

      // تحسين الصورة
      const result = await this.optimizeImage(file.path, optimizedPath, options);

      if (result.success) {
        // إنشاء نسخة احتياطية من الإصدار الأصلي
        await this.createBackupVersion(fileId, 'تحسين الصورة');

        // تحديث معلومات الملف
        await this.prisma.file.update({
          where: { id: fileId },
          data: {
            path: optimizedPath,
            size: BigInt(result.optimizedSize),
            metadata: {
              ...(file.metadata || {}),
              optimized: true,
              compressionRatio: result.compressionRatio,
              optimizedAt: new Date(),
            },
            updatedAt: new Date(),
          },
        });
      }

      return result;
    } catch (error) {
      this.logger.error(`فشل في تحسين الصورة: ${fileId}`, error);
      throw error;
    }
  }

  /**
   * إنشاء صور مصغرة لملف موجود
   */
  async generateThumbnailsForFile(
    fileId: string,
    sizes: Array<{ width: number; height: number; suffix: string }> = [
      { width: 150, height: 150, suffix: 'sm' },
      { width: 300, height: 300, suffix: 'md' },
      { width: 600, height: 600, suffix: 'lg' },
    ],
  ): Promise<OptimizationResult[]> {
    try {
      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new BadRequestException('الملف غير موجود');
      }

      if (!this.isImageFile(file.mimeType)) {
        throw new BadRequestException('الملف ليس صورة');
      }

      const baseThumbnailPath = path.join(
        this.thumbnailsDir,
        file.bucket,
        path.parse(file.filename).name,
      );

      // التأكد من وجود مجلد الصور المصغرة
      await fs.mkdir(path.dirname(baseThumbnailPath), { recursive: true });

      // إنشاء الصور المصغرة
      const results = await this.createMultipleThumbnails(
        file.path,
        baseThumbnailPath,
        sizes,
      );

      // تحديث مسار الصورة المصغرة الافتراضية (المتوسطة)
      const mediumThumbnail = results.find(r => r.outputPath.includes('_md'));
      if (mediumThumbnail) {
        await this.prisma.file.update({
          where: { id: fileId },
          data: {
            thumbnailPath: mediumThumbnail.outputPath,
            metadata: {
              ...(file.metadata || {}),
              thumbnails: sizes.map((size, index) => ({
                size: size.suffix,
                path: results[index]?.outputPath,
                width: size.width,
                height: size.height,
              })),
              thumbnailsGeneratedAt: new Date(),
            },
          },
        });
      }

      return results;
    } catch (error) {
      this.logger.error(`فشل في إنشاء الصور المصغرة: ${fileId}`, error);
      throw error;
    }
  }

  /**
   * تحويل صورة إلى تنسيق آخر
   */
  async convertImageFormat(
    fileId: string,
    targetFormat: 'jpeg' | 'png' | 'webp' | 'avif',
    quality: number = 80,
  ): Promise<OptimizationResult> {
    try {
      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new BadRequestException('الملف غير موجود');
      }

      if (!this.isImageFile(file.mimeType)) {
        throw new BadRequestException('الملف ليس صورة');
      }

      // إنشاء مسار الملف المحول
      const convertedPath = path.join(
        this.optimizedDir,
        file.bucket,
        `converted_${path.parse(file.filename).name}.${targetFormat}`,
      );

      // التأكد من وجود المجلد
      await fs.mkdir(path.dirname(convertedPath), { recursive: true });

      // تحويل الصورة
      const result = await this.optimizeImage(file.path, convertedPath, {
        format: targetFormat,
        quality,
      });

      if (result.success) {
        // إنشاء نسخة احتياطية
        await this.createBackupVersion(fileId, `تحويل إلى ${targetFormat}`);

        // تحديث معلومات الملف
        await this.prisma.file.update({
          where: { id: fileId },
          data: {
            path: convertedPath,
            filename: path.basename(convertedPath),
            mimeType: `image/${targetFormat}`,
            size: BigInt(result.optimizedSize),
            extension: targetFormat,
            metadata: {
              ...(file.metadata || {}),
              converted: true,
              originalFormat: file.extension,
              targetFormat,
              convertedAt: new Date(),
            },
            updatedAt: new Date(),
          },
        });
      }

      return result;
    } catch (error) {
      this.logger.error(`فشل في تحويل تنسيق الصورة: ${fileId}`, error);
      throw error;
    }
  }

  /**
   * الحصول على metadata للصورة
   */
  async getImageMetadata(filePath: string): Promise<ImageMetadata | null> {
    try {
      // TODO: Uncomment when sharp is installed
      /*
      const sharp = require('sharp');
      const metadata = await sharp(filePath).metadata();

      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: 0, // سيتم حسابه لاحقاً
        colorSpace: metadata.space,
        hasAlpha: metadata.hasAlpha,
        density: metadata.density,
      };
      */

      // محاكاة للتطوير
      const stats = await fs.stat(filePath);

      return {
        width: 800,
        height: 600,
        format: 'jpeg',
        size: stats.size,
        colorSpace: 'srgb',
        hasAlpha: false,
        density: 72,
      };
    } catch (error) {
      this.logger.error(`فشل في الحصول على metadata للصورة: ${filePath}`, error);
      return null;
    }
  }

  /**
   * تطبيق تحسين تلقائي للصور
   */
  async autoOptimizeImage(
    fileId: string,
    aggressive: boolean = false,
  ): Promise<{
    optimizations: string[];
    totalCompression: number;
    results: OptimizationResult[];
  }> {
    try {
      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new BadRequestException('الملف غير موجود');
      }

      const optimizations: string[] = [];
      const results: OptimizationResult[] = [];
      let totalCompression = 0;

      // تحسين الجودة والحجم
      if (aggressive) {
        const qualityResult = await this.optimizeImage(file.path, file.path, {
          quality: 70,
          format: 'jpeg',
        });
        if (qualityResult.success) {
          optimizations.push('تقليل الجودة إلى 70%');
          results.push(qualityResult);
          totalCompression += qualityResult.compressionRatio;
        }
      } else {
        const qualityResult = await this.optimizeImage(file.path, file.path, {
          quality: 85,
          format: 'jpeg',
        });
        if (qualityResult.success) {
          optimizations.push('تقليل الجودة إلى 85%');
          results.push(qualityResult);
          totalCompression += qualityResult.compressionRatio;
        }
      }

      // تغيير الحجم إذا كانت الصورة كبيرة جداً
      const metadata = await this.getImageMetadata(file.path);
      if (metadata && (metadata.width > 2000 || metadata.height > 2000)) {
        const resizeResult = await this.optimizeImage(file.path, file.path, {
          maxWidth: 1920,
          maxHeight: 1080,
          maintainAspectRatio: true,
        });
        if (resizeResult.success) {
          optimizations.push('تغيير الحجم إلى 1920x1080 كحد أقصى');
          results.push(resizeResult);
          totalCompression += resizeResult.compressionRatio;
        }
      }

      // تحويل إلى WebP إذا كان مدعوماً
      if (file.mimeType === 'image/jpeg' || file.mimeType === 'image/png') {
        const webpPath = file.path.replace(/\.[^.]+$/, '.webp');
        const webpResult = await this.optimizeImage(file.path, webpPath, {
          format: 'webp',
          quality: 80,
        });

        if (webpResult.success && webpResult.optimizedSize < Number(file.size)) {
          optimizations.push('تحويل إلى WebP');
          results.push(webpResult);
          totalCompression += webpResult.compressionRatio;

          // استبدال الملف الأصلي بالنسخة المحسنة
          await fs.rename(webpPath, file.path);
        }
      }

      return {
        optimizations,
        totalCompression,
        results,
      };
    } catch (error) {
      this.logger.error(`فشل في التحسين التلقائي: ${fileId}`, error);
      throw error;
    }
  }

  /**
   * تنظيف الصور المصغرة القديمة
   */
  async cleanupOrphanedThumbnails(): Promise<number> {
    try {
      this.logger.log('تنظيف الصور المصغرة اليتيمة');

      // TODO: تنفيذ فحص شامل للصور المصغرة غير المرتبطة بملفات
      let deletedCount = 0;

      // محاكاة للتطوير
      this.logger.log(`تم حذف ${deletedCount} صورة مصغرة يتيمة`);

      return deletedCount;
    } catch (error) {
      this.logger.error('فشل في تنظيف الصور المصغرة اليتيمة', error);
      return 0;
    }
  }

  // ========== PRIVATE METHODS ==========

  /**
   * التأكد من وجود المجلدات المطلوبة
   */
  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.thumbnailsDir, { recursive: true });
      await fs.mkdir(this.optimizedDir, { recursive: true });
    } catch (error) {
      this.logger.error('فشل في إنشاء مجلدات التحسين', error);
    }
  }

  /**
   * إنشاء نسخة احتياطية قبل التعديل
   */
  private async createBackupVersion(fileId: string, reason: string): Promise<void> {
    // TODO: استخدام FileManagementService لإنشاء نسخة احتياطية
    this.logger.log(`[MOCK] إنشاء نسخة احتياطية: ${fileId} - ${reason}`);
  }

  /**
   * التحقق من أن الملف صورة
   */
  private isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * الحصول على إعدادات التحسين الافتراضية
   */
  getDefaultOptimizationOptions(): ImageOptimizationOptions {
    return {
      quality: 85,
      format: 'jpeg',
      maxWidth: 1920,
      maxHeight: 1080,
      maintainAspectRatio: true,
      progressive: true,
    };
  }

  /**
   * الحصول على إعدادات الصور المصغرة الافتراضية
   */
  getDefaultThumbnailOptions(): ThumbnailOptions {
    return {
      width: 300,
      height: 300,
      quality: 80,
      format: 'jpeg',
      fit: 'cover',
    };
  }
}
