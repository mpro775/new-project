import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { BackupService } from '../src/modules/backup/backup.service';

async function runBackupRestore() {
  try {
    // الحصول على معرف النسخة الاحتياطية من الوسائط
    const backupId = process.argv[2];
    const targetDatabase = process.argv[3];
    const dropExisting = process.argv.includes('--drop-existing');
    const verifyOnly = process.argv.includes('--verify-only');

    if (!backupId) {
      console.error('❌ يجب تحديد معرف النسخة الاحتياطية');
      console.log('الاستخدام: npm run backup:restore <backupId> [targetDatabase] [--drop-existing] [--verify-only]');
      process.exit(1);
    }

    console.log(`${verifyOnly ? '🔍 التحقق من' : '🔄 استعادة'} النسخة الاحتياطية: ${backupId}`);

    const app = await NestFactory.createApplicationContext(AppModule);
    const backupService = app.get(BackupService);

    // التحقق من وجود النسخة الاحتياطية
    const backups = await backupService.getBackupList();
    const backup = backups.find(b => b.id === backupId);

    if (!backup) {
      console.error(`❌ النسخة الاحتياطية غير موجودة: ${backupId}`);
      process.exit(1);
    }

    if (backup.status !== 'completed') {
      console.error(`❌ النسخة الاحتياطية غير جاهزة للاستعادة: ${backup.status}`);
      process.exit(1);
    }

    console.log(`📋 معلومات النسخة الاحتياطية:`);
    console.log(`   - المعرف: ${backup.id}`);
    console.log(`   - التاريخ: ${backup.timestamp}`);
    console.log(`   - الحجم: ${backup.size} bytes`);
    console.log(`   - مشفرة: ${backup.encrypted ? 'نعم' : 'لا'}`);

    if (verifyOnly) {
      console.log('🔍 بدء عملية التحقق...');
    } else {
      console.log('⚠️  تحذير: سيتم استعادة قاعدة البيانات!');
      if (dropExisting) {
        console.log('⚠️  تحذير: سيتم حذف البيانات الموجودة!');
      }

      // انتظار تأكيد المستخدم (في بيئة التطوير)
      if (process.env.NODE_ENV === 'development') {
        console.log('هل تريد المتابعة؟ (اكتب "yes" للتأكيد): ');
        process.stdin.once('data', async (data) => {
          const input = data.toString().trim().toLowerCase();
          if (input === 'yes' || input === 'y') {
            await performRestore();
          } else {
            console.log('❌ تم إلغاء العملية');
            process.exit(0);
          }
        });
      } else {
        await performRestore();
      }
    }

    async function performRestore() {
      try {
        await backupService.restoreBackup({
          backupId,
          targetDatabase,
          dropExisting,
          verifyOnly,
        });

        if (verifyOnly) {
          console.log('✅ تم التحقق من صحة النسخة الاحتياطية بنجاح!');
        } else {
          console.log('✅ تم استعادة النسخة الاحتياطية بنجاح!');
        }

        await app.close();
      } catch (error) {
        console.error('❌ فشل في العملية:', error);
        process.exit(1);
      }
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error);
    process.exit(1);
  }
}

// تشغيل الاستعادة إذا تم استدعاء هذا الملف مباشرة
if (require.main === module) {
  runBackupRestore();
}

export { runBackupRestore };
