import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BackupService, BackupMetadataResponse, RestoreOptions } from './backup.service';
import { CreateBackupDto } from './dto/create-backup.dto';
import { RestoreBackupDto } from './dto/restore-backup.dto';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { Permissions } from '../../common/decorators/permission.decorator';

@ApiTags('Backup Management')
@ApiBearerAuth()
@Controller('backup')
@UseGuards(PermissionGuard)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('manual')
  @Permissions('backup:create')
  @ApiOperation({ summary: 'إنشاء نسخة احتياطية يدوية' })
  @ApiResponse({
    status: 201,
    description: 'تم إنشاء النسخة الاحتياطية بنجاح',
    type: Object,
  })
  @ApiResponse({ status: 403, description: 'غير مصرح لك بهذا الإجراء' })
  async createManualBackup(@Body() dto: CreateBackupDto): Promise<BackupMetadataResponse> {
    return this.backupService.createManualBackup();
  }

  @Post('test')
  @Permissions('backup:test')
  @ApiOperation({ summary: 'اختبار وظائف النسخ الاحتياطي' })
  @ApiResponse({
    status: 200,
    description: 'نتيجة اختبار النسخ الاحتياطي',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        details: { type: 'object', nullable: true },
      },
    },
  })
  async testBackup() {
    return this.backupService.testBackup();
  }

  @Post('restore')
  @Permissions('backup:restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'استعادة نسخة احتياطية' })
  @ApiResponse({
    status: 200,
    description: 'تم استعادة النسخة الاحتياطية بنجاح',
  })
  @ApiResponse({ status: 400, description: 'بيانات غير صحيحة' })
  @ApiResponse({ status: 404, description: 'النسخة الاحتياطية غير موجودة' })
  async restoreBackup(@Body() dto: RestoreBackupDto): Promise<void> {
    const options: RestoreOptions = {
      backupId: dto.backupId,
      targetDatabase: dto.targetDatabase,
      dropExisting: dto.dropExisting,
      verifyOnly: dto.verifyOnly,
    };

    return this.backupService.restoreBackup(options);
  }

  @Get('list')
  @Permissions('backup:read')
  @ApiOperation({ summary: 'الحصول على قائمة النسخ الاحتياطية' })
  @ApiResponse({
    status: 200,
    description: 'قائمة النسخ الاحتياطية',
    type: [Object],
  })
  async getBackupList(): Promise<BackupMetadataResponse[]> {
    return this.backupService.getBackupList();
  }

  @Get('stats')
  @Permissions('backup:read')
  @ApiOperation({ summary: 'الحصول على إحصائيات النسخ الاحتياطي' })
  @ApiResponse({
    status: 200,
    description: 'إحصائيات النسخ الاحتياطي',
    schema: {
      type: 'object',
      properties: {
        totalBackups: { type: 'number' },
        successfulBackups: { type: 'number' },
        failedBackups: { type: 'number' },
        lastBackup: { type: 'string', format: 'date-time', nullable: true },
        totalSize: { type: 'number' },
        activeBackups: { type: 'number' },
      },
    },
  })
  async getBackupStats() {
    return this.backupService.getBackupStats();
  }

  @Get(':backupId')
  @Permissions('backup:read')
  @ApiOperation({ summary: 'الحصول على تفاصيل نسخة احتياطية محددة' })
  @ApiResponse({
    status: 200,
    description: 'تفاصيل النسخة الاحتياطية',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'النسخة الاحتياطية غير موجودة' })
  async getBackup(@Param('backupId') backupId: string): Promise<BackupMetadataResponse | null> {
    // هذه الطريقة تحتاج إلى إضافتها للخدمة
    const backups = await this.backupService.getBackupList();
    return backups.find(backup => backup.id === backupId) || null;
  }

  @Delete(':backupId')
  @Permissions('backup:delete')
  @ApiOperation({ summary: 'حذف نسخة احتياطية' })
  @ApiResponse({
    status: 200,
    description: 'تم حذف النسخة الاحتياطية بنجاح',
  })
  @ApiResponse({ status: 404, description: 'النسخة الاحتياطية غير موجودة' })
  async deleteBackup(@Param('backupId') backupId: string): Promise<void> {
    return this.backupService.deleteBackup(backupId);
  }

  @Post('automatic/:reason')
  @Permissions('backup:create')
  @ApiOperation({ summary: 'إنشاء نسخة احتياطية تلقائية' })
  @ApiResponse({
    status: 201,
    description: 'تم إنشاء النسخة الاحتياطية التلقائية بنجاح',
    type: Object,
  })
  async createAutomaticBackup(@Param('reason') reason: string): Promise<BackupMetadataResponse> {
    return this.backupService.createAutomaticBackup(reason);
  }
}
