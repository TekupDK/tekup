import { Module } from '@nestjs/common';
import { JobTeamMembersService } from './job-team-members.service';
import { JobTeamMembersController } from './job-team-members.controller';

@Module({
  providers: [JobTeamMembersService],
  controllers: [JobTeamMembersController],
  exports: [JobTeamMembersService],
})
export class JobTeamMembersModule {}
