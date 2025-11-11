import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { CreateGLAccountDto } from './dto/create-gl-account.dto';
import { UpdateGLAccountDto } from './dto/update-gl-account.dto';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
// import { User } from '../../common/decorators/user.decorator';

@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  // ========== GL ACCOUNTS ENDPOINTS ==========

  /**
   * إنشاء حساب GL جديد
   */
  @Post('gl-accounts')
  @Permissions('accounting.gl_accounts.create')
  @HttpCode(HttpStatus.CREATED)
  createGLAccount(@Body() createGLAccountDto: CreateGLAccountDto) {
    return this.accountingService.createGLAccount(createGLAccountDto);
  }

  /**
   * الحصول على حسابات GL
   */
  @Get('gl-accounts')
  @Permissions('accounting.gl_accounts.read')
  findAllGLAccounts(
    @Query('includeInactive') includeInactive?: string,
    @Query('accountType') accountType?: string,
  ) {
    return this.accountingService.findAllGLAccounts(
      includeInactive === 'true',
      accountType,
    );
  }

  /**
   * الحصول على حساب GL بالمعرف
   */
  @Get('gl-accounts/:id')
  @Permissions('accounting.gl_accounts.read')
  findGLAccountById(@Param('id') id: string) {
    return this.accountingService.findGLAccountById(id);
  }

  /**
   * تحديث حساب GL
   */
  @Patch('gl-accounts/:id')
  @Permissions('accounting.gl_accounts.update')
  @HttpCode(HttpStatus.OK)
  updateGLAccount(
    @Param('id') id: string,
    @Body() updateGLAccountDto: UpdateGLAccountDto,
  ) {
    return this.accountingService.updateGLAccount(id, updateGLAccountDto);
  }

  /**
   * حذف حساب GL
   */
  @Delete('gl-accounts/:id')
  @Permissions('accounting.gl_accounts.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeGLAccount(@Param('id') id: string) {
    return this.accountingService.removeGLAccount(id);
  }

  // ========== JOURNAL ENTRIES ENDPOINTS ==========

  /**
   * إنشاء قيد يومي جديد
   */
  @Post('journal-entries')
  @Permissions('accounting.journal_entries.create')
  @HttpCode(HttpStatus.CREATED)
  createJournalEntry(
    @Body() createJournalEntryDto: CreateJournalEntryDto,
    @Req() req: any,
  ) {
    return this.accountingService.createJournalEntry(
      createJournalEntryDto,
      req.user.id,
    );
  }

  /**
   * الحصول على القيود اليومية
   */
  @Get('journal-entries')
  @Permissions('accounting.journal_entries.read')
  findAllJournalEntries(
    @Query('status') status?: string,
    @Query('sourceModule') sourceModule?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ) {
    return this.accountingService.findAllJournalEntries(
      status,
      sourceModule,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      limit ? parseInt(limit.toString()) : 50,
    );
  }

  /**
   * الحصول على قيد يومي بالمعرف
   */
  @Get('journal-entries/:id')
  @Permissions('accounting.journal_entries.read')
  findJournalEntryById(@Param('id') id: string) {
    return this.accountingService.findJournalEntryById(id);
  }

  /**
   * اعتماد قيد يومي
   */
  @Patch('journal-entries/:id/post')
  @Permissions('accounting.journal_entries.post')
  @HttpCode(HttpStatus.OK)
  postJournalEntry(@Param('id') id: string) {
    return this.accountingService.postJournalEntry(id);
  }

  /**
   * إلغاء اعتماد قيد يومي
   */
  @Patch('journal-entries/:id/unpost')
  @Permissions('accounting.journal_entries.unpost')
  @HttpCode(HttpStatus.OK)
  unpostJournalEntry(@Param('id') id: string) {
    return this.accountingService.unpostJournalEntry(id);
  }

  // ========== SYSTEM ENDPOINTS ==========

  /**
   * إنشاء حسابات النظام الافتراضية
   */
  @Post('setup/system-accounts')
  @Permissions('accounting.setup')
  @HttpCode(HttpStatus.OK)
  async createDefaultSystemAccounts() {
    await this.accountingService.createDefaultSystemAccounts();
    return { message: 'تم إنشاء حسابات النظام الافتراضية بنجاح' };
  }

  /**
   * الحصول على إحصائيات المحاسبة
   */
  @Get('stats/overview')
  @Permissions('accounting.reports')
  getAccountingStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.accountingService.getAccountingStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  // ========== AUTOMATIC JOURNAL ENTRIES ==========

  /**
   * إنشاء قيد تلقائي للمبيعات (للاستخدام الداخلي)
   */
  @Post('auto/sales/:salesInvoiceId')
  @Permissions('accounting.auto_entries')
  @HttpCode(HttpStatus.OK)
  createSalesJournalEntry(
    @Param('salesInvoiceId') salesInvoiceId: string,
    @Body('customerId') customerId: string,
    @Body('totalAmount') totalAmount: number,
    @Body('taxAmount') taxAmount: number,
    @Req() req: any,
  ) {
    return this.accountingService.createSalesJournalEntry(
      salesInvoiceId,
      customerId,
      totalAmount,
      taxAmount,
      req.user.id,
    );
  }

  /**
   * إنشاء قيد تلقائي للمشتريات (للاستخدام الداخلي)
   */
  @Post('auto/purchase/:purchaseInvoiceId')
  @Permissions('accounting.auto_entries')
  @HttpCode(HttpStatus.OK)
  createPurchaseJournalEntry(
    @Param('purchaseInvoiceId') purchaseInvoiceId: string,
    @Body('supplierId') supplierId: string,
    @Body('totalAmount') totalAmount: number,
    @Body('taxAmount') taxAmount: number,
    @Req() req: any,
  ) {
    return this.accountingService.createPurchaseJournalEntry(
      purchaseInvoiceId,
      supplierId,
      totalAmount,
      taxAmount,
      req.user.id,
    );
  }

  // ========== REPORTS ENDPOINTS ==========

  /**
   * تقرير الميزانية العمومية
   */
  @Get('reports/balance-sheet')
  @Permissions('accounting.reports')
  getBalanceSheetReport(@Query('asOfDate') asOfDate?: string) {
    // سيتم تنفيذه في الخدمة
    return { message: 'تقرير الميزانية العمومية - سيتم إضافة قريباً' };
  }

  /**
   * تقرير الأرباح والخسائر
   */
  @Get('reports/profit-loss')
  @Permissions('accounting.reports')
  getProfitLossReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    // سيتم تنفيذه في الخدمة
    return { message: 'تقرير الأرباح والخسائر - سيتم إضافة قريباً' };
  }

  /**
   * تقرير حركة الحسابات
   */
  @Get('reports/account-movement/:accountId')
  @Permissions('accounting.reports')
  getAccountMovementReport(
    @Param('accountId') accountId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    // سيتم تنفيذه في الخدمة
    return { message: 'تقرير حركة الحسابات - سيتم إضافة قريباً' };
  }

  /**
   * تصدير البيانات المحاسبية
   */
  @Get('export/trial-balance')
  @Permissions('accounting.export')
  exportTrialBalance(@Query('asOfDate') asOfDate?: string) {
    // سيتم تنفيذه في الخدمة
    return { message: 'تصدير ميزان المراجعة - سيتم إضافة قريباً' };
  }

  /**
   * تصدير القيود اليومية
   */
  @Get('export/journal-entries')
  @Permissions('accounting.export')
  exportJournalEntries(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('format') format?: string,
  ) {
    // سيتم تنفيذه في الخدمة
    return { message: 'تصدير القيود اليومية - سيتم إضافة قريباً' };
  }
}
