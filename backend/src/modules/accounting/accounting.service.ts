import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
import { CreateGLAccountDto } from './dto/create-gl-account.dto';
import { UpdateGLAccountDto } from './dto/update-gl-account.dto';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';

export interface GLAccountWithDetails {
  id: string;
  accountCode: string;
  name: string;
  description?: string;
  accountType: string;
  parentId?: string;
  parent?: GLAccountWithDetails;
  children: GLAccountWithDetails[];
  isActive: boolean;
  isSystem: boolean;
  debitBalance: number;
  creditBalance: number;
  netBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalEntryWithDetails {
  id: string;
  entryNumber: string;
  entryDate: Date;
  description: string;
  referenceType?: string;
  referenceId?: string;
  sourceModule?: string;
  status: string;
  isSystem: boolean;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  createdBy?: string;
  creator?: {
    id: string;
    username: string;
    email: string;
  };
  lines: JournalEntryLineWithDetails[];
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalEntryLineWithDetails {
  id: string;
  journalEntryId: string;
  lineNumber: number;
  debitAccountId: string;
  debitAccount: {
    id: string;
    accountCode: string;
    name: string;
  };
  creditAccountId: string;
  creditAccount: {
    id: string;
    accountCode: string;
    name: string;
  };
  amount: number;
  description?: string;
  referenceType?: string;
  referenceId?: string;
  createdAt: Date;
}

export interface AccountingStats {
  glAccounts: {
    total: number;
    active: number;
    byType: Record<string, number>;
  };
  journalEntries: {
    total: number;
    posted: number;
    draft: number;
    system: number;
    manual: number;
  };
  balances: {
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
  };
}

@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);
  private readonly glAccountsCacheKey = 'gl_accounts';
  private readonly journalEntriesCacheKey = 'journal_entries';

