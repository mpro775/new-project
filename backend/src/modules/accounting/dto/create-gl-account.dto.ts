import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsIn,
} from 'class-validator';

export class CreateGLAccountDto {
  @IsNotEmpty({ message: 'كود الحساب مطلوب' })
  @IsString({ message: 'كود الحساب يجب أن يكون نص' })
  accountCode: string;

  @IsNotEmpty({ message: 'اسم الحساب مطلوب' })
  @IsString({ message: 'اسم الحساب يجب أن يكون نص' })
  name: string;

  @IsOptional()
  @IsString({ message: 'وصف الحساب يجب أن يكون نص' })
  description?: string;

  @IsNotEmpty({ message: 'نوع الحساب مطلوب' })
  @IsIn(['asset', 'liability', 'equity', 'revenue', 'expense'], {
    message:
      'نوع الحساب يجب أن يكون أحد: asset, liability, equity, revenue, expense',
  })
  accountType: string;

  @IsOptional()
  @IsString({ message: 'معرف الحساب الأب يجب أن يكون نص' })
  parentId?: string;

  @IsOptional()
  @IsBoolean({ message: 'حالة النشاط يجب أن تكون منطقية' })
  isActive?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'حالة النظام يجب أن تكون منطقية' })
  isSystem?: boolean;
}
