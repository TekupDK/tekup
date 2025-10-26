import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GracefulShutdownConfig {
  signals: NodeJS.Signals[];
  timeout: number; // in milliseconds
  beforeShutdown?: () => Promise<void>;
  afterShutdown?: () => Promise<void>;
}

@Injectable()
export class GracefulShutdownService implements OnApplicationShutdown {
  private readonly logger = new Logger(GracefulShutdownService.name);
  private readonly config: GracefulShutdownConfig;
  private shutdownInProgress = false;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      signals: this.parseSignals(
        this.configService.get('GRACEFUL_SHUTDOWN_SIGNALS', 'SIGTERM,SIGINT')
      ),
      timeout: this.configService.get('GRACEFUL_SHUTDOWN_TIMEOUT', 30000), // 30 seconds
      beforeShutdown: undefined,
      afterShutdown: undefined,
    };

    // Register signal handlers
    this.registerSignalHandlers();
  }

  private parseSignals(signalsString: string): NodeJS.Signals[] {
    return signalsString
      .split(',')
      .map(sig => sig.trim() as NodeJS.Signals)
      .filter(sig => ['SIGTERM', 'SIGINT', 'SIGQUIT', 'SIGHUP'].includes(sig));
  }

  private registerSignalHandlers(): void {
    this.config.signals.forEach(signal => {
      process.on(signal, async () => {
        this.logger.log(`Received ${signal} signal`);
        await this.shutdown(signal);
      });
    });
  }

  async shutdown(signal: NodeJS.Signals): Promise<void> {
    if (this.shutdownInProgress) {
      this.logger.log('Shutdown already in progress');
      return;
    }

    this.shutdownInProgress = true;
    const startTime = Date.now();

    try {
      this.logger.log(`Starting graceful shutdown due to ${signal}`);

      // Execute before shutdown hook if provided
      if (this.config.beforeShutdown) {
        try {
          await this.config.beforeShutdown();
        } catch (error) {
          this.logger.error('Before shutdown hook failed:', error);
        }
      }

      // Wait for timeout or completion
      await Promise.race([
        this.waitForShutdownCompletion(),
        new Promise(resolve => setTimeout(resolve, this.config.timeout))
      ]);

      const duration = Date.now() - startTime;
      this.logger.log(`Graceful shutdown completed in ${duration}ms`);

      // Execute after shutdown hook if provided
      if (this.config.afterShutdown) {
        try {
          await this.config.afterShutdown();
        } catch (error) {
          this.logger.error('After shutdown hook failed:', error);
        }
      }

      // Exit process
      process.exit(0);
    } catch (error) {
      this.logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  private async waitForShutdownCompletion(): Promise<void> {
    // In a real implementation, this would wait for:
    // - Active HTTP requests to complete
    // - Database connections to close
    // - Background jobs to finish
    // - Cache connections to close
    // - WebSocket connections to close
    
    // For now, we'll just wait a short time to simulate
    return new Promise(resolve => setTimeout(resolve, 1000));
  }

  isShutdownInProgress(): boolean {
    return this.shutdownInProgress;
  }

  getConfig(): GracefulShutdownConfig {
    return { ...this.config };
  }
}