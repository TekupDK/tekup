import { Module } from '@nestjs/common';
import { JobNotesService } from './job-notes.service';
import { JobNotesController } from './job-notes.controller';

@Module({
  providers: [JobNotesService],
  controllers: [JobNotesController],
  exports: [JobNotesService],
})
export class JobNotesModule {}
