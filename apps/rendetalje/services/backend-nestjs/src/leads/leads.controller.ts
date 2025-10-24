import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadDto, LeadFiltersDto } from './dto';
import { Lead, LeadPriority } from './entities/lead.entity';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';

@ApiTags('Leads')
@Controller('api/v1/leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new lead' })
  @ApiResponse({ status: 201, description: 'Lead created successfully', type: Lead })
  async create(@Body() createLeadDto: CreateLeadDto): Promise<Lead> {
    return this.leadsService.create(createLeadDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all leads with filters' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'priority', required: false, description: 'Filter by priority' })
  @ApiQuery({ name: 'source', required: false, description: 'Filter by source' })
  @ApiQuery({ name: 'minEstimatedValue', required: false, description: 'Minimum estimated value' })
  @ApiQuery({ name: 'minScore', required: false, description: 'Minimum lead score' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in name, email, phone' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'List of leads', type: [Lead] })
  async findAll(@Query() filters: LeadFiltersDto): Promise<PaginatedResponseDto<Lead>> {
    return this.leadsService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a lead by ID' })
  @ApiResponse({ status: 200, description: 'Lead found', type: Lead })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async findOne(@Param('id') id: string): Promise<Lead> {
    return this.leadsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a lead' })
  @ApiResponse({ status: 200, description: 'Lead updated successfully', type: Lead })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async update(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto): Promise<Lead> {
    return this.leadsService.update(id, updateLeadDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a lead' })
  @ApiResponse({ status: 204, description: 'Lead deleted successfully' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.leadsService.remove(id);
  }

  @Post(':id/enrich')
  @ApiOperation({ summary: 'Enrich lead with external data (Firecrawl)' })
  @ApiResponse({ status: 200, description: 'Lead enriched successfully', type: Lead })
  async enrichLead(
    @Param('id') id: string,
    @Body() enrichmentData: {
      companyName?: string;
      industry?: string;
      estimatedSize?: string;
      estimatedValue?: number;
      enrichmentData?: Record<string, any>;
    },
  ): Promise<Lead> {
    return this.leadsService.enrichLead(id, enrichmentData);
  }

  @Post(':id/score')
  @ApiOperation({ summary: 'Score a lead and set priority' })
  @ApiResponse({ status: 200, description: 'Lead scored successfully', type: Lead })
  async scoreLead(
    @Param('id') id: string,
    @Body() scoreData: {
      score: number;
      priority: LeadPriority;
      metadata?: Record<string, any>;
    },
  ): Promise<Lead> {
    return this.leadsService.scoreLead(id, scoreData.score, scoreData.priority, scoreData.metadata);
  }

  @Post(':id/follow-up')
  @ApiOperation({ summary: 'Increment follow-up attempts' })
  @ApiResponse({ status: 200, description: 'Follow-up attempt recorded', type: Lead })
  async incrementFollowUp(@Param('id') id: string): Promise<Lead> {
    return this.leadsService.incrementFollowUpAttempts(id);
  }
}
