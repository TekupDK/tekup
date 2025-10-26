import { IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateContactDto } from '../../contacts/dto/create-contact.dto';
import { CreateCompanyDto } from '../../companies/dto/create-company.dto';
import { CreateDealDto } from '../../deals/dto/create-deal.dto';

export class ConvertLeadDto {
  @IsString()
  leadId: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateContactDto)
  contactData?: CreateContactDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCompanyDto)
  companyData?: CreateCompanyDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateDealDto)
  dealData?: CreateDealDto;
}