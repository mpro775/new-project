import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class RestoreBackupDto {
  @IsString()
  backupId: string;

  @IsOptional()
  @IsString()
  targetDatabase?: string;

  @IsOptional()
  @IsBoolean()
  dropExisting?: boolean = false;

  @IsOptional()
  @IsBoolean()
  verifyOnly?: boolean = false;
}
