import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/database/prisma.service';
import { StorageService } from '../src/modules/storage/storage.service';
import { ImageOptimizationService } from '../src/modules/storage/image-optimization.service';
import { AccessControlService } from '../src/modules/storage/access-control.service';

async function testStorageModule() {
  console.log('🧪 اختبار وحدة التخزين (Storage Module)...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const storageService = app.get(StorageService);
  const imageOptimizationService = app.get(ImageOptimizationService);
  const accessControlService = app.get(AccessControlService);

  let testUserId = '';
  let testFileId = '';
  let testBucketId = '';

  try {
    // تسجيل الدخول والحصول على المستخدم
    console.log('🔐 تسجيل الدخول...');
    const loginResponse = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123',
      }),
    });

    if (!loginResponse.ok) {
      throw new Error('فشل في تسجيل الدخول');
    }

    const loginData = await loginResponse.json();
    testUserId = loginData.user.id;
    console.log(`✅ تم تسجيل الدخول بنجاح، المستخدم: ${testUserId}`);

    // إنشاء bucket تجريبي
    console.log('📁 إنشاء bucket تجريبي...');
    const bucket = await prisma.storageBucket.create({
      data: {
        name: 'test-bucket',
        displayName: 'Test Bucket',
        description: 'Bucket للاختبارات',
        provider: 'local',
        region: 'local',
        bucketName: 'test-bucket',
        basePath: './uploads/test-bucket',
        isPublic: false,
        allowedMimeTypes: JSON.stringify(['image/jpeg', 'image/png', 'image/webp']),
        maxFileSize: 5242880, // 5MB
        allowedExtensions: JSON.stringify(['jpg', 'jpeg', 'png', 'webp']),
        createdBy: testUserId,
      },
    });
    testBucketId = bucket.id;
    console.log(`✅ تم إنشاء bucket: ${testBucketId}`);

    // رفع ملف تجريبي (محاكاة)
    console.log('📤 رفع ملف تجريبي...');
    // ملاحظة: هذا يتطلب ملف حقيقي، سنستخدم mock data
    const mockFile = {
      fieldname: 'file',
      originalname: 'test-image.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('mock image data'),
      size: 1024,
    };

    const uploadResult = await storageService.uploadFile({
      file: mockFile as any,
      category: 'test',
      entityType: 'test',
      entityId: 'test-123',
      isPublic: false,
      bucket: 'test-bucket',
      uploadedBy: testUserId,
      branchId: 'test-branch',
      metadata: { test: true },
    });

    testFileId = uploadResult.fileId;
    console.log(`✅ تم رفع الملف: ${testFileId}`);

    // اختبار تحسين الصورة
    console.log('🖼️ اختبار تحسين الصورة...');
    const optimizationResult = await imageOptimizationService.optimizeAndSaveImage(
      testFileId,
      {
        quality: 80,
        format: 'jpeg',
        maxWidth: 1920,
        maxHeight: 1080,
      },
    );

    if (optimizationResult.success) {
      console.log(`✅ تم تحسين الصورة بنجاح، نسبة الضغط: ${optimizationResult.compressionRatio}%`);
    } else {
      console.log(`⚠️ فشل في تحسين الصورة: ${optimizationResult.error}`);
    }

    // اختبار إنشاء الصور المصغرة
    console.log('🖼️ اختبار إنشاء الصور المصغرة...');
    const thumbnailResults = await imageOptimizationService.generateThumbnailsForFile(
      testFileId,
      [
        { width: 150, height: 150, suffix: 'sm' },
        { width: 300, height: 300, suffix: 'md' },
        { width: 600, height: 600, suffix: 'lg' },
      ],
    );

    console.log(`✅ تم إنشاء ${thumbnailResults.length} صورة مصغرة`);

    // اختبار تحويل تنسيق الصورة
    console.log('🔄 اختبار تحويل تنسيق الصورة...');
    const convertResult = await imageOptimizationService.convertImageFormat(
      testFileId,
      'webp',
      80,
    );

    if (convertResult.success) {
      console.log(`✅ تم تحويل الصورة إلى WebP بنجاح`);
    } else {
      console.log(`⚠️ فشل في تحويل الصورة: ${convertResult.error}`);
    }

    // اختبار التحسين التلقائي
    console.log('🤖 اختبار التحسين التلقائي...');
    const autoOptimizeResult = await imageOptimizationService.autoOptimizeImage(
      testFileId,
      false,
    );

    console.log(`✅ تم التحسين التلقائي: ${autoOptimizeResult.optimizations.join(', ')}`);

    // اختبار إنشاء رمز وصول
    console.log('🔑 اختبار إنشاء رمز وصول...');
    const accessToken = await accessControlService.createAccessToken(
      testFileId,
      testUserId,
      [
        { action: 'read', granted: true },
        { action: 'write', granted: false },
      ],
      {
        expiresIn: 60, // دقيقة واحدة
        maxDownloads: 5,
      },
    );

    console.log(`✅ تم إنشاء رمز وصول: ${accessToken.token.substring(0, 8)}...`);

    // اختبار التحقق من رمز الوصول
    console.log('✅ اختبار التحقق من رمز الوصول...');
    const isValid = await accessControlService.validateAccessToken(
      testFileId,
      accessToken.token,
      'read',
    );

    console.log(`✅ رمز الوصول صالح: ${isValid}`);

    // اختبار إنشاء رابط عام
    console.log('🌐 اختبار إنشاء رابط عام...');
    const publicLink = await accessControlService.createPublicLink(
      testFileId,
      testUserId,
      {
        expiresIn: 30,
        maxDownloads: 10,
      },
    );

    console.log(`✅ تم إنشاء رابط عام: ${publicLink.substring(0, 50)}...`);

    // اختبار إحصائيات الوصول
    console.log('📊 اختبار إحصائيات الوصول...');
    const accessStats = await accessControlService.getFileAccessStats(testFileId);

    console.log(`✅ إحصائيات الوصول - إجمالي: ${accessStats.totalAccess}, مستخدمون فريدون: ${accessStats.uniqueUsers}`);

    // اختبار إحصائيات التخزين
    console.log('📈 اختبار إحصائيات التخزين...');
    const storageStats = await storageService.getStorageStats();

    console.log(`✅ إحصائيات التخزين - إجمالي الملفات: ${storageStats.totalFiles}, إجمالي الحجم: ${storageStats.totalSize} bytes`);

    // اختبار تنظيف الرموز المنتهية
    console.log('🧹 اختبار تنظيف الرموز المنتهية...');
    const cleanedTokens = await accessControlService.cleanupExpiredTokens();

    console.log(`✅ تم تنظيف ${cleanedTokens} رمز منتهي الصلاحية`);

    // اختبار تنظيف الصور المصغرة اليتيمة
    console.log('🧹 اختبار تنظيف الصور المصغرة اليتيمة...');
    const cleanedThumbnails = await imageOptimizationService.cleanupOrphanedThumbnails();

    console.log(`✅ تم تنظيف ${cleanedThumbnails} صورة مصغرة يتيمة`);

    console.log('🎉 تم إنجاز جميع اختبارات وحدة التخزين بنجاح!');

  } catch (error) {
    console.error('❌ فشل في اختبار وحدة التخزين:', error);
  } finally {
    // تنظيف البيانات التجريبية
    try {
      if (testFileId) {
        await prisma.file.delete({ where: { id: testFileId } });
        console.log('🧹 تم حذف الملف التجريبي');
      }
      if (testBucketId) {
        await prisma.storageBucket.delete({ where: { id: testBucketId } });
        console.log('🧹 تم حذف البucket التجريبي');
      }
    } catch (cleanupError) {
      console.error('⚠️ فشل في تنظيف البيانات التجريبية:', cleanupError);
    }

    await app.close();
  }
}

// تشغيل الاختبار
if (require.main === module) {
  testStorageModule();
}

export { testStorageModule };
