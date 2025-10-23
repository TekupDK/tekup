import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AiFridayService } from './ai-friday.service';
import { AiFridayController } from './ai-friday.controller';
import { ChatSessionsService } from './chat-sessions.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { JobsModule } from '../jobs/jobs.module';
import { CustomersModule } from '../customers/customers.module';
import { TeamModule } from '../team/team.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 60000, // 1 minute for AI responses
      maxRedirects: 5,
    }),
    ConfigModule,
    SupabaseModule,
    JobsModule,
    CustomersModule,
    TeamModule,
  ],
  controllers: [AiFridayController],
  providers: [AiFridayService, ChatSessionsService],
  exports: [AiFridayService, ChatSessionsService],
})
export class AiFridayModule {}