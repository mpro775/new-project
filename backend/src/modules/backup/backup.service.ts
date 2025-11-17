import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface BackupConfig {
  databaseUrl: string;
  backupDir: string;
  encryptionKey: string;
  maxBackups: number;
  schedule: string;
  retentionDays: number;
}

// واجهة للإرجاع في الـ API
export interface BackupMetadataResponse {
  id: string;
  backupId: string;
  timestamp: Date;
  type: 'manual' | 'scheduled' | 'automatic';
  status: 'pending' | 'running' | 'completed' | 'failed';
  size: number;
  checksum: string;
  encrypted: boolean;
  duration: number;
  error?: string;
  path: string;
  databaseVersion?: string;
  schemaVersion?: string;
  recordCount?: number;
  compressionRatio?: number;
  startedAt?: Date;
  completedAt?: Date;
  restoredAt?: Date;
  restoredBy?: string;
  createdBy?: string;
  branchId?: string;
}

export interface RestoreOptions {
  backupId: string;
  targetDatabase?: string;
  dropExisting?: boolean;
  verifyOnly?: boolean;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private activeBackups = new Map<string, BackupMetadata>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * إنشاء نسخة احتياطية يدوية
   */
  async createManualBackup(): Promise<BackupMetadataResponse> {
    const backupId = this.generateBackupId();
    const metadata: BackupMetadata = {
      id: backupId,
      timestamp: new Date(),
      type: 'manual',
      status: 'pending',
      size: 0,
      checksum: '',
      encrypted: true,
      duration: 0,
      path: '',
    };

    this.activeBackups.set(backupId, metadata);
    this.logger.log(`بدء النسخ الاحتياطي اليدوي: ${backupId}`);

    try {
      const result = await this.performBackup(backupId, 'manual');
      metadata.status = 'completed';
      metadata.size = result.size;
      metadata.checksum = result.checksum;
      metadata.duration = result.duration;
      metadata.path = result.path;

      await this.saveBackupMetadata(metadata);
      this.logger.log(`تم إكمال النسخ الاحتياطي اليدوي: ${backupId}`);

      return metadata;
    } catch (error) {
      metadata.status = 'failed';
      metadata.error = error.message;
      await this.saveBackupMetadata(metadata);
      this.logger.error(`فشل النسخ الاحتياطي اليدوي: ${backupId}`, error);
      throw error;
    } finally {
      this.activeBackups.delete(backupId);
    }
  }

  /**
   * النسخ الاحتياطي المجدول (يومياً)
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async createScheduledBackup() {
    const backupId = this.generateBackupId();
    const metadata: BackupMetadata = {
      id: backupId,
      timestamp: new Date(),
      type: 'scheduled',
      status: 'pending',
      size: 0,
      checksum: '',
      encrypted: true,
      duration: 0,
      path: '',
    };

    this.activeBackups.set(backupId, metadata);
    this.logger.log(`بدء النسخ الاحتياطي المجدول: ${backupId}`);

    try {
      const result = await this.performBackup(backupId, 'scheduled');
      metadata.status = 'completed';
      metadata.size = result.size;
      metadata.checksum = result.checksum;
      metadata.duration = result.duration;
      metadata.path = result.path;

      await this.saveBackupMetadata(metadata);
      await this.cleanupOldBackups();
      this.logger.log(`تم إكمال النسخ الاحتياطي المجدول: ${backupId}`);

    } catch (error) {
      metadata.status = 'failed';
      metadata.error = error.message;
      await this.saveBackupMetadata(metadata);
      this.logger.error(`فشل النسخ الاحتياطي المجدول: ${backupId}`, error);
    } finally {
      this.activeBackups.delete(backupId);
    }
  }

  /**
   * إنشاء نسخة احتياطية تلقائية عند التغييرات الكبيرة
   */
  async createAutomaticBackup(reason: string): Promise<BackupMetadataResponse> {
    const backupId = this.generateBackupId();
    const metadata: BackupMetadata = {
      id: backupId,
      timestamp: new Date(),
      type: 'automatic',
      status: 'pending',
      size: 0,
      checksum: '',
      encrypted: true,
      duration: 0,
      path: '',
    };

    this.activeBackups.set(backupId, metadata);
    this.logger.log(`بدء النسخ الاحتياطي التلقائي (${reason}): ${backupId}`);

    try {
      const result = await this.performBackup(backupId, 'automatic');
      metadata.status = 'completed';
      metadata.size = result.size;
      metadata.checksum = result.checksum;
      metadata.duration = result.duration;
      metadata.path = result.path;

      await this.saveBackupMetadata(metadata);
      this.logger.log(`تم إكمال النسخ الاحتياطي التلقائي (${reason}): ${backupId}`);

      return metadata;
    } catch (error) {
      metadata.status = 'failed';
      metadata.error = error.message;
      await this.saveBackupMetadata(metadata);
      this.logger.error(`فشل النسخ الاحتياطي التلقائي (${reason}): ${backupId}`, error);
      throw error;
    } finally {
      this.activeBackups.delete(backupId);
    }
  }

