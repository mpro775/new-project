import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsArray,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

class JournalEntryLineDto {
  @IsNotEmpty({ message: 'معرف حساب المدين مطلوب' })
  @IsString({ message: 'معرف حساب المدين يجب أن يكون نص' })
  debitAccountId: string;

  @IsNotEmpty({ message: 'معرف حساب الدائن مطلوب' })
  @IsString({ message: 'معرف حساب الدائن يجب أن يكون نص' })
  creditAccountId: string;

  @IsNotEmpty({ message: 'المبلغ مطلوب' })
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsString({ message: 'وصف السطر يجب أن يكون نص' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'نوع المرجع يجب أن يكون نص' })
  referenceType?: string;

  @IsOptional()
  @IsString({ message: 'معرف المرجع يجب أن يكون نص' })
  referenceId?: string;
}

export class CreateJournalEntryDto {
  @IsNotEmpty({ message: 'رقم القيد مطلوب' })
  @IsString({ message: 'رقم القيد يجب أن يكون نص' })
  entryNumber: string;

  @IsOptional()
  @IsDateString({}, { message: 'تاريخ القيد غير صحيح' })
  entryDate?: string;

  @IsNotEmpty({ message: 'وصف القيد مطلوب' })
  @IsString({ message: 'وصف القيد يجب أن يكون نص' })
  description: string;

  @IsOptional()
  @IsString({ message: 'نوع المرجع يجب أن يكون نص' })
  referenceType?: string;

  @IsOptional()
  @IsString({ message: 'معرف المرجع يجب أن يكون نص' })
  referenceId?: string;

  @IsOptional()
  @IsString({ message: 'وحدة المصدر يجب أن تكون نص' })
  sourceModule?: string;

  @IsOptional()
  @IsIn(['draft', 'posted'], {
    message: 'حالة القيد يجب أن تكون draft أو posted',
  })
  status?: string;

  @IsOptional()
  @IsBoolean({ message: 'حالة النظام يجب أن تكون منطقية' })
  isSystem?: boolean;

  @IsNotEmpty({ message: 'سطور القيد مطلوبة' })
  @IsArray({ message: 'سطور القيد يجب أن تكون مصفوفة' })
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineDto)
  lines: JournalEntryLineDto[];
}
