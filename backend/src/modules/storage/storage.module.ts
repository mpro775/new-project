import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { FileManagementService } from './file-management.service';
import { ImageOptimizationService } from './image-optimization.service';
import { AccessControlService } from './access-control.service';
import { S3Provider } from './providers/s3.provider';
import { MulterConfigService } from './utils/multer.config';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    AuditModule,
    MulterModule.registerAsync({
      useClass: MulterConfigService,
    }),
  ],
  controllers: [StorageController],
  providers: [
    StorageService,
    FileManagementService,
    ImageOptimizationService,
    AccessControlService,
    S3Provider,
    MulterConfigService,
    PrismaService,
  ],
  exports: [
    StorageService,
    FileManagementService,
    ImageOptimizationService,
    AccessControlService,
    S3Provider,
  ],
})
export class StorageModule {}
