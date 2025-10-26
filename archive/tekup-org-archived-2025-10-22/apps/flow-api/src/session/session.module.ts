import { Module, Global } from '@nestjs/common';
import { SessionAffinityService } from './session-affinity.service.js';
import { SessionInterceptor } from './session.interceptor.js';
import { CacheModule } from '../cache/cache.module.js';

@Global()
@Module({
  imports: [CacheModule],
  providers: [SessionAffinityService, SessionInterceptor],
  exports: [SessionAffinityService, SessionInterceptor],
})
export class SessionModule {}