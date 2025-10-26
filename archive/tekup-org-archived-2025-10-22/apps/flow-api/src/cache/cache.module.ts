import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service.js';
import { CacheConfig } from './cache.config.js';

@Global()
@Module({
  providers: [
    {
      provide: CacheService,
      useFactory: () => {
        // Configuration can be injected here from environment or config service
        const config: Partial<CacheConfig> = {
          // Override defaults if needed
        };
        return new CacheService(config);
      },
    },
  ],
  exports: [CacheService],
})
export class CacheModule {}