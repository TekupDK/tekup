import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { createLogger, getLogger } from './logger';
import { initTracing } from './tracing';

export interface ObservabilityModuleOptions {
  serviceName?: string;
  enableTracing?: boolean;
  otlpEndpoint?: string;
  enableConsoleExporter?: boolean;
}

const LOGGER = 'OBS_LOGGER';

@Global()
@Module({})
export class ObservabilityModule {
  static forRoot(opts: ObservabilityModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [
      {
        provide: LOGGER,
        useFactory: () => {
          const logger = createLogger({ serviceName: opts.serviceName });
          if (opts.enableTracing) {
            initTracing({ 
              serviceName: opts.serviceName,
              otlpEndpoint: opts.otlpEndpoint,
              enableConsoleExporter: opts.enableConsoleExporter
            });
          }
          return logger;
        }
      }
    ];
    return {
      module: ObservabilityModule,
      providers,
      exports: providers
    };
  }
}

export function injectLogger() {
  return (target: any, key: string | symbol, index?: number) => {
    // basic parameter decorator placeholder (could integrate with Nest's Inject in real code)
  };
}

export { getLogger };
