import { Injectable } from '@nestjs/common';
import {
  MulterModuleOptions,
  MulterOptionsFactory,
} from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { createUploadConfig, FileValidationOptions } from './file-upload.utils';

@Injectable()
export class MulterConfigService implements MulterOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createMulterOptions(): MulterModuleOptions {
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads/temp');
    const maxFileSize = this.configService.get<number>('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10MB

    // إعدادات التحقق من الملفات
    const validationOptions: FileValidationOptions = {
      maxSize: maxFileSize,
      allowedTypes: this.getAllowedMimeTypes(),
      allowedExtensions: this.getAllowedExtensions(),
    };

    return createUploadConfig(uploadDir, validationOptions);
  }

  /**
   * الحصول على أنواع MIME المسموحة
   */
  private getAllowedMimeTypes(): string[] {
    const allowedTypes = this.configService.get<string>('ALLOWED_MIME_TYPES');

    if (!allowedTypes) {
      // القائمة الافتراضية
      return [
        // صور
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',

        // فيديو
        'video/mp4',
        'video/avi',
        'video/mov',
        'video/wmv',

        // صوت
        'audio/mp3',
        'audio/wav',
        'audio/ogg',
        'audio/m4a',

        // مستندات
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',

        // نصوص
        'text/plain',
        'text/csv',
        'application/json',

        // أرشيف
        'application/zip',
        'application/x-zip-compressed',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
      ];
    }

    return allowedTypes.split(',').map(type => type.trim());
  }

  /**
   * الحصول على الامتدادات المسموحة
   */
  private getAllowedExtensions(): string[] {
    const allowedExt = this.configService.get<string>('ALLOWED_EXTENSIONS');

    if (!allowedExt) {
      // القائمة الافتراضية
      return [
        // صور
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',

        // فيديو
        'mp4', 'avi', 'mov', 'wmv', 'mkv',

        // صوت
        'mp3', 'wav', 'ogg', 'm4a', 'aac',

        // مستندات
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',

        // نصوص
        'txt', 'csv', 'json', 'xml',

        // أرشيف
        'zip', 'rar', '7z', 'tar', 'gz',
      ];
    }

    return allowedExt.split(',').map(ext => ext.trim().toLowerCase());
  }
}

/**
 * إعدادات رفع الملفات للصور فقط
 */
export function createImageUploadConfig(configService: ConfigService) {
  const uploadDir = configService.get<string>('UPLOAD_DIR', './uploads/temp');
  const maxFileSize = configService.get<number>('MAX_IMAGE_SIZE', 5 * 1024 * 1024); // 5MB

  const validationOptions: FileValidationOptions = {
    maxSize: maxFileSize,
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  };

  return createUploadConfig(`${uploadDir}/images`, validationOptions);
}

/**
 * إعدادات رفع الملفات للمستندات فقط
 */
export function createDocumentUploadConfig(configService: ConfigService) {
  const uploadDir = configService.get<string>('UPLOAD_DIR', './uploads/temp');
  const maxFileSize = configService.get<number>('MAX_DOCUMENT_SIZE', 20 * 1024 * 1024); // 20MB

  const validationOptions: FileValidationOptions = {
    maxSize: maxFileSize,
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
    ],
    allowedExtensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'],
  };

  return createUploadConfig(`${uploadDir}/documents`, validationOptions);
}

/**
 * إعدادات رفع الملفات للفيديو
 */
export function createVideoUploadConfig(configService: ConfigService) {
  const uploadDir = configService.get<string>('UPLOAD_DIR', './uploads/temp');
  const maxFileSize = configService.get<number>('MAX_VIDEO_SIZE', 100 * 1024 * 1024); // 100MB

  const validationOptions: FileValidationOptions = {
    maxSize: maxFileSize,
    allowedTypes: [
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/mkv',
      'video/webm',
    ],
    allowedExtensions: ['mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm'],
  };

  return createUploadConfig(`${uploadDir}/videos`, validationOptions);
}
