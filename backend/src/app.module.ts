import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_FILTER, APP_PIPE, APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './shared/database/prisma.module';
import { CacheModule } from './shared/cache/cache.module';
import { AuthModule } from './modules/auth/auth.module';
import { BranchModule } from './modules/branch/branch.module';
import { WarehouseModule } from './modules/warehouse/warehouse.module';
import { ProductModule } from './modules/product/product.module';
import { CategoryModule } from './modules/category/category.module';
import { ProductVariantModule } from './modules/product-variant/product-variant.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SalesModule } from './modules/sales/sales.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { PurchasingModule } from './modules/purchasing/purchasing.module';
import { CustomerModule } from './modules/customer/customer.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { AuditModule } from './modules/audit/audit.module';
import { SyncModule } from './modules/sync/sync.module';
import { PaymentModule } from './modules/payment/payment.module';
import { NotificationModule } from './modules/notification/notification.module';
import { StorageModule } from './modules/storage/storage.module';
import { CacheInterceptor } from './common/interceptors/cache.interceptor';
import { CacheInvalidationInterceptor } from './common/interceptors/cache-invalidation.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import { CustomValidationPipe } from './common/pipes/validation.pipe';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionGuard } from './common/guards/permission.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// ملفات الإعدادات
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import jwtConfig from './config/jwt.config';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [databaseConfig, redisConfig, jwtConfig, appConfig],
    }),
    PrismaModule,
    CacheModule,
    AuthModule,
    BranchModule,
    WarehouseModule,
    ProductModule,
    CategoryModule,
    ProductVariantModule,
    InventoryModule,
    SalesModule,
    ReturnsModule,
    PurchasingModule,
    CustomerModule,
    AccountingModule,
    ReportingModule,
    AuditModule,
    SyncModule,
    PaymentModule,
    NotificationModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInvalidationInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    // Filters
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },
    // Pipes
    {
      provide: APP_PIPE,
      useClass: CustomValidationPipe,
    },
    // Guards - Global guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule {}
