import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { QualityService } from './quality.service';
import { QualityChecklistsService } from './quality-checklists.service';
import { PhotoDocumentationService } from './photo-documentation.service';
import { CreateQualityChecklistDto, CreateQualityAssessmentDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('quality')
@Controller('quality')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class QualityController {
  constructor(
    private readonly qualityService: QualityService,
    private readonly qualityChecklistsService: QualityChecklistsService,
    private readonly photoDocumentationService: PhotoDocumentationService,
  ) {}

  // Quality Checklists
  @Post('checklists')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create quality checklist' })
  @ApiResponse({ status: 201, description: 'Checklist created successfully' })
  async createChecklist(@Body() createChecklistDto: CreateQualityChecklistDto) {
    return this.qualityChecklistsService.create(createChecklistDto);
  }

  @Get('checklists')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get all quality checklists' })
  async getChecklists(@Query('serviceType') serviceType?: string, @Query('isActive') isActive?: boolean) {
    return this.qualityChecklistsService.findAll({ serviceType, isActive });
  }

  @Get('checklists/service-type/:serviceType')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get checklist by service type' })
  async getChecklistByServiceType(@Param('serviceType') serviceType: string) {
    return this.qualityChecklistsService.getByServiceType(serviceType);
  }

  @Get('checklists/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get checklist by ID' })
  async getChecklist(@Param('id') id: string) {
    return this.qualityChecklistsService.findById(id);
  }

  @Patch('checklists/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update checklist (creates new version)' })
  async updateChecklist(
    @Param('id') id: string,
    @Body() updates: Partial<CreateQualityChecklistDto>,
  ) {
    return this.qualityChecklistsService.createNewVersion(id, updates);
  }

  @Post('checklists/:id/duplicate')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Duplicate checklist for different service type' })
  async duplicateChecklist(
    @Param('id') id: string,
    @Body() data: { serviceType: string; name: string },
  ) {
    return this.qualityChecklistsService.duplicateChecklist(id, data.serviceType, data.name);
  }

  @Get('checklists/service-type/:serviceType/versions')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all versions of checklist for service type' })
  async getChecklistVersions(@Param('serviceType') serviceType: string) {
    return this.qualityChecklistsService.getChecklistVersions(serviceType);
  }

  @Post('checklists/initialize-defaults')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Initialize default checklists for all service types' })
  async initializeDefaultChecklists() {
    return this.qualityChecklistsService.initializeDefaultChecklists();
  }

  // Quality Assessments
  @Post('assessments')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Create quality assessment for job' })
  @ApiResponse({ status: 201, description: 'Assessment created successfully' })
  async createAssessment(
    @Body() createAssessmentDto: CreateQualityAssessmentDto,
    @Request() req,
  ) {
    return this.qualityService.createAssessment(createAssessmentDto, req.user.id);
  }

  @Get('assessments/job/:jobId')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get quality assessment for job' })
  async getJobAssessment(@Param('jobId') jobId: string) {
    return this.qualityService.getJobAssessment(jobId);
  }

  @Patch('assessments/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Update quality assessment' })
  async updateAssessment(
    @Param('id') id: string,
    @Body() updates: Partial<CreateQualityAssessmentDto>,
  ) {
    return this.qualityService.updateAssessment(id, updates);
  }

  // Photo Documentation
  @Post('photos/upload')
  @UseInterceptors(FilesInterceptor('photos', 10))
  @ApiConsumes('multipart/form-data')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Upload quality documentation photos' })
  async uploadPhotos(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() metadata: {
      jobId: string;
      checklistItemId?: string;
      type: 'before' | 'after' | 'during' | 'issue' | 'quality';
      description?: string;
    },
    @Request() req,
  ) {
    const photoMetadata = {
      ...metadata,
      timestamp: new Date().toISOString(),
      uploadedBy: req.user.id,
    };

    const fileData = files.map(file => ({
      buffer: file.buffer,
      filename: file.originalname,
    }));

    return this.photoDocumentationService.uploadMultiplePhotos(fileData, photoMetadata);
  }

  @Get('photos/job/:jobId')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get photos for job' })
  async getJobPhotos(@Param('jobId') jobId: string, @Query('type') type?: string) {
    return this.photoDocumentationService.getJobPhotos(jobId, type);
  }

  @Delete('photos')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete photo' })
  async deletePhoto(@Body('photoUrl') photoUrl: string) {
    return this.photoDocumentationService.deletePhoto(photoUrl);
  }

  @Post('photos/compare')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Compare before and after photos' })
  async comparePhotos(@Body() data: { beforePhotoUrl: string; afterPhotoUrl: string }) {
    return this.photoDocumentationService.comparePhotos(data.beforePhotoUrl, data.afterPhotoUrl);
  }

  @Get('photos/report/job/:jobId')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Generate photo report for job' })
  async generatePhotoReport(@Param('jobId') jobId: string) {
    return this.photoDocumentationService.generatePhotoReport(jobId);
  }

  @Get('photos/organize')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get photos organized by date' })
  async organizePhotosByDate(@Query('from') dateFrom: string, @Query('to') dateTo: string) {
    return this.photoDocumentationService.organizePhotosByDate(dateFrom, dateTo);
  }

  // Quality Metrics and Reports
  @Get('metrics')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get organization quality metrics' })
  async getQualityMetrics() {
    return this.qualityService.getOrganizationQualityMetrics();
  }

  @Get('issues')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get quality issues' })
  async getQualityIssues(@Query('severity') severity: 'low' | 'medium' | 'high' = 'medium') {
    return this.qualityService.getQualityIssues(severity);
  }

  @Get('reports')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Generate comprehensive quality report' })
  async generateQualityReport(@Query('from') dateFrom: string, @Query('to') dateTo: string) {
    return this.qualityService.generateQualityReport(dateFrom, dateTo);
  }

  @Get('checklists/analytics')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get checklist usage analytics' })
  async getChecklistAnalytics() {
    return this.qualityChecklistsService.getChecklistAnalytics();
  }
}
