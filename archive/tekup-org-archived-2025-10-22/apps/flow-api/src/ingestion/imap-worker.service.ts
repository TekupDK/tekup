import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IngestionService } from './ingestion.service.js';
import { MetricsService } from '../metrics/metrics.service.js';
import * as Imap from 'imap';
import { simpleParser } from 'mailparser';
import { RawEmailInput } from './types.js';

interface ImapConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  tls: boolean;
  tlsOptions?: {
    rejectUnauthorized: boolean;
  };
}

interface MailboxConfig {
  name: string;
  config: ImapConfig;
  tenantMapping: string; // Maps to tenant slug
  pollIntervalMs: number;
}

@Injectable()
export class ImapWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ImapWorkerService.name);
  private readonly workers: Map<string, ImapWorker> = new Map();
  private isShuttingDown = false;

  constructor(
    private configService: ConfigService,
    private ingestionService: IngestionService,
    private metricsService: MetricsService
  ) {}

  async onModuleInit() {
    await this.initializeWorkers();
  }

  async onModuleDestroy() {
    this.isShuttingDown = true;
    await this.stopAllWorkers();
  }

  private async initializeWorkers() {
    const mailboxConfigs = this.getMailboxConfigurations();
    
    for (const config of mailboxConfigs) {
      try {
        const worker = new ImapWorker(
          config,
          this.ingestionService,
          this.metricsService,
          this.logger
        );
        
        this.workers.set(config.name, worker);
        await worker.start();
        
        this.logger.log(`IMAP worker started for mailbox: ${config.name}`);
      } catch (error) {
        this.logger.error(`Failed to start IMAP worker for ${config.name}:`, error);
        this.metricsService.increment('imap_worker_start_failed_total', { 
          mailbox: config.name 
        });
      }
    }
  }

  private async stopAllWorkers() {
    const promises = Array.from(this.workers.values()).map(worker => worker.stop());
    await Promise.allSettled(promises);
    this.workers.clear();
  }

  private getMailboxConfigurations(): MailboxConfig[] {
    // In production, these would come from environment variables or configuration service
    return [
      {
        name: 'rendetalje-leads',
        config: {
          host: this.configService.get('IMAP_RENDETALJE_HOST', 'imap.gmail.com'),
          port: parseInt(this.configService.get('IMAP_RENDETALJE_PORT', '993')),
          user: this.configService.get('IMAP_RENDETALJE_USER', 'info@rendetalje.dk'),
          password: this.configService.get('IMAP_RENDETALJE_PASSWORD', ''),
          tls: true,
          tlsOptions: { rejectUnauthorized: false }
        },
        tenantMapping: 'rendetalje',
        pollIntervalMs: parseInt(this.configService.get('IMAP_POLL_INTERVAL_MS', '30000'))
      },
      {
        name: 'foodtruck-leads',
        config: {
          host: this.configService.get('IMAP_FOODTRUCK_HOST', 'imap.gmail.com'),
          port: parseInt(this.configService.get('IMAP_FOODTRUCK_PORT', '993')),
          user: this.configService.get('IMAP_FOODTRUCK_USER', 'ftfiestaa@gmail.com'),
          password: this.configService.get('IMAP_FOODTRUCK_PASSWORD', ''),
          tls: true,
          tlsOptions: { rejectUnauthorized: false }
        },
        tenantMapping: 'foodtruck',
        pollIntervalMs: parseInt(this.configService.get('IMAP_POLL_INTERVAL_MS', '30000'))
      }
      // TekUp mailbox can be added later when configured
    ];
  }

  /**
   * Get status of all IMAP workers for health checks
   */
  getWorkersStatus(): Record<string, { isConnected: boolean; lastCheck: Date; errorCount: number }> {
    const status: Record<string, any> = {};
    
    for (const [name, worker] of this.workers) {
      status[name] = worker.getStatus();
    }
    
    return status;
  }

  /**
   * Manually trigger email polling for a specific mailbox (for testing)
   */
  async triggerPoll(mailboxName: string): Promise<void> {
    const worker = this.workers.get(mailboxName);
    if (!worker) {
      throw new Error(`No worker found for mailbox: ${mailboxName}`);
    }
    
    await worker.poll();
  }
}

class ImapWorker {
  private imap: Imap | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private isConnected = false;
  private lastCheck = new Date();
  private errorCount = 0;
  private readonly maxErrors = 5;