  /**
   * استعادة نسخة احتياطية
   */
  async restoreBackup(options: RestoreOptions): Promise<void> {
    const { backupId, targetDatabase, dropExisting = false, verifyOnly = false } = options;

    // البحث عن النسخة الاحتياطية
    const backup = await this.getBackupMetadata(backupId);
    if (!backup) {
      throw new NotFoundException(`النسخة الاحتياطية غير موجودة: ${backupId}`);
    }

    if (backup.status !== 'completed') {
      throw new BadRequestException(`النسخة الاحتياطية غير جاهزة للاستعادة: ${backupId}`);
    }

    this.logger.log(`${verifyOnly ? 'التحقق من' : 'استعادة'} النسخة الاحتياطية: ${backupId}`);

    try {
      if (verifyOnly) {
        await this.verifyBackup(backup);
        this.logger.log(`تم التحقق من صحة النسخة الاحتياطية: ${backupId}`);
      } else {
        await this.performRestore(backup, targetDatabase, dropExisting);
        this.logger.log(`تم استعادة النسخة الاحتياطية: ${backupId}`);
      }
    } catch (error) {
      this.logger.error(`فشل ${verifyOnly ? 'التحقق من' : 'استعادة'} النسخة الاحتياطية: ${backupId}`, error);
      throw error;
    }
  }

