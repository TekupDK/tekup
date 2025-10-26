import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JobTeamMembersModule } from './job-team-members/job-team-members.module';
import { JobPhotosModule } from './job-photos/job-photos.module';
import { JobNotesModule } from './job-notes/job-notes.module';

@Module({
  providers: [JobsService],
  controllers: [JobsController],
  imports: [JobTeamMembersModule, JobPhotosModule, JobNotesModule],
  exports: [JobsService],
})
export class JobsModule {}
