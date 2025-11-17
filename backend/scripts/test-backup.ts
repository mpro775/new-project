import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { BackupService } from '../src/modules/backup/backup.service';

async function testBackup() {
  try {
    console.log('🔄 بدء اختبار نظام النسخ الاحتياطي...');

    const app = await NestFactory.createApplicationContext(AppModule);
    const backupService = app.get(BackupService);

    // اختبار وظائف النسخ الاحتياطي
    console.log('🧪 اختبار وظائف النسخ الاحتياطي...');
    const testResult = await backupService.testBackup();
    console.log('✅ نتيجة الاختبار:', testResult);

    // الحصول على إحصائيات النسخ الاحتياطي
    console.log('📊 الحصول على إحصائيات النسخ الاحتياطي...');
    const stats = await backupService.getBackupStats();
    console.log('✅ الإحصائيات:', stats);

    // الحصول على قائمة النسخ الاحتياطية
    console.log('📋 الحصول على قائمة النسخ الاحتياطية...');
    const backups = await backupService.getBackupList();
    console.log(`✅ عدد النسخ الاحتياطية: ${backups.length}`);

    await app.close();
    console.log('🎉 تم الانتهاء من اختبار نظام النسخ الاحتياطي بنجاح!');

  } catch (error) {
    console.error('❌ فشل في اختبار نظام النسخ الاحتياطي:', error);
    process.exit(1);
  }
}

testBackup();