  // حسابات النظام الافتراضية
  private readonly systemAccounts = {
    // أصول
    cash: { code: '1001', name: 'النقدية', type: 'asset' },
    accountsReceivable: { code: '1002', name: 'المدينون', type: 'asset' },
    inventory: { code: '1003', name: 'المخزون', type: 'asset' },

    // التزامات
    accountsPayable: { code: '2001', name: 'الدائنون', type: 'liability' },
    salesTaxPayable: {
      code: '2002',
      name: 'ضريبة المبيعات المستحقة',
      type: 'liability',
    },

    // حقوق الملكية
    capital: { code: '3001', name: 'رأس المال', type: 'equity' },
    retainedEarnings: {
      code: '3002',
      name: 'الأرباح المحتجزة',
      type: 'equity',
    },

    // إيرادات
    salesRevenue: { code: '4001', name: 'إيرادات المبيعات', type: 'revenue' },
    otherIncome: { code: '4002', name: 'إيرادات أخرى', type: 'revenue' },

    // مصروفات
    costOfGoodsSold: {
      code: '5001',
      name: 'تكلفة البضائع المباعة',
      type: 'expense',
    },
    operatingExpenses: {
      code: '5002',
      name: 'المصروفات التشغيلية',
      type: 'expense',
    },
    salariesExpense: { code: '5003', name: 'مرتبات', type: 'expense' },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * إنشاء حساب دفتر الأستاذ العام
   */
  async createGLAccount(
    createGLAccountDto: CreateGLAccountDto,
  ): Promise<GLAccountWithDetails> {
    try {
      this.logger.log(
        `إنشاء حساب GL: ${createGLAccountDto.accountCode} - ${createGLAccountDto.name}`,
      );

      // التحقق من عدم تكرار كود الحساب
      const existingAccount = await this.prisma.gLAccount.findUnique({
        where: { accountCode: createGLAccountDto.accountCode },
      });

      if (existingAccount) {
        throw new ConflictException('كود الحساب موجود بالفعل');
      }

      // التحقق من صحة الحساب الأب إذا تم تحديده
      if (createGLAccountDto.parentId) {
        const parentAccount = await this.prisma.gLAccount.findUnique({
          where: { id: createGLAccountDto.parentId },
        });

        if (!parentAccount) {
          throw new NotFoundException('الحساب الأب غير موجود');
        }

        // التحقق من عدم وجود حلقة في التسلسل الهرمي
        if (
          await this.wouldCreateCycle(
            createGLAccountDto.parentId,
            createGLAccountDto.parentId,
          )
        ) {
          throw new BadRequestException(
            'لا يمكن إنشاء حلقة في التسلسل الهرمي للحسابات',
          );
        }
      }

      const account = await this.prisma.gLAccount.create({
        data: {
          accountCode: createGLAccountDto.accountCode,
          name: createGLAccountDto.name,
          description: createGLAccountDto.description,
          accountType: createGLAccountDto.accountType,
          parentId: createGLAccountDto.parentId,
          isActive: createGLAccountDto.isActive ?? true,
          isSystem: createGLAccountDto.isSystem ?? false,
        },
      });

      await this.invalidateGLAccountsCache();

      const accountWithDetails = await this.buildGLAccountWithDetails(account);

      this.logger.log(`تم إنشاء حساب GL بنجاح`);
      return accountWithDetails;
    } catch (error) {
      this.logger.error('فشل في إنشاء حساب GL', error);
      throw error;
    }
  }

  /**
   * الحصول على حسابات GL
   */
  async findAllGLAccounts(
    includeInactive: boolean = false,
    accountType?: string,
  ): Promise<GLAccountWithDetails[]> {
    try {
      const cacheKey = `gl_accounts:${includeInactive}:${accountType || 'all'}`;

      const cachedAccounts =
        await this.cacheService.get<GLAccountWithDetails[]>(cacheKey);
      if (cachedAccounts) {
        return cachedAccounts;
      }

      const where: any = {};
      if (!includeInactive) {
        where.isActive = true;
      }
      if (accountType) {
        where.accountType = accountType;
      }

      const accounts = await this.prisma.gLAccount.findMany({
        where,
        orderBy: [{ accountCode: 'asc' }, { name: 'asc' }],
      });

      const accountsWithDetails = await Promise.all(
        accounts.map((account) => this.buildGLAccountWithDetails(account)),
      );

      await this.cacheService.set(cacheKey, accountsWithDetails, { ttl: 1800 });

      return accountsWithDetails;
    } catch (error) {
      this.logger.error('فشل في الحصول على حسابات GL', error);
      throw error;
    }
  }

  /**
   * الحصول على حساب GL بالمعرف
   */
  async findGLAccountById(id: string): Promise<GLAccountWithDetails> {
    try {
      const cacheKey = `gl_account:${id}`;
      const cachedAccount =
        await this.cacheService.get<GLAccountWithDetails>(cacheKey);

      if (cachedAccount) {
        return cachedAccount;
      }

      const account = await this.prisma.gLAccount.findUnique({
        where: { id },
      });

      if (!account) {
        throw new NotFoundException('حساب GL غير موجود');
      }

      const accountWithDetails = await this.buildGLAccountWithDetails(account);

      await this.cacheService.set(cacheKey, accountWithDetails, { ttl: 1800 });

      return accountWithDetails;
    } catch (error) {
      this.logger.error(`فشل في الحصول على حساب GL: ${id}`, error);
      throw error;
    }
  }

  /**
   * تحديث حساب GL
   */
  async updateGLAccount(
    id: string,
    updateGLAccountDto: UpdateGLAccountDto,
  ): Promise<GLAccountWithDetails> {
    try {
      this.logger.log(`تحديث حساب GL: ${id}`);

      const existingAccount = await this.prisma.gLAccount.findUnique({
        where: { id },
      });

      if (!existingAccount) {
        throw new NotFoundException('حساب GL غير موجود');
      }

      // منع تحديث الحسابات النظامية إلا للحقول المحدودة
      if (existingAccount.isSystem) {
        const allowedFields = ['isActive', 'description'];
        const requestedFields = Object.keys(updateGLAccountDto);

        const hasUnauthorizedFields = requestedFields.some(
          (field) => !allowedFields.includes(field),
        );

        if (hasUnauthorizedFields) {
          throw new BadRequestException(
            'لا يمكن تحديث الحسابات النظامية إلا للحقول المحدودة',
          );
        }
      }

      // التحقق من عدم تكرار كود الحساب
      if (
        updateGLAccountDto.accountCode &&
        updateGLAccountDto.accountCode !== existingAccount.accountCode
      ) {
        const existingCode = await this.prisma.gLAccount.findUnique({
          where: { accountCode: updateGLAccountDto.accountCode },
        });

        if (existingCode) {
          throw new ConflictException('كود الحساب موجود بالفعل');
        }
      }

      // التحقق من صحة الحساب الأب إذا تم تحديده
      if (updateGLAccountDto.parentId) {
        const parentAccount = await this.prisma.gLAccount.findUnique({
          where: { id: updateGLAccountDto.parentId },
        });

        if (!parentAccount) {
          throw new NotFoundException('الحساب الأب غير موجود');
        }

        // التحقق من عدم وجود حلقة في التسلسل الهرمي
        if (await this.wouldCreateCycle(id, updateGLAccountDto.parentId)) {
          throw new BadRequestException(
            'لا يمكن إنشاء حلقة في التسلسل الهرمي للحسابات',
          );
        }
      }

      const account = await this.prisma.gLAccount.update({
        where: { id },
        data: {
          accountCode: updateGLAccountDto.accountCode,
          name: updateGLAccountDto.name,
          description: updateGLAccountDto.description,
          accountType: updateGLAccountDto.accountType,
          parentId: updateGLAccountDto.parentId,
          isActive: updateGLAccountDto.isActive,
        },
      });

      await this.invalidateGLAccountsCache();

      const accountWithDetails = await this.buildGLAccountWithDetails(account);

      this.logger.log(`تم تحديث حساب GL بنجاح`);
      return accountWithDetails;
    } catch (error) {
      this.logger.error(`فشل في تحديث حساب GL: ${id}`, error);
      throw error;
    }
  }

  /**
   * حذف حساب GL
   */
  async removeGLAccount(id: string): Promise<void> {
    try {
      this.logger.log(`حذف حساب GL: ${id}`);

      const account = await this.prisma.gLAccount.findUnique({
        where: { id },
        include: {
          children: true,
          debitEntries: true,
          creditEntries: true,
        },
      });

      if (!account) {
        throw new NotFoundException('حساب GL غير موجود');
      }

      // منع حذف الحسابات النظامية
      if (account.isSystem) {
        throw new BadRequestException('لا يمكن حذف الحسابات النظامية');
      }

      // التحقق من عدم وجود حسابات فرعية
      if (account.children.length > 0) {
        throw new BadRequestException(
          'لا يمكن حذف حساب يحتوي على حسابات فرعية',
        );
      }

      // التحقق من عدم وجود قيود مرتبطة
      if (account.debitEntries.length > 0 || account.creditEntries.length > 0) {
        throw new BadRequestException('لا يمكن حذف حساب مرتبط بقيود يومية');
      }

      await this.prisma.gLAccount.delete({
        where: { id },
      });

      await this.invalidateGLAccountsCache();

      this.logger.log(`تم حذف حساب GL بنجاح`);
    } catch (error) {
      this.logger.error(`فشل في حذف حساب GL: ${id}`, error);
      throw error;
    }
  }

  /**
   * إنشاء قيد يومي
   */
  async createJournalEntry(
    createJournalEntryDto: CreateJournalEntryDto,
    userId: string,
  ): Promise<JournalEntryWithDetails> {
    try {
      this.logger.log(`إنشاء قيد يومي: ${createJournalEntryDto.entryNumber}`);

      // التحقق من عدم تكرار رقم القيد
      const existingEntry = await this.prisma.journalEntry.findUnique({
        where: { entryNumber: createJournalEntryDto.entryNumber },
      });

      if (existingEntry) {
        throw new ConflictException('رقم القيد موجود بالفعل');
      }

      // التحقق من توازن القيد
      const totalDebit = createJournalEntryDto.lines.reduce(
        (sum, line) => sum + Number(line.amount),
        0,
      );
      const totalCredit = createJournalEntryDto.lines.reduce(
        (sum, line) => sum + Number(line.amount),
        0,
      );

      if (totalDebit !== totalCredit) {
        throw new BadRequestException(
          'القيد غير متوازن - مجموع المدين يجب أن يساوي مجموع الدائن',
        );
      }

      // إنشاء القيد داخل معاملة قاعدة بيانات
      const journalEntry = await this.prisma.$transaction(async (tx) => {
        // إنشاء القيد الرئيسي
        const entry = await tx.journalEntry.create({
          data: {
            entryNumber: createJournalEntryDto.entryNumber,
            entryDate: createJournalEntryDto.entryDate
              ? new Date(createJournalEntryDto.entryDate)
              : new Date(),
            description: createJournalEntryDto.description,
            referenceType: createJournalEntryDto.referenceType,
            referenceId: createJournalEntryDto.referenceId,
            sourceModule: createJournalEntryDto.sourceModule,
            status: createJournalEntryDto.status || 'draft',
            isSystem: createJournalEntryDto.isSystem || false,
            totalDebit: totalDebit,
            totalCredit: totalCredit,
            createdBy: userId,
          },
        });

        // إنشاء سطور القيد
        for (let i = 0; i < createJournalEntryDto.lines.length; i++) {
          const line = createJournalEntryDto.lines[i];

          // التحقق من وجود حسابات GL
          const debitAccount = await tx.gLAccount.findUnique({
            where: { id: line.debitAccountId },
          });
          const creditAccount = await tx.gLAccount.findUnique({
            where: { id: line.creditAccountId },
          });

          if (!debitAccount) {
            throw new NotFoundException(
              `حساب المدين غير موجود: ${line.debitAccountId}`,
            );
          }
          if (!creditAccount) {
            throw new NotFoundException(
              `حساب الدائن غير موجود: ${line.creditAccountId}`,
            );
          }

          await tx.journalEntryLine.create({
            data: {
              journalEntryId: entry.id,
              lineNumber: i + 1,
              debitAccountId: line.debitAccountId,
              creditAccountId: line.creditAccountId,
              amount: line.amount,
              description: line.description,
              referenceType: line.referenceType,
              referenceId: line.referenceId,
            },
          });

          // تحديث أرصدة الحسابات إذا كان القيد معتمد
          if (entry.status === 'posted') {
            await tx.gLAccount.update({
              where: { id: line.debitAccountId },
              data: {
                debitBalance: { increment: line.amount },
              },
            });

            await tx.gLAccount.update({
              where: { id: line.creditAccountId },
              data: {
                creditBalance: { increment: line.amount },
              },
            });
          }
        }

        return entry;
      });

      await this.invalidateJournalEntriesCache();

      const entryWithDetails =
        await this.buildJournalEntryWithDetails(journalEntry);

      this.logger.log(`تم إنشاء القيد اليومي بنجاح`);
      return entryWithDetails;
    } catch (error) {
      this.logger.error('فشل في إنشاء القيد اليومي', error);
      throw error;
    }
  }

  /**
   * الحصول على القيود اليومية
   */
  async findAllJournalEntries(
    status?: string,
    sourceModule?: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 50,
  ): Promise<JournalEntryWithDetails[]> {
    try {
      const cacheKey = `journal_entries:${status || 'all'}:${sourceModule || 'all'}:${startDate?.toISOString() || 'all'}:${endDate?.toISOString() || 'all'}:${limit}`;

      const cachedEntries =
        await this.cacheService.get<JournalEntryWithDetails[]>(cacheKey);
      if (cachedEntries) {
        return cachedEntries;
      }

      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (sourceModule) {
        where.sourceModule = sourceModule;
      }

      if (startDate || endDate) {
        where.entryDate = {};
        if (startDate) where.entryDate.gte = startDate;
        if (endDate) where.entryDate.lte = endDate;
      }

      const entries = await this.prisma.journalEntry.findMany({
        where,
        orderBy: { entryDate: 'desc' },
        take: limit,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      const entriesWithDetails = await Promise.all(
        entries.map((entry) => this.buildJournalEntryWithDetails(entry)),
      );

      await this.cacheService.set(cacheKey, entriesWithDetails, { ttl: 600 });

      return entriesWithDetails;
    } catch (error) {
      this.logger.error('فشل في الحصول على القيود اليومية', error);
      throw error;
    }
  }

  /**
   * الحصول على قيد يومي بالمعرف
   */
  async findJournalEntryById(id: string): Promise<JournalEntryWithDetails> {
    try {
      const cacheKey = `journal_entry:${id}`;
      const cachedEntry =
        await this.cacheService.get<JournalEntryWithDetails>(cacheKey);

      if (cachedEntry) {
        return cachedEntry;
      }

      const entry = await this.prisma.journalEntry.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      if (!entry) {
        throw new NotFoundException('القيد اليومي غير موجود');
      }

      const entryWithDetails = await this.buildJournalEntryWithDetails(entry);

      await this.cacheService.set(cacheKey, entryWithDetails, { ttl: 1800 });

      return entryWithDetails;
    } catch (error) {
      this.logger.error(`فشل في الحصول على القيد اليومي: ${id}`, error);
      throw error;
    }
  }

  /**
   * اعتماد قيد يومي
   */
  async postJournalEntry(id: string): Promise<JournalEntryWithDetails> {
    try {
      this.logger.log(`اعتماد القيد اليومي: ${id}`);

      const entry = await this.prisma.journalEntry.findUnique({
        where: { id },
        include: {
          lines: true,
        },
      });

      if (!entry) {
        throw new NotFoundException('القيد اليومي غير موجود');
      }

      if (entry.status === 'posted') {
        throw new BadRequestException('القيد معتمد بالفعل');
      }

      // اعتماد القيد داخل معاملة قاعدة بيانات
      await this.prisma.$transaction(async (tx) => {
        // تحديث حالة القيد
        await tx.journalEntry.update({
          where: { id },
          data: { status: 'posted' },
        });

        // تحديث أرصدة الحسابات
        for (const line of entry.lines) {
          await tx.gLAccount.update({
            where: { id: line.debitAccountId },
            data: {
              debitBalance: { increment: line.amount },
            },
          });

          await tx.gLAccount.update({
            where: { id: line.creditAccountId },
            data: {
              creditBalance: { increment: line.amount },
            },
          });
        }
      });

      await this.invalidateJournalEntriesCache();

      const updatedEntry = await this.findJournalEntryById(id);

      this.logger.log(`تم اعتماد القيد اليومي بنجاح`);
      return updatedEntry;
    } catch (error) {
      this.logger.error(`فشل في اعتماد القيد اليومي: ${id}`, error);
      throw error;
    }
  }

  /**
   * إلغاء اعتماد قيد يومي
   */
  async unpostJournalEntry(id: string): Promise<JournalEntryWithDetails> {
    try {
      this.logger.log(`إلغاء اعتماد القيد اليومي: ${id}`);

      const entry = await this.prisma.journalEntry.findUnique({
        where: { id },
        include: {
          lines: true,
        },
      });

      if (!entry) {
        throw new NotFoundException('القيد اليومي غير موجود');
      }

      if (entry.status !== 'posted') {
        throw new BadRequestException('القيد غير معتمد');
      }

      // إلغاء اعتماد القيد داخل معاملة قاعدة بيانات
      await this.prisma.$transaction(async (tx) => {
        // تحديث حالة القيد
        await tx.journalEntry.update({
          where: { id },
          data: { status: 'draft' },
        });

        // إعادة أرصدة الحسابات
        for (const line of entry.lines) {
          await tx.gLAccount.update({
            where: { id: line.debitAccountId },
            data: {
              debitBalance: { decrement: line.amount },
            },
          });

          await tx.gLAccount.update({
            where: { id: line.creditAccountId },
            data: {
              creditBalance: { decrement: line.amount },
            },
          });
        }
      });

      await this.invalidateJournalEntriesCache();

      const updatedEntry = await this.findJournalEntryById(id);

      this.logger.log(`تم إلغاء اعتماد القيد اليومي بنجاح`);
      return updatedEntry;
    } catch (error) {
      this.logger.error(`فشل في إلغاء اعتماد القيد اليومي: ${id}`, error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات المحاسبة
   */
  async getAccountingStats(
    startDate?: Date,
    endDate?: Date,
  ): Promise<AccountingStats> {
    try {
      const where: any = {};

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      const [
        glAccountsStats,
        journalEntriesStats,
        assetBalance,
        liabilityBalance,
        equityBalance,
        revenueBalance,
        expenseBalance,
      ] = await Promise.all([
        // إحصائيات حسابات GL
        this.prisma.gLAccount.groupBy({
          by: ['accountType', 'isActive'],
          _count: { id: true },
        }),

        // إحصائيات القيود اليومية
        this.prisma.journalEntry.groupBy({
          by: ['status', 'isSystem'],
          _count: { id: true },
        }),

        // إجمالي الأصول
        this.prisma.gLAccount.aggregate({
          where: { accountType: 'asset' },
          _sum: { debitBalance: true, creditBalance: true },
        }),

        // إجمالي الالتزامات
        this.prisma.gLAccount.aggregate({
          where: { accountType: 'liability' },
          _sum: { debitBalance: true, creditBalance: true },
        }),

        // إجمالي حقوق الملكية
        this.prisma.gLAccount.aggregate({
          where: { accountType: 'equity' },
          _sum: { debitBalance: true, creditBalance: true },
        }),

        // إجمالي الإيرادات
        this.prisma.gLAccount.aggregate({
          where: { accountType: 'revenue' },
          _sum: { debitBalance: true, creditBalance: true },
        }),

        // إجمالي المصروفات
        this.prisma.gLAccount.aggregate({
          where: { accountType: 'expense' },
          _sum: { debitBalance: true, creditBalance: true },
        }),
      ]);

      // حساب إحصائيات حسابات GL
      const glAccountsByType: Record<string, number> = {};
      let totalGLAccounts = 0;
      let activeGLAccounts = 0;

      glAccountsStats.forEach((stat) => {
        totalGLAccounts += stat._count.id;
        if (stat.isActive) {
          activeGLAccounts += stat._count.id;
        }
        if (!glAccountsByType[stat.accountType]) {
          glAccountsByType[stat.accountType] = 0;
        }
        glAccountsByType[stat.accountType] += stat._count.id;
      });

      // حساب إحصائيات القيود اليومية
      let totalJournalEntries = 0;
      let postedEntries = 0;
      let draftEntries = 0;
      let systemEntries = 0;
      let manualEntries = 0;

      journalEntriesStats.forEach((stat) => {
        totalJournalEntries += stat._count.id;
        if (stat.status === 'posted') {
          postedEntries += stat._count.id;
        } else if (stat.status === 'draft') {
          draftEntries += stat._count.id;
        }

        if (stat.isSystem) {
          systemEntries += stat._count.id;
        } else {
          manualEntries += stat._count.id;
        }
      });

      // حساب الأرصدة
      const totalAssets =
        Number(assetBalance._sum.debitBalance || 0) -
        Number(assetBalance._sum.creditBalance || 0);
      const totalLiabilities =
        Number(liabilityBalance._sum.creditBalance || 0) -
        Number(liabilityBalance._sum.debitBalance || 0);
      const totalEquity =
        Number(equityBalance._sum.creditBalance || 0) -
        Number(equityBalance._sum.debitBalance || 0);
      const totalRevenue =
        Number(revenueBalance._sum.creditBalance || 0) -
        Number(revenueBalance._sum.debitBalance || 0);
      const totalExpenses =
        Number(expenseBalance._sum.debitBalance || 0) -
        Number(expenseBalance._sum.creditBalance || 0);
      const netProfit = totalRevenue - totalExpenses;

      return {
        glAccounts: {
          total: totalGLAccounts,
          active: activeGLAccounts,
          byType: glAccountsByType,
        },
        journalEntries: {
          total: totalJournalEntries,
          posted: postedEntries,
          draft: draftEntries,
          system: systemEntries,
          manual: manualEntries,
        },
        balances: {
          totalAssets,
          totalLiabilities,
          totalEquity,
          totalRevenue,
          totalExpenses,
          netProfit,
        },
      };
    } catch (error) {
      this.logger.error('فشل في الحصول على إحصائيات المحاسبة', error);
      throw error;
    }
  }

  /**
   * إنشاء حسابات النظام الافتراضية
   */
  async createDefaultSystemAccounts(): Promise<void> {
    try {
      this.logger.log('إنشاء حسابات النظام الافتراضية');

      const existingAccounts = await this.prisma.gLAccount.findMany({
        where: { isSystem: true },
      });

      if (existingAccounts.length > 0) {
        this.logger.log('حسابات النظام موجودة بالفعل');
        return;
      }

      for (const [key, account] of Object.entries(this.systemAccounts)) {
        await this.prisma.gLAccount.create({
          data: {
            accountCode: account.code,
            name: account.name,
            accountType: account.type,
            isSystem: true,
            isActive: true,
          },
        });
      }

      await this.invalidateGLAccountsCache();

      this.logger.log('تم إنشاء حسابات النظام الافتراضية بنجاح');
    } catch (error) {
      this.logger.error('فشل في إنشاء حسابات النظام الافتراضية', error);
      throw error;
    }
  }

  /**
   * إنشاء قيود تلقائية للمبيعات
   */
  async createSalesJournalEntry(
    salesInvoiceId: string,
    customerId: string,
    totalAmount: number,
    taxAmount: number,
    userId: string,
  ): Promise<JournalEntryWithDetails> {
    try {
      this.logger.log(`إنشاء قيد تلقائي للمبيعات: ${salesInvoiceId}`);

      // الحصول على حسابات النظام
      const accountsReceivable = await this.prisma.gLAccount.findFirst({
        where: { accountCode: this.systemAccounts.accountsReceivable.code },
      });

      const salesRevenue = await this.prisma.gLAccount.findFirst({
        where: { accountCode: this.systemAccounts.salesRevenue.code },
      });

      const salesTaxPayable = await this.prisma.gLAccount.findFirst({
        where: { accountCode: this.systemAccounts.salesTaxPayable.code },
      });

      if (!accountsReceivable || !salesRevenue || !salesTaxPayable) {
        throw new BadRequestException(
          'حسابات النظام غير متوفرة - يرجى إنشاء حسابات النظام أولاً',
        );
      }

      // إنشاء قيد المبيعات
      const entryNumber = `SALE-${Date.now()}`;
      const entryDto: CreateJournalEntryDto = {
        entryNumber,
        description: `قيد تلقائي لفاتورة المبيعات رقم ${salesInvoiceId}`,
        referenceType: 'sales_invoice',
        referenceId: salesInvoiceId,
        sourceModule: 'sales',
        status: 'posted',
        isSystem: true,
        lines: [
          {
            debitAccountId: accountsReceivable.id,
            creditAccountId: salesRevenue.id,
            amount: totalAmount - taxAmount,
            description: 'إيرادات المبيعات',
            referenceType: 'sales_invoice',
            referenceId: salesInvoiceId,
          },
        ],
      };

      // إضافة سطر الضريبة إذا كان هناك ضريبة
      if (taxAmount > 0) {
        entryDto.lines.push({
          debitAccountId: accountsReceivable.id,
          creditAccountId: salesTaxPayable.id,
          amount: taxAmount,
          description: 'ضريبة المبيعات',
          referenceType: 'sales_invoice',
          referenceId: salesInvoiceId,
        });
      }

      const journalEntry = await this.createJournalEntry(entryDto, userId);

      this.logger.log(`تم إنشاء قيد المبيعات بنجاح`);
      return journalEntry;
    } catch (error) {
      this.logger.error(`فشل في إنشاء قيد المبيعات: ${salesInvoiceId}`, error);
      throw error;
    }
  }

  /**
   * إنشاء قيود تلقائية للمشتريات
   */
  async createPurchaseJournalEntry(
    purchaseInvoiceId: string,
    supplierId: string,
    totalAmount: number,
    taxAmount: number,
    userId: string,
  ): Promise<JournalEntryWithDetails> {
    try {
      this.logger.log(`إنشاء قيد تلقائي للمشتريات: ${purchaseInvoiceId}`);

      // الحصول على حسابات النظام
      const accountsPayable = await this.prisma.gLAccount.findFirst({
        where: { accountCode: this.systemAccounts.accountsPayable.code },
      });

      const inventory = await this.prisma.gLAccount.findFirst({
        where: { accountCode: this.systemAccounts.inventory.code },
      });

      if (!accountsPayable || !inventory) {
        throw new BadRequestException(
          'حسابات النظام غير متوفرة - يرجى إنشاء حسابات النظام أولاً',
        );
      }

      // إنشاء قيد المشتريات
      const entryNumber = `PURCHASE-${Date.now()}`;
      const entryDto: CreateJournalEntryDto = {
        entryNumber,
        description: `قيد تلقائي لفاتورة المشتريات رقم ${purchaseInvoiceId}`,
        referenceType: 'purchase_invoice',
        referenceId: purchaseInvoiceId,
        sourceModule: 'purchasing',
        status: 'posted',
        isSystem: true,
        lines: [
          {
            debitAccountId: inventory.id,
            creditAccountId: accountsPayable.id,
            amount: totalAmount,
            description: 'مشتريات المخزون',
            referenceType: 'purchase_invoice',
            referenceId: purchaseInvoiceId,
          },
        ],
      };

      const journalEntry = await this.createJournalEntry(entryDto, userId);

      this.logger.log(`تم إنشاء قيد المشتريات بنجاح`);
      return journalEntry;
    } catch (error) {
      this.logger.error(
        `فشل في إنشاء قيد المشتريات: ${purchaseInvoiceId}`,
        error,
      );
      throw error;
    }
  }

  // ========== HELPER METHODS ==========

  /**
   * بناء كائن حساب GL مع التفاصيل
   */
  private async buildGLAccountWithDetails(
    account: any,
  ): Promise<GLAccountWithDetails> {
    const [children, parent] = await Promise.all([
      this.prisma.gLAccount.findMany({
        where: { parentId: account.id },
        orderBy: { accountCode: 'asc' },
      }),
      account.parentId
        ? this.prisma.gLAccount.findUnique({
            where: { id: account.parentId },
          })
        : null,
    ]);

    const childrenWithDetails = await Promise.all(
      children.map((child) => this.buildGLAccountWithDetails(child)),
    );

    return {
      id: account.id,
      accountCode: account.accountCode,
      name: account.name,
      description: account.description || undefined,
      accountType: account.accountType,
      parentId: account.parentId || undefined,
      parent: parent ? await this.buildGLAccountWithDetails(parent) : undefined,
      children: childrenWithDetails,
      isActive: account.isActive,
      isSystem: account.isSystem,
      debitBalance: Number(account.debitBalance),
      creditBalance: Number(account.creditBalance),
      netBalance: Number(account.debitBalance) - Number(account.creditBalance),
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  /**
   * بناء كائن القيد اليومي مع التفاصيل
   */
  private async buildJournalEntryWithDetails(
    entry: any,
  ): Promise<JournalEntryWithDetails> {
    const lines = await this.prisma.journalEntryLine.findMany({
      where: { journalEntryId: entry.id },
      orderBy: { lineNumber: 'asc' },
      include: {
        debitAccount: {
          select: {
            id: true,
            accountCode: true,
            name: true,
          },
        },
        creditAccount: {
          select: {
            id: true,
            accountCode: true,
            name: true,
          },
        },
      },
    });

    return {
      id: entry.id,
      entryNumber: entry.entryNumber,
      entryDate: entry.entryDate,
      description: entry.description,
      referenceType: entry.referenceType || undefined,
      referenceId: entry.referenceId || undefined,
      sourceModule: entry.sourceModule || undefined,
      status: entry.status,
      isSystem: entry.isSystem,
      totalDebit: Number(entry.totalDebit),
      totalCredit: Number(entry.totalCredit),
      isBalanced: Number(entry.totalDebit) === Number(entry.totalCredit),
      createdBy: entry.createdBy || undefined,
      creator: entry.creator || undefined,
      lines: lines.map((line) => ({
        id: line.id,
        journalEntryId: line.journalEntryId,
        lineNumber: line.lineNumber,
        debitAccountId: line.debitAccountId,
        debitAccount: line.debitAccount,
        creditAccountId: line.creditAccountId,
        creditAccount: line.creditAccount,
        amount: Number(line.amount),
        description: line.description || undefined,
        referenceType: line.referenceType || undefined,
        referenceId: line.referenceId || undefined,
        createdAt: line.createdAt,
      })),
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }

  /**
   * التحقق من وجود حلقة في التسلسل الهرمي
   */
  private async wouldCreateCycle(
    accountId: string,
    parentId: string,
  ): Promise<boolean> {
    let currentId: string | null = parentId;

    while (currentId) {
      if (currentId === accountId) {
        return true;
      }

      const account = await this.prisma.gLAccount.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });

      currentId = account?.parentId || null;
    }

    return false;
  }

  /**
   * إبطال كاش حسابات GL
   */
  private async invalidateGLAccountsCache(): Promise<void> {
    await this.cacheService.delete(this.glAccountsCacheKey);

    const accountKeys = await this.cacheService.getKeys(`gl_account:*`);
    for (const key of accountKeys) {
      await this.cacheService.delete(key);
    }
  }

  /**
   * إبطال كاش القيود اليومية
   */
  private async invalidateJournalEntriesCache(): Promise<void> {
    await this.cacheService.delete(this.journalEntriesCacheKey);

    const entryKeys = await this.cacheService.getKeys(`journal_entry:*`);
    for (const key of entryKeys) {
      await this.cacheService.delete(key);
    }
  }
}
