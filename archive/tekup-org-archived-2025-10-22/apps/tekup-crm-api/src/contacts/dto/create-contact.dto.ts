import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateContactDto {
  @IsString()
  tenantId: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsString()
  address?: string;
}