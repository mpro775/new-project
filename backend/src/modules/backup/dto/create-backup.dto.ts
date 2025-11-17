import { IsOptional, IsBoolean, IsString } from 'class-validator';

export class CreateBackupDto {
  @IsOptional()
  @IsBoolean()
  includeData?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeSchema?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeFiles?: boolean = false;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
