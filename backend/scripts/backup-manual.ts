import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { BackupService } from '../src/modules/backup/backup.service';

async function runManualBackup() {
  try {
    console.log('🔄 بدء إنشاء نسخة احتياطية يدوية...');

    const app = await NestFactory.createApplicationContext(AppModule);
    const backupService = app.get(BackupService);

    console.log('📦 إنشاء النسخة الاحتياطية...');
    const backup = await backupService.createManualBackup();

    console.log('✅ تم إنشاء النسخة الاحتياطية بنجاح!');
    console.log('📋 تفاصيل النسخة الاحتياطية:');
    console.log(`   - المعرف: ${backup.id}`);
    console.log(`   - النوع: ${backup.type}`);
    console.log(`   - الحالة: ${backup.status}`);
    console.log(`   - الحجم: ${backup.size} bytes`);
    console.log(`   - المسار: ${backup.path}`);
    console.log(`   - الوقت المستغرق: ${backup.duration} ms`);

    await app.close();

  } catch (error) {
    console.error('❌ فشل في إنشاء النسخة الاحتياطية:', error);
    process.exit(1);
  }
}

// تشغيل النسخة الاحتياطية إذا تم استدعاء هذا الملف مباشرة
if (require.main === module) {
  runManualBackup();
}

export { runManualBackup };
