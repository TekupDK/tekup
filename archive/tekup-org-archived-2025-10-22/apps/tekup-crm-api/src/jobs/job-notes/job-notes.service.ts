import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateJobNoteDto } from './dto/create-job-note.dto';
import { NoteType } from '@prisma/client';

@Injectable()
export class JobNotesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Add note to job
   */
  async create(tenantId: string, jobId: string, createNoteDto: CreateJobNoteDto) {
    const { text, type, createdBy } = createNoteDto;

    // Verify job exists and belongs to tenant
    const job = await this.prisma.cleaningJob.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return this.prisma.jobNote.create({
      data: {
        jobId,
        text,
        type: type || 'GENERAL',
        createdBy,
      },
    });
  }

  /**
   * Get all notes for job
   */
  async getJobNotes(tenantId: string, jobId: string) {
    // Verify job exists and belongs to tenant
    const job = await this.prisma.cleaningJob.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return this.prisma.jobNote.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get notes by type
   */
  async getNotesByType(tenantId: string, jobId: string, type: NoteType) {
    // Verify job exists and belongs to tenant
    const job = await this.prisma.cleaningJob.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return this.prisma.jobNote.findMany({
      where: { jobId, type },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update note
   */
  async update(tenantId: string, jobId: string, noteId: string, updateData: { text?: string; type?: NoteType }) {
    // Verify job exists and belongs to tenant
    const job = await this.prisma.cleaningJob.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Verify note exists and belongs to job
    const note = await this.prisma.jobNote.findFirst({
      where: { id: noteId, jobId },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    return this.prisma.jobNote.update({
      where: { id: noteId },
      data: updateData,
    });
  }

  /**
   * Delete note
   */
  async remove(tenantId: string, jobId: string, noteId: string) {
    // Verify job exists and belongs to tenant
    const job = await this.prisma.cleaningJob.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Verify note exists and belongs to job
    const note = await this.prisma.jobNote.findFirst({
      where: { id: noteId, jobId },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    return this.prisma.jobNote.delete({
      where: { id: noteId },
    });
  }

  /**
   * Get note statistics for job
   */
  async getNoteStatistics(tenantId: string, jobId: string) {
    // Verify job exists and belongs to tenant
    const job = await this.prisma.cleaningJob.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const [
      totalNotes,
      generalNotes,
      issueNotes,
      customerNotes,
      internalNotes,
    ] = await Promise.all([
      this.prisma.jobNote.count({ where: { jobId } }),
      this.prisma.jobNote.count({ where: { jobId, type: 'GENERAL' } }),
      this.prisma.jobNote.count({ where: { jobId, type: 'ISSUE' } }),
      this.prisma.jobNote.count({ where: { jobId, type: 'CUSTOMER' } }),
      this.prisma.jobNote.count({ where: { jobId, type: 'INTERNAL' } }),
    ]);

    return {
      totalNotes,
      byType: {
        general: generalNotes,
        issue: issueNotes,
        customer: customerNotes,
        internal: internalNotes,
      },
    };
  }
}
