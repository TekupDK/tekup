import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '@tekup/auth';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  findAll() {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.companiesService.findAll('tenant-id');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.companiesService.findOne(id, 'tenant-id');
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.companiesService.update(id, 'tenant-id', updateCompanyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.companiesService.remove(id, 'tenant-id');
  }
}