  constructor(
    private config: MailboxConfig,
    private ingestionService: IngestionService,
    private metricsService: MetricsService,
    private logger: Logger
  ) {}

  async start(): Promise<void> {
    await this.connect();
    this.startPolling();
  }

  async stop(): Promise<void> {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    
    if (this.imap && this.isConnected) {
      this.imap.end();
    }
    
    this.isConnected = false;
  }

  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap = new Imap(this.config.config);

      this.imap.once('ready', () => {
        this.isConnected = true;
        this.errorCount = 0;
        this.logger.log(`IMAP connected to ${this.config.name}`);
        resolve();
      });

      this.imap.once('error', (error) => {
        this.isConnected = false;
        this.errorCount++;
        this.logger.error(`IMAP connection error for ${this.config.name}:`, error);
        this.metricsService.increment('imap_connection_error_total', { 
          mailbox: this.config.name 
        });
        reject(error);
      });

      this.imap.once('end', () => {
        this.isConnected = false;
        this.logger.log(`IMAP connection ended for ${this.config.name}`);
      });

      this.imap.connect();
    });
  }

  private startPolling(): void {
    this.pollTimer = setInterval(async () => {
      try {
        await this.poll();
      } catch (error) {
        this.logger.error(`Polling error for ${this.config.name}:`, error);
        this.errorCount++;
        
        if (this.errorCount >= this.maxErrors) {
          this.logger.error(`Too many errors for ${this.config.name}, stopping worker`);
          await this.stop();
        }
      }
    }, this.config.pollIntervalMs);
  }

  async poll(): Promise<void> {
    if (!this.imap || !this.isConnected) {
      try {
        await this.connect();
      } catch (error) {
        throw new Error(`Failed to reconnect to ${this.config.name}: ${error.message}`);
      }
    }

    this.lastCheck = new Date();

    return new Promise((resolve, reject) => {
      this.imap!.openBox('INBOX', false, (error, box) => {
        if (error) {
          reject(error);
          return;
        }

        // Search for unread emails from the last hour to avoid processing old emails
        const since = new Date();
        since.setHours(since.getHours() - 1);
        
        this.imap!.search(['UNSEEN', ['SINCE', since]], (searchError, uids) => {
          if (searchError) {
            reject(searchError);
            return;
          }

          if (!uids || uids.length === 0) {
            resolve();
            return;
          }

          this.logger.log(`Found ${uids.length} new emails in ${this.config.name}`);
          this.processEmails(uids).then(resolve).catch(reject);
        });
      });
    });
  }

  private async processEmails(uids: number[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const fetch = this.imap!.fetch(uids, { bodies: '', markSeen: true });
      let processedCount = 0;

      fetch.on('message', (msg, seqno) => {
        let buffer = '';

        msg.on('body', (stream) => {
          stream.on('data', (chunk) => {
            buffer += chunk.toString('utf8');
          });
        });

        msg.once('end', async () => {
          try {
            const parsed = await simpleParser(buffer);
            
            const emailInput: RawEmailInput = {
              mailbox: this.config.config.user,
              subject: parsed.subject || '',
              from: parsed.from?.text || '',
              rawText: parsed.text || '',
              receivedAt: parsed.date || new Date()
            };

            const result = await this.ingestionService.ingestEmail(emailInput);
            
            this.metricsService.increment('imap_email_processed_total', {
              mailbox: this.config.name,
              accepted: result.accepted.toString(),
              classification: result.classification
            });

            if (result.accepted) {
              this.logger.log(`Successfully ingested email from ${emailInput.from} via ${this.config.name}`);
            } else {
              this.logger.debug(`Email not accepted: ${result.reason} from ${emailInput.from}`);
            }

            processedCount++;
            if (processedCount === uids.length) {
              resolve();
            }
          } catch (error) {
            this.logger.error(`Error processing email ${seqno} from ${this.config.name}:`, error);
            this.metricsService.increment('imap_email_processing_error_total', {
              mailbox: this.config.name
            });
            
            processedCount++;
            if (processedCount === uids.length) {
              resolve();
            }
          }
        });
      });

      fetch.once('error', (error) => {
        reject(error);
      });

      fetch.once('end', () => {
        if (processedCount === 0) {
          resolve();
        }
      });
    });
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      lastCheck: this.lastCheck,
      errorCount: this.errorCount
    };
  }
}