import { Injectable, Logger, LoggerService, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { format } from 'util';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

export interface LogQuery {
  level?: LogLevel;
  context?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class LoggingService implements LoggerService {
  private readonly logger = new Logger(LoggingService.name);
  private logBuffer: LogEntry[] = [];
  private readonly bufferSize = 100;
  private logFilePath: string;
  private isWriting = false;

  constructor(private readonly configService: ConfigService) {
    this.logFilePath = path.join(
      this.configService.get<string>('LOG_DIR', './logs'),
      `app-${new Date().toISOString().split('T')[0]}.log`
    );
    this.ensureLogDirectory();
  }

  /**
   * ضمان وجود مجلد السجلات
   */
  private async ensureLogDirectory() {
    try {
      const logDir = path.dirname(this.logFilePath);
      await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
      this.logger.error('فشل في إنشاء مجلد السجلات:', error);
    }
  }

  /**
   * تسجيل رسالة
   */
  log(message: any, context?: string) {
    this.writeLog('log', message, context);
  }

  /**
   * تسجيل خطأ
   */
  error(message: any, stack?: string, context?: string) {
    this.writeLog('error', message, context, stack);
  }

  /**
   * تسجيل تحذير
   */
  warn(message: any, context?: string) {
    this.writeLog('warn', message, context);
  }

  /**
   * تسجيل معلومات
   */
  debug(message: any, context?: string) {
    if (this.isDebugEnabled()) {
      this.writeLog('debug', message, context);
    }
  }

  /**
   * تسجيل معلومات تفصيلية
   */
  verbose(message: any, context?: string) {
    if (this.isVerboseEnabled()) {
      this.writeLog('verbose', message, context);
    }
  }

  /**
   * كتابة السجل
   */
  private writeLog(
    level: LogLevel,
    message: any,
    context?: string,
    stack?: string,
  ) {
    try {
      const entry: LogEntry = {
        timestamp: new Date(),
        level,
        message: this.formatMessage(message),
        context,
      };

      if (level === 'error' && stack) {
        entry.error = {
          name: 'Error',
          message: this.formatMessage(message),
          stack,
        };
      }

      // إضافة السجل إلى الذاكرة المؤقتة
      this.logBuffer.push(entry);

      // كتابة السجلات عند امتلاء المخزن المؤقت
      if (this.logBuffer.length >= this.bufferSize) {
        this.flushLogs();
      }

      // طباعة في وحدة التحكم للمستوى الحالي
      if (this.shouldLogToConsole(level)) {
        this.logToConsole(entry);
      }

    } catch (error) {
      console.error('فشل في كتابة السجل:', error);
    }
  }

  /**
   * تسجيل مع metadata إضافية
   */
  logWithMetadata(
    level: LogLevel,
    message: any,
    metadata: {
      userId?: string;
      requestId?: string;
      ip?: string;
      userAgent?: string;
      method?: string;
      url?: string;
      statusCode?: number;
      duration?: number;
      error?: Error;
      context?: string;
      extra?: Record<string, any>;
    } = {},
  ) {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message: this.formatMessage(message),
      context: metadata.context,
      userId: metadata.userId,
      requestId: metadata.requestId,
      ip: metadata.ip,
      userAgent: metadata.userAgent,
      method: metadata.method,
      url: metadata.url,
      statusCode: metadata.statusCode,
      duration: metadata.duration,
      metadata: metadata.extra,
    };

    if (metadata.error) {
      entry.error = {
        name: metadata.error.name,
        message: metadata.error.message,
        stack: metadata.error.stack,
      };
    }

    this.logBuffer.push(entry);

    if (this.logBuffer.length >= this.bufferSize) {
      this.flushLogs();
    }

    if (this.shouldLogToConsole(level)) {
      this.logToConsole(entry);
    }
  }

  /**
   * تسجيل طلب HTTP
   */
  logHttpRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    userId?: string,
    ip?: string,
    userAgent?: string,
  ) {
    this.logWithMetadata('log', `HTTP ${method} ${url}`, {
      method,
      url,
      statusCode,
      duration,
      userId,
      ip,
      userAgent,
      context: 'HTTP',
    });
  }

  /**
   * تسجيل خطأ في التطبيق
   */
  logApplicationError(
    error: Error,
    context: string,
    userId?: string,
    requestId?: string,
  ) {
    this.logWithMetadata('error', error.message, {
      error,
      context,
      userId,
      requestId,
    });
  }

  /**
   * تسجيل نشاط المستخدم
   */
  logUserActivity(
    userId: string,
    action: string,
    details?: Record<string, any>,
  ) {
    this.logWithMetadata('log', `User ${userId}: ${action}`, {
      userId,
      context: 'USER_ACTIVITY',
      extra: details,
    });
  }

  /**
   * تسجيل نشاط الأعمال
   */
  logBusinessEvent(
    event: string,
    data: Record<string, any>,
    userId?: string,
  ) {
    this.logWithMetadata('log', `Business Event: ${event}`, {
      userId,
      context: 'BUSINESS',
      extra: data,
    });
  }

  /**
   * تسجيل مقياس
   */
  logMetric(
    name: string,
    value: number,
    unit?: string,
    tags?: Record<string, string>,
  ) {
    this.logWithMetadata('debug', `Metric: ${name} = ${value}${unit || ''}`, {
      context: 'METRIC',
      extra: { metric: name, value, unit, tags },
    });
  }

  /**
   * تنسيق الرسالة
   */
  private formatMessage(message: any): string {
    if (typeof message === 'string') {
      return message;
    }
    if (message instanceof Error) {
      return message.message;
    }
    return format('%o', message);
  }

  /**
   * كتابة السجلات إلى الملف
   */
  private async flushLogs() {
    if (this.isWriting || this.logBuffer.length === 0) {
      return;
    }

    this.isWriting = true;
    const logsToWrite = [...this.logBuffer];
    this.logBuffer = [];

    try {
      const logLines = logsToWrite.map(entry => JSON.stringify(entry)).join('\n') + '\n';
      await fs.appendFile(this.logFilePath, logLines);
    } catch (error) {
      this.logger.error('فشل في كتابة السجلات إلى الملف:', error);
      // إعادة السجلات إلى المخزن المؤقت
      this.logBuffer.unshift(...logsToWrite);
    } finally {
      this.isWriting = false;
    }
  }

  /**
   * طباعة السجل في وحدة التحكم
   */
  private logToConsole(entry: LogEntry) {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const context = entry.context ? `[${entry.context}]` : '';
    const userInfo = entry.userId ? `[User:${entry.userId}]` : '';

    let logMessage = `${timestamp} ${level} ${context}${userInfo} ${entry.message}`;

    if (entry.error?.stack) {
      logMessage += `\n${entry.error.stack}`;
    }

    switch (entry.level) {
      case 'error':
        console.error(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'debug':
        console.debug(logMessage);
        break;
      case 'verbose':
        console.log(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }

  /**
   * التحقق من إمكانية تسجيل المستوى
   */
  private shouldLogToConsole(level: LogLevel): boolean {
    const logLevels = this.configService.get<string[]>('LOG_LEVELS', ['log', 'error', 'warn']);
    return logLevels.includes(level);
  }

  /**
   * التحقق من تفعيل debug
   */
  private isDebugEnabled(): boolean {
    const logLevels = this.configService.get<string[]>('LOG_LEVELS', ['log', 'error', 'warn']);
    return logLevels.includes('debug');
  }

  /**
   * التحقق من تفعيل verbose
   */
  private isVerboseEnabled(): boolean {
    const logLevels = this.configService.get<string[]>('LOG_LEVELS', ['log', 'error', 'warn']);
    return logLevels.includes('verbose');
  }

  /**
   * البحث في السجلات
   */
  async queryLogs(query: LogQuery): Promise<{
    logs: LogEntry[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      // قراءة ملف السجل
      const logContent = await fs.readFile(this.logFilePath, 'utf-8');
      const allLogs: LogEntry[] = logContent
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (error) {
            return null;
          }
        })
        .filter(log => log !== null);

      // تطبيق الفلاتر
      let filteredLogs = allLogs;

      if (query.level) {
        filteredLogs = filteredLogs.filter(log => log.level === query.level);
      }

      if (query.context) {
        filteredLogs = filteredLogs.filter(log =>
          log.context?.toLowerCase().includes(query.context!.toLowerCase())
        );
      }

      if (query.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === query.userId);
      }

      if (query.startDate) {
        filteredLogs = filteredLogs.filter(log =>
          new Date(log.timestamp) >= query.startDate!
        );
      }

      if (query.endDate) {
        filteredLogs = filteredLogs.filter(log =>
          new Date(log.timestamp) <= query.endDate!
        );
      }

      if (query.search) {
        const searchLower = query.search.toLowerCase();
        filteredLogs = filteredLogs.filter(log =>
          log.message.toLowerCase().includes(searchLower) ||
          log.context?.toLowerCase().includes(searchLower) ||
          log.error?.message.toLowerCase().includes(searchLower)
        );
      }

      // ترتيب تنازلي حسب التاريخ
      filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const total = filteredLogs.length;
      const limit = query.limit || 100;
      const offset = query.offset || 0;
      const paginatedLogs = filteredLogs.slice(offset, offset + limit);

      return {
        logs: paginatedLogs,
        total,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      this.logger.error('فشل في البحث في السجلات:', error);
      return {
        logs: [],
        total: 0,
        hasMore: false,
      };
    }
  }

  /**
   * تنظيف السجلات القديمة
   */
  async cleanupOldLogs(daysToKeep: number = 30): Promise<number> {
    try {
      const logDir = path.dirname(this.logFilePath);
      const files = await fs.readdir(logDir);
      const logFiles = files.filter(file => file.endsWith('.log'));

      let deletedCount = 0;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      for (const file of logFiles) {
        const filePath = path.join(logDir, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          deletedCount++;
          this.logger.log(`تم حذف ملف سجل قديم: ${file}`);
        }
      }

      return deletedCount;
    } catch (error) {
      this.logger.error('فشل في تنظيف السجلات القديمة:', error);
      return 0;
    }
  }

  /**
   * الحصول على إحصائيات السجلات
   */
  async getLogStats(): Promise<{
    totalLogs: number;
    logsByLevel: Record<string, number>;
    logsByContext: Record<string, number>;
    oldestLog: Date | null;
    newestLog: Date | null;
    logFileSize: number;
  }> {
    try {
      const logContent = await fs.readFile(this.logFilePath, 'utf-8');
      const logs: LogEntry[] = logContent
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (error) {
            return null;
          }
        })
        .filter(log => log !== null);

      const logsByLevel: Record<string, number> = {};
      const logsByContext: Record<string, number> = {};
      let oldestLog: Date | null = null;
      let newestLog: Date | null = null;

      for (const log of logs) {
        // إحصاء حسب المستوى
        logsByLevel[log.level] = (logsByLevel[log.level] || 0) + 1;

        // إحصاء حسب السياق
        if (log.context) {
          logsByContext[log.context] = (logsByContext[log.context] || 0) + 1;
        }

        // تتبع التواريخ
        const logDate = new Date(log.timestamp);
        if (!oldestLog || logDate < oldestLog) {
          oldestLog = logDate;
        }
        if (!newestLog || logDate > newestLog) {
          newestLog = logDate;
        }
      }

      const stats = await fs.stat(this.logFilePath);

      return {
        totalLogs: logs.length,
        logsByLevel,
        logsByContext,
        oldestLog,
        newestLog,
        logFileSize: stats.size,
      };
    } catch (error) {
      this.logger.error('فشل في الحصول على إحصائيات السجلات:', error);
      return {
        totalLogs: 0,
        logsByLevel: {},
        logsByContext: {},
        oldestLog: null,
        newestLog: null,
        logFileSize: 0,
      };
    }
  }

  /**
   * تصدير السجلات
   */
  async exportLogs(query: LogQuery, format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const { logs } = await this.queryLogs({ ...query, limit: 10000 });

      if (format === 'csv') {
        const csvHeader = 'timestamp,level,context,userId,message,error\n';
        const csvRows = logs.map(log => {
          const timestamp = log.timestamp.toISOString();
          const level = log.level;
          const context = log.context || '';
          const userId = log.userId || '';
          const message = `"${log.message.replace(/"/g, '""')}"`;
          const error = log.error ? `"${log.error.message.replace(/"/g, '""')}"` : '';
          return `${timestamp},${level},${context},${userId},${message},${error}`;
        }).join('\n');

        return csvHeader + csvRows;
      } else {
        return JSON.stringify(logs, null, 2);
      }
    } catch (error) {
      this.logger.error('فشل في تصدير السجلات:', error);
      throw error;
    }
  }

  /**
   * إغلاق السجل (كتابة جميع السجلات المعلقة)
   */
  async close() {
    await this.flushLogs();
  }

  /**
   * الحصول على معلومات السجل
   */
  getLoggingInfo() {
    return {
      logFilePath: this.logFilePath,
      bufferSize: this.logBuffer.length,
      isWriting: this.isWriting,
      logLevels: this.configService.get<string[]>('LOG_LEVELS', ['log', 'error', 'warn']),
    };
  }
}
