import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SecurityService } from './security.service';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { Permissions } from '../../common/decorators/permission.decorator';

@ApiTags('Security Management')
@ApiBearerAuth()
@Controller('security')
@UseGuards(PermissionGuard)
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get('report')
  @Permissions('security:read')
  @ApiOperation({ summary: 'الحصول على تقرير الأمان' })
  @ApiResponse({
    status: 200,
    description: 'تقرير الأمان الحالي',
    schema: {
      type: 'object',
      properties: {
        timestamp: { type: 'string', format: 'date-time' },
        environment: { type: 'string' },
        validation: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            errors: { type: 'array', items: { type: 'string' } },
          },
        },
        configs: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async getSecurityReport() {
    return this.securityService.getSecurityReport();
  }

  @Post('validate')
  @Permissions('security:admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'التحقق من صحة إعدادات الأمان' })
  @ApiResponse({
    status: 200,
    description: 'نتيجة التحقق من إعدادات الأمان',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        errors: { type: 'array', items: { type: 'string' } },
        message: { type: 'string' },
      },
    },
  })
  async validateSecurityConfig() {
    const validation = this.securityService.validateSecurityConfig();

    return {
      valid: validation.valid,
      errors: validation.errors,
      message: validation.valid
        ? 'جميع إعدادات الأمان صحيحة'
        : 'تم العثور على أخطاء في إعدادات الأمان',
    };
  }

  @Get('cors')
  @Permissions('security:read')
  @ApiOperation({ summary: 'الحصول على إعدادات CORS' })
  @ApiResponse({
    status: 200,
    description: 'إعدادات CORS الحالية',
  })
  async getCorsConfig() {
    return {
      cors: this.securityService.getCorsConfig(),
    };
  }

  @Get('rate-limit')
  @Permissions('security:read')
  @ApiOperation({ summary: 'الحصول على إعدادات Rate Limiting' })
  @ApiResponse({
    status: 200,
    description: 'إعدادات Rate Limiting الحالية',
  })
  async getRateLimitConfig() {
    return {
      rateLimit: this.securityService.getCorsConfig(),
    };
  }

  @Get('helmet')
  @Permissions('security:read')
  @ApiOperation({ summary: 'الحصول على إعدادات Helmet' })
  @ApiResponse({
    status: 200,
    description: 'إعدادات Helmet الحالية',
  })
  async getHelmetConfig() {
    return {
      helmet: this.securityService.getHelmetConfig(),
    };
  }

  @Get('https')
  @Permissions('security:read')
  @ApiOperation({ summary: 'الحصول على إعدادات HTTPS' })
  @ApiResponse({
    status: 200,
    description: 'إعدادات HTTPS الحالية',
  })
  async getHttpsConfig() {
    return {
      https: this.securityService.getHttpsConfig(),
    };
  }

  @Get('api-versioning')
  @Permissions('security:read')
  @ApiOperation({ summary: 'الحصول على إعدادات API Versioning' })
  @ApiResponse({
    status: 200,
    description: 'إعدادات API Versioning الحالية',
  })
  async getApiVersioningConfig() {
    return {
      apiVersioning: this.securityService.getApiVersioningConfig(),
    };
  }
}
