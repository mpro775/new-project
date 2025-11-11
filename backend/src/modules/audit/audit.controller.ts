import {
  Controller,
  Get,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuditService, AuditQuery } from './audit.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * البحث في سجلات التدقيق
   */
  @Get('logs')
  @Permissions('audit.read')
  async searchAuditLogs(
    @Query()
    query: {
      userId?: string;
      action?: string;
      entity?: string;
      entityId?: string;
      branchId?: string;
      warehouseId?: string;
      startDate?: string;
      endDate?: string;
      success?: string;
      severity?: string;
      category?: string;
      referenceType?: string;
      referenceId?: string;
      module?: string;
      searchText?: string;
      limit?: string;
      offset?: string;
    },
  ) {
    const auditQuery: AuditQuery = {
      userId: query.userId,
      action: query.action,
      entity: query.entity,
      entityId: query.entityId,
      branchId: query.branchId,
      warehouseId: query.warehouseId,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      success: query.success ? query.success === 'true' : undefined,
      severity: query.severity,
      category: query.category,
      referenceType: query.referenceType,
      referenceId: query.referenceId,
      module: query.module,
      searchText: query.searchText,
      limit: query.limit ? parseInt(query.limit) : undefined,
      offset: query.offset ? parseInt(query.offset) : undefined,
    };

    return this.auditService.searchAuditLogs(auditQuery);
  }

  /**
   * الحصول على سجل تدقيق محدد
   */
  @Get('logs/:id')
  @Permissions('audit.read')
  getAuditLog(@Param('id') id: string) {
    return this.auditService.getAuditLog(id);
  }

  /**
   * إحصائيات التدقيق العامة
   */
  @Get('stats')
  @Permissions('audit.read')
  getAuditStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('branchId') branchId?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.auditService.getAuditStats(start, end, branchId);
  }

  /**
   * إحصائيات التدقيق اليومية
   */
  @Get('stats/daily')
  @Permissions('audit.read')
  getDailyAuditStats(@Query('branchId') branchId?: string) {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
    );

    return this.auditService.getAuditStats(startOfDay, endOfDay, branchId);
  }

  /**
   * إحصائيات التدقيق الأسبوعية
   */
  @Get('stats/weekly')
  @Permissions('audit.read')
  getWeeklyAuditStats(@Query('branchId') branchId?: string) {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return this.auditService.getAuditStats(startOfWeek, endOfWeek, branchId);
  }

  /**
   * إحصائيات التدقيق الشهرية
   */
  @Get('stats/monthly')
  @Permissions('audit.read')
  getMonthlyAuditStats(
    @Query('year') year?: number,
    @Query('month') month?: number,
    @Query('branchId') branchId?: string,
  ) {
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth();

    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    return this.auditService.getAuditStats(startOfMonth, endOfMonth, branchId);
  }

  /**
   * تتبع العمليات لكيان محدد
   */
  @Get('trail/entity/:entity/:entityId')
  @Permissions('audit.read')
  getEntityAuditTrail(
    @Param('entity') entity: string,
    @Param('entityId') entityId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit) : 50;
    return this.auditService.getEntityAuditTrail(entity, entityId, limitNum);
  }

  /**
   * تتبع العمليات لمستخدم محدد
   */
  @Get('trail/user/:userId')
  @Permissions('audit.read')
  getUserAuditTrail(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit) : 50;
    return this.auditService.getUserAuditTrail(userId, limitNum);
  }

  /**
   * تقرير الأخطاء والتحذيرات
   */
  @Get('reports/errors')
  @Permissions('audit.read')
  async getErrorReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('branchId') branchId?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const stats = await this.auditService.getAuditStats(start, end, branchId);

    return {
      errorRate: stats.errorRate,
      errorsBySeverity: Object.fromEntries(
        Object.entries(stats.logsBySeverity).filter(([severity]) =>
          ['error', 'critical'].includes(severity),
        ),
      ),
      errorsByModule: Object.fromEntries(
        Object.entries(stats.logsByModule).filter(
          ([module, count]) => count > 0 && module !== 'unknown',
        ),
      ),
      recentErrors: stats.recentActivity.filter(
        (activity) => !activity.success,
      ),
    };
  }

  /**
   * تقرير الأمان
   */
  @Get('reports/security')
  @Permissions('audit.read')
  async getSecurityReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('branchId') branchId?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const stats = await this.auditService.getAuditStats(start, end, branchId);

    // فلترة العمليات الأمنية
    const securityActions = [
      'LOGIN_SUCCESS',
      'LOGIN_FAILED',
      'LOGOUT',
      'PASSWORD_CHANGE',
      'PERMISSION_CHANGE',
      'CREATE',
      'DELETE',
      'UPDATE', // العمليات الحساسة
    ];

    const securityLogs = Object.fromEntries(
      Object.entries(stats.logsByAction).filter(([action]) =>
        securityActions.includes(action),
      ),
    );

    return {
      totalSecurityEvents: Object.values(securityLogs).reduce(
        (sum, count) => sum + count,
        0,
      ),
      securityEventsByType: securityLogs,
      securityEventsByUser: Object.fromEntries(
        Object.entries(stats.logsByUser).filter(([userId, count]) => count > 0),
      ),
      failedLogins: stats.logsByAction['LOGIN_FAILED'] || 0,
      permissionChanges: stats.logsByAction['PERMISSION_CHANGE'] || 0,
      passwordChanges: stats.logsByAction['PASSWORD_CHANGE'] || 0,
    };
  }

  /**
   * تقرير النشاط حسب الوحدة
   */
  @Get('reports/activity')
  @Permissions('audit.read')
  async getActivityReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('branchId') branchId?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const stats = await this.auditService.getAuditStats(start, end, branchId);

    return {
      totalActivity: stats.totalLogs,
      activityByModule: stats.logsByModule,
      activityByEntity: stats.logsByEntity,
      topEntities: stats.topEntities,
      topUsers: stats.topUsers,
      activityTrend: stats.recentActivity,
    };
  }

  /**
   * تتبع التدقيق التفصيلي لكيان محدد
   */
  @Get('trail/detailed/:entity/:entityId')
  @Permissions('audit.read')
  getDetailedAuditTrail(
    @Param('entity') entity: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.getDetailedAuditTrail(entity, entityId);
  }

  /**
   * مقارنة حالتين من الكيان
   */
  @Get('trail/compare')
  @Permissions('audit.read')
  compareEntityStates(
    @Query('entity') entity: string,
    @Query('entityId') entityId: string,
    @Query('version1') version1: string,
    @Query('version2') version2: string,
  ) {
    // TODO: تنفيذ مقارنة إصدارين محددين من الكيان
    return {
      message: 'ميزة مقارنة الإصدارات ستكون متاحة قريباً',
      entity,
      entityId,
      version1,
      version2,
    };
  }

  /**
   * تقرير التغييرات لفترة زمنية
   */
  @Get('reports/changes')
  @Permissions('audit.read')
  getChangeReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('entity') entity?: string,
    @Query('userId') userId?: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('تاريخ البداية أو النهاية غير صحيح');
    }

    return this.auditService.getChangeReport(start, end, entity, userId);
  }

  /**
   * تقرير التغييرات اليومي
   */
  @Get('reports/changes/daily')
  @Permissions('audit.read')
  getDailyChangeReport(
    @Query('entity') entity?: string,
    @Query('userId') userId?: string,
  ) {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
    );

    return this.auditService.getChangeReport(
      startOfDay,
      endOfDay,
      entity,
      userId,
    );
  }

  /**
   * تقرير التغييرات الأسبوعي
   */
  @Get('reports/changes/weekly')
  @Permissions('audit.read')
  getWeeklyChangeReport(
    @Query('entity') entity?: string,
    @Query('userId') userId?: string,
  ) {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return this.auditService.getChangeReport(
      startOfWeek,
      endOfWeek,
      entity,
      userId,
    );
  }

  /**
   * تقرير الامتثال (Compliance Report)
   */
  @Get('reports/compliance')
  @Permissions('audit.compliance')
  async getComplianceReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('branchId') branchId?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const stats = await this.auditService.getAuditStats(start, end, branchId);

    // معايير الامتثال
    const complianceMetrics = {
      totalAuditableEvents: stats.totalLogs,
      auditCoverage: 100, // نسبة التغطية (نفترض 100% للأنظمة الحساسة)
      errorRate: stats.errorRate,
      securityIncidents:
        (stats.logsBySeverity['critical'] || 0) +
        (stats.logsBySeverity['error'] || 0),
      dataAccessEvents:
        (stats.logsByAction['READ'] || 0) + (stats.logsByAction['UPDATE'] || 0),
      adminActions: stats.logsByAction['PERMISSION_CHANGE'] || 0,
      complianceStatus: stats.errorRate < 5 ? 'compliant' : 'needs_attention',
    };

    return {
      period: {
        startDate: start?.toISOString(),
        endDate: end?.toISOString(),
        branchId,
      },
      complianceMetrics,
      auditTrail: stats.recentActivity.slice(0, 20),
      recommendations:
        this.generateComplianceRecommendations(complianceMetrics),
    };
  }

  /**
   * تصدير سجلات التدقيق إلى Excel
   */
  @Get('export/excel')
  @Permissions('audit.export')
  async exportAuditLogsToExcel(
    @Res() res: Response,
    @Query()
    query: {
      userId?: string;
      action?: string;
      entity?: string;
      entityId?: string;
      branchId?: string;
      warehouseId?: string;
      startDate?: string;
      endDate?: string;
      success?: string;
      severity?: string;
      category?: string;
      referenceType?: string;
      referenceId?: string;
      module?: string;
      searchText?: string;
    },
  ) {
    try {
      const auditQuery: AuditQuery = {
        userId: query.userId,
        action: query.action,
        entity: query.entity,
        entityId: query.entityId,
        branchId: query.branchId,
        warehouseId: query.warehouseId,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        success: query.success ? query.success === 'true' : undefined,
        severity: query.severity,
        category: query.category,
        referenceType: query.referenceType,
        referenceId: query.referenceId,
        module: query.module,
        searchText: query.searchText,
      };

      const logs = await this.auditService.exportAuditLogs(auditQuery);

      // TODO: تنفيذ تصدير Excel باستخدام مكتبة مثل exceljs
      // للآن نرجع البيانات كـ JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.json`,
      );
      res.send(JSON.stringify(logs, null, 2));
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'فشل في تصدير سجلات التدقيق',
        error: error.message,
      });
    }
  }

  /**
   * تصدير سجلات التدقيق إلى JSON
   */
  @Get('export/json')
  @Permissions('audit.export')
  async exportAuditLogsToJSON(
    @Res() res: Response,
    @Query()
    query: {
      userId?: string;
      action?: string;
      entity?: string;
      entityId?: string;
      branchId?: string;
      warehouseId?: string;
      startDate?: string;
      endDate?: string;
      success?: string;
      severity?: string;
      category?: string;
      referenceType?: string;
      referenceId?: string;
      module?: string;
      searchText?: string;
    },
  ) {
    try {
      const auditQuery: AuditQuery = {
        userId: query.userId,
        action: query.action,
        entity: query.entity,
        entityId: query.entityId,
        branchId: query.branchId,
        warehouseId: query.warehouseId,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        success: query.success ? query.success === 'true' : undefined,
        severity: query.severity,
        category: query.category,
        referenceType: query.referenceType,
        referenceId: query.referenceId,
        module: query.module,
        searchText: query.searchText,
      };

      const logs = await this.auditService.exportAuditLogs(auditQuery);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.json`,
      );
      res.send(JSON.stringify(logs, null, 2));
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'فشل في تصدير سجلات التدقيق',
        error: error.message,
      });
    }
  }

  // ========== ADMIN OPERATIONS ==========

  /**
   * تنظيف سجلات التدقيق القديمة (للمدراء فقط)
   */
  @Get('cleanup/:days')
  @Permissions('audit.admin')
  async cleanupOldLogs(@Param('days') days: string) {
    const daysToKeep = parseInt(days);

    if (isNaN(daysToKeep) || daysToKeep < 30) {
      throw new Error('يجب أن يكون عدد الأيام 30 يوماً على الأقل');
    }

    const deletedCount = await this.auditService.cleanupOldLogs(daysToKeep);

    return {
      message: `تم حذف ${deletedCount} سجل تدقيق قديم`,
      daysKept: daysToKeep,
      deletedCount,
    };
  }

  // ========== HELPER METHODS ==========

  /**
   * إنشاء توصيات الامتثال
   */
  private generateComplianceRecommendations(metrics: any): string[] {
    const recommendations: string[] = [];

    if (metrics.errorRate > 10) {
      recommendations.push('مراجعة معدل الأخطاء العالي وتحسين استقرار النظام');
    }

    if (metrics.securityIncidents > 0) {
      recommendations.push('مراجعة الحوادث الأمنية وتعزيز إجراءات الأمان');
    }

    if (metrics.dataAccessEvents > 1000) {
      recommendations.push('مراجعة عمليات الوصول إلى البيانات الحساسة');
    }

    if (metrics.adminActions > 50) {
      recommendations.push('مراجعة تغييرات الصلاحيات الإدارية');
    }

    if (recommendations.length === 0) {
      recommendations.push('النظام يتوافق مع معايير الأمان والامتثال');
    }

    return recommendations;
  }
}
