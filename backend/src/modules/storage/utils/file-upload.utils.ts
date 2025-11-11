import { diskStorage } from 'multer';
import * as path from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import { BadRequestException } from '@nestjs/common';

export interface FileValidationOptions {
  maxSize?: number; // بالبايت
  allowedTypes?: string[]; // أنواع MIME المسموحة
  allowedExtensions?: string[]; // الامتدادات المسموحة
}

export interface FileUploadConfig {
  dest: string;
  filename?: (req: any, file: any, cb: (error: Error | null, filename: string) => void) => void;
  fileFilter?: (req: any, file: any, cb: (error: Error | null, acceptFile: boolean) => void) => void;
  limits?: {
    fileSize?: number;
    files?: number;
  };
}

/**
 * إنشاء إعدادات تخزين Multer
 */
export function createStorageConfig(uploadDir: string = './uploads/temp') {
  return diskStorage({
    destination: async (req, file, cb) => {
      try {
        // التأكد من وجود المجلد
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
      } catch (error) {
        cb(error as Error, uploadDir);
      }
    },
    filename: (req, file, cb) => {
      // إنشاء اسم ملف فريد مع timestamp
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      const timestamp = Date.now();
      const random = crypto.randomBytes(4).toString('hex');

      const filename = `${baseName}_${timestamp}_${random}${ext}`;
      cb(null, filename);
    },
  });
}

/**
 * إنشاء مرشح الملفات
 */
export function createFileFilter(options: FileValidationOptions = {}) {
  return (req: any, file: any, cb: (error: Error | null, acceptFile: boolean) => void) => {
    try {
      // التحقق من نوع MIME
      if (options.allowedTypes && options.allowedTypes.length > 0) {
        if (!options.allowedTypes.includes(file.mimetype)) {
          return cb(new BadRequestException(
            `نوع الملف غير مسموح: ${file.mimetype}. الأنواع المسموحة: ${options.allowedTypes.join(', ')}`
          ), false);
        }
      }

      // التحقق من الامتداد
      if (options.allowedExtensions && options.allowedExtensions.length > 0) {
        const ext = path.extname(file.originalname).toLowerCase().substring(1);
        if (!options.allowedExtensions.includes(ext)) {
          return cb(new BadRequestException(
            `امتداد الملف غير مسموح: ${ext}. الامتدادات المسموحة: ${options.allowedExtensions.join(', ')}`
          ), false);
        }
      }

      cb(null, true);
    } catch (error) {
      cb(error as Error, false);
    }
  };
}

/**
 * إنشاء إعدادات رفع الملفات الكاملة
 */
export function createUploadConfig(
  uploadDir: string = './uploads/temp',
  validationOptions: FileValidationOptions = {}
): FileUploadConfig {
  const defaultMaxSize = 10 * 1024 * 1024; // 10MB

  return {
    dest: uploadDir,
    fileFilter: createFileFilter(validationOptions),
    limits: {
      fileSize: validationOptions.maxSize || defaultMaxSize,
      files: 10, // حد أقصى 10 ملفات
    },
  };
}

/**
 * التحقق من صحة الملف بعد الرفع
 */
export async function validateUploadedFile(
  file: any,
  options: FileValidationOptions = {}
): Promise<void> {
  // التحقق من حجم الملف
  if (options.maxSize && file.size > options.maxSize) {
    throw new BadRequestException(
      `حجم الملف كبير جداً. الحد الأقصى: ${formatFileSize(options.maxSize)}, الحجم الحالي: ${formatFileSize(file.size)}`
    );
  }

  // التحقق من سلامة الملف (أساسي)
  if (!file.filename || !file.originalname) {
    throw new BadRequestException('معلومات الملف غير كاملة');
  }

  // التحقق من أن الملف ليس فارغاً
  if (file.size === 0) {
    throw new BadRequestException('لا يمكن رفع ملف فارغ');
  }
}

/**
 * تنسيق حجم الملف للعرض
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * الحصول على معلومات الملف
 */
export function getFileInfo(file: any) {
  const ext = path.extname(file.originalname).toLowerCase();
  const baseName = path.basename(file.originalname, ext);

  return {
    originalName: file.originalname,
    filename: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    extension: ext,
    baseName,
    isImage: file.mimetype.startsWith('image/'),
    isVideo: file.mimetype.startsWith('video/'),
    isAudio: file.mimetype.startsWith('audio/'),
    isDocument: isDocumentFile(file.mimetype),
    isArchive: isArchiveFile(file.mimetype),
  };
}

/**
 * التحقق من أن الملف مستند
 */
function isDocumentFile(mimeType: string): boolean {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
  ];

  return documentTypes.includes(mimeType);
}

/**
 * التحقق من أن الملف أرشيف
 */
function isArchiveFile(mimeType: string): boolean {
  const archiveTypes = [
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/gzip',
    'application/x-tar',
  ];

  return archiveTypes.includes(mimeType);
}

/**
 * إنشاء اسم ملف آمن
 */
export function createSafeFilename(originalName: string): string {
  // إزالة الأحرف الخاصة والمسافات
  let safeName = originalName
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    .replace(/\s+/g, '_')
    .toLowerCase();

  // التأكد من عدم وجود أحرف خاصة في البداية أو النهاية
  safeName = safeName.replace(/^[_.-]+|[_.-]+$/g, '');

  // التأكد من وجود امتداد
  if (!path.extname(safeName)) {
    safeName += '.bin';
  }

  return safeName;
}

/**
 * التحقق من أمان الملف (أساسي)
 */
export async function basicSecurityCheck(file: any): Promise<void> {
  // التحقق من أن اسم الملف لا يحتوي على مسارات خطيرة
  if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
    throw new BadRequestException('اسم الملف غير آمن');
  }

  // التحقق من حجم اسم الملف
  if (file.originalname.length > 255) {
    throw new BadRequestException('اسم الملف طويل جداً');
  }

  // TODO: إضافة المزيد من فحوصات الأمان
  // - فحص فيروس
  // - فحص نوع الملف الحقيقي
  // - فحص metadata
}

/**
 * تنظيف الملفات المؤقتة القديمة
 */
export async function cleanupTempFiles(tempDir: string, maxAgeHours: number = 24): Promise<void> {
  try {
    const files = await fs.readdir(tempDir);
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);

      if (now - stats.mtime.getTime() > maxAgeMs) {
        await fs.unlink(filePath);
      }
    }
  } catch (error) {
    // لا نرمي خطأ في حالة فشل التنظيف
    console.warn('فشل في تنظيف الملفات المؤقتة:', error);
  }
}
