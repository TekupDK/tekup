import { Module } from '@nestjs/common';
import { JobPhotosService } from './job-photos.service';
import { JobPhotosController } from './job-photos.controller';

@Module({
  providers: [JobPhotosService],
  controllers: [JobPhotosController],
  exports: [JobPhotosService],
})
export class JobPhotosModule {}
