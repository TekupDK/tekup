import { IsString, IsOptional, IsNumber, IsUrl } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  tenantId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  employeeCount?: number;

  @IsOptional()
  @IsString()
  cvr?: string;
}
