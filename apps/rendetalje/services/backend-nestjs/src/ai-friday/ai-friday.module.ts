import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { AiFridayService } from './ai-friday.service';
import { AiFridayController } from './ai-friday.controller';
import { ChatSessionsService } from './chat-sessions.service';
import { LeadsModule } from '../leads/leads.module';
import { CustomersModule } from '../customers/customers.module';
import { TeamModule } from '../team/team.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 60000, // 1 minute for AI responses
      maxRedirects: 5,
    }),
    ConfigModule,
    DatabaseModule,
    LeadsModule,
    CustomersModule,
    TeamModule,
  ],
  controllers: [AiFridayController],
  providers: [AiFridayService, ChatSessionsService],
  exports: [AiFridayService, ChatSessionsService],
})
export class AiFridayModule {}