  /**
   * اختبار النسخ الاحتياطي
   */
  async testBackup(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      // إنشاء نسخة اختبار صغيرة
      const testBackupId = `test_${Date.now()}`;
      const testData = { test: true, timestamp: new Date().toISOString() };

      // حفظ البيانات المؤقتة
      const tempPath = path.join(process.cwd(), 'temp', `${testBackupId}.json`);
      await fs.ensureDir(path.dirname(tempPath));
      await fs.writeJson(tempPath, testData);

      // تشفير البيانات
      const encryptedPath = await this.encryptFile(tempPath, `${testBackupId}_encrypted`);

      // فك التشفير والتحقق
      const decryptedPath = await this.decryptFile(encryptedPath, `${testBackupId}_decrypted.json`);
      const decryptedData = await fs.readJson(decryptedPath);

      // التحقق من التطابق
      const isValid = JSON.stringify(testData) === JSON.stringify(decryptedData);

      // تنظيف الملفات المؤقتة
      await fs.remove(tempPath);
      await fs.remove(encryptedPath);
      await fs.remove(decryptedPath);

      if (isValid) {
        return {
          success: true,
          message: 'تم اختبار النسخ الاحتياطي بنجاح',
        };
      } else {
        return {
          success: false,
          message: 'فشل في التحقق من تشفير/فك تشفير البيانات',
        };
      }
    } catch (error) {
      this.logger.error('فشل اختبار النسخ الاحتياطي', error);
      return {
        success: false,
        message: `فشل اختبار النسخ الاحتياطي: ${error.message}`,
        details: error,
      };
    }
  }

  /**
   * الحصول على قائمة النسخ الاحتياطية
   */
  async getBackupList(): Promise<BackupMetadataResponse[]> {
    try {
      const backups = await this.prisma.backupMetadata.findMany({
        orderBy: { timestamp: 'desc' },
        take: 100,
      });

      return backups.map(backup => ({
        id: backup.id,
        backupId: backup.backupId,
        timestamp: backup.timestamp,
        type: backup.type as any,
        status: backup.status as any,
        size: Number(backup.size),
        checksum: backup.checksum,
        encrypted: backup.encrypted,
        duration: Number(backup.duration),
        error: backup.error || undefined,
        path: backup.path,
        databaseVersion: backup.databaseVersion || undefined,
        schemaVersion: backup.schemaVersion || undefined,
        recordCount: backup.recordCount ? Number(backup.recordCount) : undefined,
        compressionRatio: backup.compressionRatio ? Number(backup.compressionRatio) : undefined,
        startedAt: backup.startedAt || undefined,
        completedAt: backup.completedAt || undefined,
        restoredAt: backup.restoredAt || undefined,
        restoredBy: backup.restoredBy || undefined,
        createdBy: backup.createdBy || undefined,
        branchId: backup.branchId || undefined,
      }));
    } catch (error) {
      this.logger.error('فشل في الحصول على قائمة النسخ الاحتياطية', error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات النسخ الاحتياطي
   */
  async getBackupStats(): Promise<{
    totalBackups: number;
    successfulBackups: number;
    failedBackups: number;
    lastBackup: Date | null;
    totalSize: number;
    activeBackups: number;
  }> {
    try {
      const [total, successful, failed, stats] = await Promise.all([
        this.prisma.backupMetadata.count(),
        this.prisma.backupMetadata.count({ where: { status: 'completed' } }),
        this.prisma.backupMetadata.count({ where: { status: 'failed' } }),
        this.prisma.backupMetadata.aggregate({
          _sum: { size: true },
          _max: { timestamp: true },
        }),
      ]);

      return {
        totalBackups: total,
        successfulBackups: successful,
        failedBackups: failed,
        lastBackup: stats._max.timestamp,
        totalSize: stats._sum.size || 0,
        activeBackups: this.activeBackups.size,
      };
    } catch (error) {
      this.logger.error('فشل في الحصول على إحصائيات النسخ الاحتياطي', error);
      throw error;
    }
  }

  /**
   * حذف نسخة احتياطية
   */
  async deleteBackup(backupId: string): Promise<void> {
    try {
      const backup = await this.getBackupMetadata(backupId);
      if (!backup) {
        throw new NotFoundException(`النسخة الاحتياطية غير موجودة: ${backupId}`);
      }

      // حذف الملف
      if (await fs.pathExists(backup.path)) {
        await fs.remove(backup.path);
      }

      // حذف البيانات الوصفية
      await this.prisma.backupMetadata.delete({
        where: { id: backupId },
      });

      this.logger.log(`تم حذف النسخة الاحتياطية: ${backupId}`);
    } catch (error) {
      this.logger.error(`فشل في حذف النسخة الاحتياطية: ${backupId}`, error);
      throw error;
    }
  }

  // الطرق الخاصة

  private async performBackup(backupId: string, type: string): Promise<{
    size: number;
    checksum: string;
    duration: number;
    path: string;
  }> {
    const startTime = Date.now();
    const backupDir = path.join(process.cwd(), 'backups');
    const backupPath = path.join(backupDir, `${backupId}.sql`);
    const encryptedPath = path.join(backupDir, `${backupId}.enc`);

    await fs.ensureDir(backupDir);

    try {
      // إنشاء نسخة احتياطية من قاعدة البيانات
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL غير محدد');
      }

      // استخراج معلومات قاعدة البيانات من URL
      const url = new URL(databaseUrl);
      const dbName = url.pathname.slice(1);
      const dbHost = url.hostname;
      const dbPort = url.port;
      const dbUser = url.username;
      const dbPassword = url.password;

      // أمر pg_dump للنسخ الاحتياطي
      const dumpCommand = `pg_dump --host=${dbHost} --port=${dbPort} --username=${dbUser} --dbname=${dbName} --no-password --format=custom --compress=9 --file="${backupPath}"`;

      // تعيين كلمة المرور في متغير البيئة
      const env = { ...process.env, PGPASSWORD: dbPassword };

      await execAsync(dumpCommand, { env });

      // حساب checksum وحجم الملف
      const fileStats = await fs.stat(backupPath);
      const fileBuffer = await fs.readFile(backupPath);
      const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // تشفير الملف
      await this.encryptFile(backupPath, encryptedPath.replace('.enc', ''));

      // حذف الملف غير المشفر
      await fs.remove(backupPath);

      const duration = Date.now() - startTime;

      return {
        size: fileStats.size,
        checksum,
        duration,
        path: encryptedPath,
      };
    } catch (error) {
      // تنظيف الملفات في حالة الخطأ
      if (await fs.pathExists(backupPath)) {
        await fs.remove(backupPath);
      }
      throw error;
    }
  }

  private async performRestore(
    backup: BackupMetadata,
    targetDatabase?: string,
    dropExisting = false
  ): Promise<void> {
    const tempPath = path.join(process.cwd(), 'temp', `restore_${backup.id}.sql`);

    try {
      await fs.ensureDir(path.dirname(tempPath));

      // فك تشفير الملف
      await this.decryptFile(backup.path, tempPath);

      // استعادة قاعدة البيانات
      const databaseUrl = targetDatabase || process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL غير محدد');
      }

      const url = new URL(databaseUrl);
      const dbName = url.pathname.slice(1);
      const dbHost = url.hostname;
      const dbPort = url.port;
      const dbUser = url.username;
      const dbPassword = url.password;

      let restoreCommand = `pg_restore --host=${dbHost} --port=${dbPort} --username=${dbUser} --dbname=${dbName} --no-password`;

      if (dropExisting) {
        restoreCommand += ' --clean --if-exists';
      }

      restoreCommand += ` "${tempPath}"`;

      const env = { ...process.env, PGPASSWORD: dbPassword };

      await execAsync(restoreCommand, { env });

    } finally {
      // تنظيف الملف المؤقت
      if (await fs.pathExists(tempPath)) {
        await fs.remove(tempPath);
      }
    }
  }

  private async verifyBackup(backup: BackupMetadata): Promise<void> {
    const tempPath = path.join(process.cwd(), 'temp', `verify_${backup.id}`);

    try {
      await fs.ensureDir(path.dirname(tempPath));

      // فك تشفير الملف والتحقق من checksum
      const decryptedPath = await this.decryptFile(backup.path, tempPath);
      const fileBuffer = await fs.readFile(decryptedPath);
      const calculatedChecksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      if (calculatedChecksum !== backup.checksum) {
        throw new Error('Checksum غير متطابق - الملف تالف');
      }

    } finally {
      if (await fs.pathExists(tempPath)) {
        await fs.remove(tempPath);
      }
    }
  }

  private async encryptFile(inputPath: string, outputPath: string): Promise<string> {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.BACKUP_ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(outputPath);

    // كتابة IV في بداية الملف
    output.write(iv);

    return new Promise((resolve, reject) => {
      input.pipe(cipher).pipe(output)
        .on('finish', () => resolve(outputPath))
        .on('error', reject);
    });
  }

  private async decryptFile(inputPath: string, outputPath: string): Promise<string> {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.BACKUP_ENCRYPTION_KEY || 'default-key', 'salt', 32);

    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(outputPath);

    let iv: Buffer | null = null;

    return new Promise((resolve, reject) => {
      input.on('data', (chunk) => {
        if (!iv) {
          iv = chunk.slice(0, 16);
          const cipher = crypto.createDecipheriv(algorithm, key, iv);
          input.pipe(cipher).pipe(output);
        }
      });

      output.on('finish', () => resolve(outputPath));
      output.on('error', reject);
      input.on('error', reject);
    });
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '30');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const oldBackups = await this.prisma.backupMetadata.findMany({
        where: {
          timestamp: { lt: cutoffDate },
          status: 'completed',
        },
      });

      for (const backup of oldBackups) {
        await this.deleteBackup(backup.id);
      }

      if (oldBackups.length > 0) {
        this.logger.log(`تم حذف ${oldBackups.length} نسخة احتياطية قديمة`);
      }
    } catch (error) {
      this.logger.error('فشل في تنظيف النسخ الاحتياطية القديمة', error);
    }
  }

  private async saveBackupMetadata(metadata: any): Promise<void> {
    try {
      await this.prisma.backupMetadata.upsert({
        where: { backupId: metadata.id },
        update: {
          status: metadata.status,
          size: BigInt(metadata.size || 0),
          checksum: metadata.checksum || '',
          duration: BigInt(metadata.duration || 0),
          error: metadata.error,
          path: metadata.path || '',
          completedAt: metadata.status === 'completed' ? new Date() : undefined,
          startedAt: metadata.startedAt,
        },
        create: {
          backupId: metadata.id,
          timestamp: metadata.timestamp,
          type: metadata.type,
          status: metadata.status,
          size: BigInt(metadata.size || 0),
          checksum: metadata.checksum || '',
          encrypted: metadata.encrypted,
          duration: BigInt(metadata.duration || 0),
          error: metadata.error,
          path: metadata.path || '',
          startedAt: metadata.startedAt,
          completedAt: metadata.status === 'completed' ? new Date() : undefined,
        },
      });
    } catch (error) {
      this.logger.error(`فشل في حفظ بيانات النسخ الاحتياطي: ${metadata.id}`, error);
    }
  }

  private async getBackupMetadata(backupId: string): Promise<any | null> {
    try {
      const backup = await this.prisma.backupMetadata.findUnique({
        where: { backupId: backupId },
      });

      if (!backup) return null;

      return {
        id: backup.backupId,
        timestamp: backup.timestamp,
        type: backup.type as any,
        status: backup.status as any,
        size: Number(backup.size),
        checksum: backup.checksum,
        encrypted: backup.encrypted,
        duration: Number(backup.duration),
        error: backup.error || undefined,
        path: backup.path,
      };
    } catch (error) {
      this.logger.error(`فشل في الحصول على بيانات النسخ الاحتياطي: ${backupId}`, error);
      return null;
    }
  }

  private generateBackupId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = crypto.randomBytes(4).toString('hex');
    return `backup_${timestamp}_${random}`;
  }
}
