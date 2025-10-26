import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateDealDto {
  @IsString()
  tenantId: string;

  @IsString()
  companyId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  value: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsString()
  stageId: string;

  @IsOptional()
  @IsDateString()
  closeDate?: string;
}