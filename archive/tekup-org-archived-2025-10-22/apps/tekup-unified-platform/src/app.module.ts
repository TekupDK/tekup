import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from './modules/core/core.module';
import { FlowModule } from './modules/flow/flow.module';
import { CrmModule } from './modules/crm/crm.module';
import { LeadsModule } from './modules/leads/leads.module';
import { VoiceModule } from './modules/voice/voice.module';
import { SecurityModule } from './modules/security/security.module';
import { ProposalEngineModule } from './modules/proposal-engine/proposal-engine.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    CoreModule,
    FlowModule,
    CrmModule,
    LeadsModule,
    VoiceModule,
    SecurityModule,
    ProposalEngineModule,
  ],
})
export class AppModule {}
