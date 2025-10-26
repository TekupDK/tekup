import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JobNotesService } from './job-notes.service';
import { CreateJobNoteDto } from './dto/create-job-note.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { NoteType } from '@prisma/client';

@ApiTags('Job Notes')
@Controller('jobs/:jobId/notes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobNotesController {
  constructor(private readonly jobNotesService: JobNotesService) {}

  @Post()
  @ApiOperation({ summary: 'Add note to job' })
  @ApiResponse({ status: 201, description: 'Note added successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async create(
    @Request() req,
    @Param('jobId') jobId: string,
    @Body() createNoteDto: CreateJobNoteDto,
  ) {
    return this.jobNotesService.create(req.user.tenantId, jobId, createNoteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notes for job' })
  @ApiResponse({ status: 200, description: 'Notes retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobNotes(@Request() req, @Param('jobId') jobId: string) {
    return this.jobNotesService.getJobNotes(req.user.tenantId, jobId);
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Get notes by type' })
  @ApiResponse({ status: 200, description: 'Notes retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getNotesByType(
    @Request() req,
    @Param('jobId') jobId: string,
    @Param('type') type: NoteType,
  ) {
    return this.jobNotesService.getNotesByType(req.user.tenantId, jobId, type);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get note statistics for job' })
  @ApiResponse({ status: 200, description: 'Note statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getNoteStatistics(@Request() req, @Param('jobId') jobId: string) {
    return this.jobNotesService.getNoteStatistics(req.user.tenantId, jobId);
  }

  @Patch(':noteId')
  @ApiOperation({ summary: 'Update note' })
  @ApiResponse({ status: 200, description: 'Note updated successfully' })
  @ApiResponse({ status: 404, description: 'Job or note not found' })
  async update(
    @Request() req,
    @Param('jobId') jobId: string,
    @Param('noteId') noteId: string,
    @Body() body: { text?: string; type?: NoteType },
  ) {
    return this.jobNotesService.update(req.user.tenantId, jobId, noteId, body);
  }

  @Delete(':noteId')
  @ApiOperation({ summary: 'Delete note' })
  @ApiResponse({ status: 200, description: 'Note deleted successfully' })
  @ApiResponse({ status: 404, description: 'Job or note not found' })
  async remove(
    @Request() req,
    @Param('jobId') jobId: string,
    @Param('noteId') noteId: string,
  ) {
    return this.jobNotesService.remove(req.user.tenantId, jobId, noteId);
  }
}
