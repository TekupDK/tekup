# 📦 Bulk Operations Design - v1.3.0

**Feature:** Mass Data Management for Billy.dk Resources  
**Priority:** Phase 1 (Uge 3-4)  
**Effort:** Medium-High | **Value:** Very High  

---

## 🎯 **VISION**

Bygge et kraftfuldt bulk operations system som:
- **Importerer** hundredvis af kunder/produkter via CSV/JSON
- **Eksporterer** data til regneark og rapporter
- **Opdaterer** mange ressourcer samtidigt
- **Tracker** fremskridt med real-time progress bars
- **Håndterer** fejl elegant med retry og rollback

---

## 🏗️ **SYSTEM ARCHITECTURE**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   File Upload   │    │  Batch Processor │    │   Billy.dk API  │
│                 │───▶│                  │───▶│                 │
│ • CSV Parser    │    │ • Queue System   │    │ • Rate Limited  │
│ • JSON Import   │    │ • Progress Track │    │ • Retry Logic   │
│ • Validation    │    │ • Error Handling │    │ • Batch Create  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Supabase DB    │
                       │                  │
                       │ • Job Status     │
                       │ • Progress Log   │
                       │ • Error Reports  │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  Real-time UI    │
                       │                  │
                       │ • Progress Bar   │
                       │ • Success/Fail   │
                       │ • Download Report│
                       └──────────────────┘
```

---

## 🔧 **TECHNICAL IMPLEMENTATION**

### **Bulk Job Manager (Core System):**

```typescript
// bulk-job-manager.ts
import { Queue, Worker, Job } from 'bullmq';
import { BillyClient } from './billy-client';
import { supabaseAdmin } from './supabase';
import Papa from 'papaparse'; // CSV parsing
import { z } from 'zod';

interface BulkJobConfig {
  jobId: string;
  organizationId: string;
  resourceType: 'customer' | 'product' | 'invoice' | 'contact';
  operation: 'import' | 'export' | 'update' | 'delete';
  items: any[];
  options: {
    batchSize?: number; // Process N items at a time (default: 10)
    continueOnError?: boolean; // Don't stop on first error
    validateBeforeCreate?: boolean; // Pre-validate all items
    dryRun?: boolean; // Test mode without actual API calls
  };
}

class BulkJobManager {
  private queue: Queue;
  private worker: Worker;
  private billyClient: BillyClient;

  constructor() {
    this.billyClient = new BillyClient();
    this.setupQueue();
    this.setupWorker();
  }

  private setupQueue() {
    this.queue = new Queue('billy-bulk-ops', {
      connection: { host: 'redis-server', port: 6379 }
    });
  }

  private setupWorker() {
    this.worker = new Worker('billy-bulk-ops', async (job: Job<BulkJobConfig>) => {
      const config = job.data;
      
      try {
        await this.processBulkJob(config, job);
      } catch (error) {
        await this.logJobError(config.jobId, error);
        throw error;
      }
    }, {
      connection: { host: 'redis-server', port: 6379 },
      concurrency: 3, // Process 3 bulk jobs simultaneously
      limiter: {
        max: 10, // Max 10 jobs per minute
        duration: 60000
      }
    });

    this.worker.on('completed', (job) => {
      console.log(`✅ Bulk job completed: ${job.data.jobId}`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`❌ Bulk job failed: ${job?.data?.jobId}`, err);
    });
  }

  async createBulkJob(config: BulkJobConfig): Promise<string> {
    // 1. Validate configuration
    this.validateJobConfig(config);

    // 2. Create job record in database
    const { data: jobRecord } = await supabaseAdmin
      .from('billy_bulk_jobs')
      .insert({
        job_id: config.jobId,
        organization_id: config.organizationId,
        resource_type: config.resourceType,
        operation: config.operation,
        total_items: config.items.length,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    // 3. Add job to processing queue
    await this.queue.add('process-bulk', config, {
      jobId: config.jobId,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 }
    });

    return config.jobId;
  }

  private async processBulkJob(config: BulkJobConfig, job: Job) {
    const { jobId, items, resourceType, operation, options } = config;
    const batchSize = options.batchSize || 10;
    
    let processed = 0;
    let successful = 0;
    let failed = 0;
    const errors: any[] = [];

    // Update job status to 'processing'
    await this.updateJobStatus(jobId, 'processing', 0);

    // Process items in batches
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      try {
        const results = await this.processBatch(
          batch, 
          resourceType, 
          operation, 
          config.organizationId,
          options.dryRun
        );

        // Count successes and failures
        results.forEach((result, idx) => {
          processed++;
          
          if (result.success) {
            successful++;
          } else {
            failed++;
            errors.push({
              item: batch[idx],
              error: result.error,
              index: i + idx
            });
          }
        });

        // Update progress
        const progress = (processed / items.length) * 100;
        await this.updateJobProgress(jobId, progress, successful, failed);
        
        // Update job progress bar
        await job.updateProgress(progress);

        // Stop if too many errors and continueOnError is false
        if (!options.continueOnError && failed > 0) {
          throw new Error(`Batch processing failed with ${failed} errors`);
        }

      } catch (error) {
        if (!options.continueOnError) {
          throw error;
        }
      }

      // Rate limiting: Wait 1 second between batches
      await this.sleep(1000);
    }

    // Mark job as completed
    await this.updateJobStatus(jobId, 'completed', 100, successful, failed, errors);
  }

  private async processBatch(
    items: any[], 
    resourceType: string, 
    operation: string,
    organizationId: string,
    dryRun?: boolean
  ): Promise<Array<{ success: boolean; error?: string; data?: any }>> {
    
    const results = await Promise.allSettled(
      items.map(async (item) => {
        if (dryRun) {
          // Validation only, no actual API call
          return { success: true, data: { validated: true } };
        }

        switch (operation) {
          case 'import':
            return await this.createResource(resourceType, item, organizationId);
          case 'update':
            return await this.updateResource(resourceType, item, organizationId);
          case 'delete':
            return await this.deleteResource(resourceType, item.id, organizationId);
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
      })
    );

    return results.map((result) => {
      if (result.status === 'fulfilled') {
        return { success: true, data: result.value };
      } else {
        return { success: false, error: result.reason.message };
      }
    });
  }

  private async createResource(type: string, data: any, orgId: string) {
    switch (type) {
      case 'customer':
        return await this.billyClient.createCustomer(data, orgId);
      case 'product':
        return await this.billyClient.createProduct(data, orgId);
      case 'invoice':
        return await this.billyClient.createInvoice(data, orgId);
      default:
        throw new Error(`Unknown resource type: ${type}`);
    }
  }

  private async updateJobStatus(
    jobId: string, 
    status: string, 
    progress: number,
    successful?: number,
    failed?: number,
    errors?: any[]
  ) {
    await supabaseAdmin
      .from('billy_bulk_jobs')
      .update({
        status,
        progress,
        successful_items: successful,
        failed_items: failed,
        errors: errors,
        updated_at: new Date().toISOString()
      })
      .eq('job_id', jobId);
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 📋 **CSV/JSON IMPORT SYSTEM**

### **File Parser & Validator:**

```typescript
// bulk-import-parser.ts
import Papa from 'papaparse';
import { z } from 'zod';

// Customer CSV schema
const CustomerCSVSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zipcode: z.string().optional(),
  country: z.string().default('DK'),
  vatNo: z.string().optional()
});

// Product CSV schema
const ProductCSVSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  accountNo: z.string().optional(),
  unitPrice: z.number().positive('Price must be positive'),
  salesTaxRuleset: z.enum(['vat25', 'vat0', 'abroad']).default('vat25'),
  isArchived: z.boolean().default(false)
});

class BulkImportParser {
  async parseCustomerCSV(fileContent: string): Promise<any[]> {
    const parsed = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      transform: (value) => value.trim()
    });

    if (parsed.errors.length > 0) {
      throw new Error(`CSV parsing errors: ${JSON.stringify(parsed.errors)}`);
    }

    // Validate each row
    const validated = parsed.data.map((row, index) => {
      const result = CustomerCSVSchema.safeParse(row);
      
      if (!result.success) {
        throw new Error(
          `Row ${index + 2}: ${result.error.errors.map(e => e.message).join(', ')}`
        );
      }

      return result.data;
    });

    return validated;
  }

  async parseProductCSV(fileContent: string): Promise<any[]> {
    const parsed = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      transform: (value, field) => {
        // Convert numeric fields
        if (field === 'unitPrice') {
          return parseFloat(value);
        }
        // Convert boolean fields
        if (field === 'isArchived') {
          return value.toLowerCase() === 'true';
        }
        return value.trim();
      }
    });

    if (parsed.errors.length > 0) {
      throw new Error(`CSV parsing errors: ${JSON.stringify(parsed.errors)}`);
    }

    // Validate each row
    const validated = parsed.data.map((row, index) => {
      const result = ProductCSVSchema.safeParse(row);
      
      if (!result.success) {
        throw new Error(
          `Row ${index + 2}: ${result.error.errors.map(e => e.message).join(', ')}`
        );
      }

      return result.data;
    });

    return validated;
  }

  generateCSVTemplate(resourceType: 'customer' | 'product'): string {
    switch (resourceType) {
      case 'customer':
        return [
          'name,email,phone,address,city,zipcode,country,vatNo',
          'Acme Corp,info@acme.com,+45 12345678,Main St 1,Copenhagen,1000,DK,DK12345678',
          'Beta Inc,contact@beta.dk,+45 87654321,Oak Ave 42,Aarhus,8000,DK,DK87654321'
        ].join('\n');
        
      case 'product':
        return [
          'name,description,accountNo,unitPrice,salesTaxRuleset,isArchived',
          'Consulting Hour,Professional consulting services,3000,1250.00,vat25,false',
          'Support Package,Monthly support subscription,3100,5000.00,vat25,false'
        ].join('\n');
        
      default:
        throw new Error(`Unknown resource type: ${resourceType}`);
    }
  }
}
```

---

## 📊 **MCP TOOLS IMPLEMENTATION**

### **New Bulk Operation Tools:**

```typescript
// src/tools/bulk-operations.ts
import { z } from 'zod';
import { BulkJobManager } from '../bulk-job-manager';
import { BulkImportParser } from '../bulk-import-parser';
import { dataLogger } from '../utils/data-logger';

const bulkJobManager = new BulkJobManager();
const parser = new BulkImportParser();

// Tool 1: Import Customers from CSV
export async function importCustomersFromCSV(input: {
  csvContent: string;
  organizationId: string;
  options?: {
    continueOnError?: boolean;
    dryRun?: boolean;
  };
}) {
  const startTime = Date.now();

  try {
    // Parse and validate CSV
    const customers = await parser.parseCustomerCSV(input.csvContent);

    // Create bulk import job
    const jobId = `import-customers-${Date.now()}`;
    await bulkJobManager.createBulkJob({
      jobId,
      organizationId: input.organizationId,
      resourceType: 'customer',
      operation: 'import',
      items: customers,
      options: {
        batchSize: 10,
        continueOnError: input.options?.continueOnError ?? true,
        dryRun: input.options?.dryRun ?? false
      }
    });

    await dataLogger.log('import_customers_csv', {
      count: customers.length,
      jobId,
      executionTime: Date.now() - startTime
    });

    return {
      success: true,
      jobId,
      totalItems: customers.length,
      message: `Bulk import job created. Track progress with job ID: ${jobId}`
    };

  } catch (error) {
    await dataLogger.log('import_customers_csv', {
      errorMessage: error.message,
      executionTime: Date.now() - startTime
    });
    throw error;
  }
}

// Tool 2: Export Customers to CSV
export async function exportCustomersToCSV(input: {
  organizationId: string;
  filters?: {
    isArchived?: boolean;
    country?: string;
  };
}) {
  const startTime = Date.now();

  try {
    // Fetch all customers (uses cache if available)
    const customers = await billyClient.listCustomers(input.organizationId, {
      ...input.filters
    });

    // Convert to CSV format
    const csvContent = Papa.unparse(customers, {
      header: true,
      columns: ['id', 'name', 'email', 'phone', 'address', 'city', 'zipcode', 'country', 'vatNo']
    });

    await dataLogger.log('export_customers_csv', {
      count: customers.length,
      executionTime: Date.now() - startTime
    });

    return {
      success: true,
      csvContent,
      totalCustomers: customers.length,
      filename: `customers-export-${Date.now()}.csv`
    };

  } catch (error) {
    await dataLogger.log('export_customers_csv', {
      errorMessage: error.message,
      executionTime: Date.now() - startTime
    });
    throw error;
  }
}

// Tool 3: Bulk Update Products
export async function bulkUpdateProducts(input: {
  updates: Array<{ id: string; changes: any }>;
  organizationId: string;
  options?: {
    continueOnError?: boolean;
  };
}) {
  const startTime = Date.now();

  try {
    const jobId = `update-products-${Date.now()}`;
    
    await bulkJobManager.createBulkJob({
      jobId,
      organizationId: input.organizationId,
      resourceType: 'product',
      operation: 'update',
      items: input.updates,
      options: {
        batchSize: 10,
        continueOnError: input.options?.continueOnError ?? true
      }
    });

    await dataLogger.log('bulk_update_products', {
      count: input.updates.length,
      jobId,
      executionTime: Date.now() - startTime
    });

    return {
      success: true,
      jobId,
      totalItems: input.updates.length,
      message: `Bulk update job created. Track progress with job ID: ${jobId}`
    };

  } catch (error) {
    await dataLogger.log('bulk_update_products', {
      errorMessage: error.message,
      executionTime: Date.now() - startTime
    });
    throw error;
  }
}

// Tool 4: Get Bulk Job Status
export async function getBulkJobStatus(input: {
  jobId: string;
  organizationId: string;
}) {
  const startTime = Date.now();

  try {
    const { data: job } = await supabaseAdmin
      .from('billy_bulk_jobs')
      .select('*')
      .eq('job_id', input.jobId)
      .eq('organization_id', input.organizationId)
      .single();

    if (!job) {
      throw new Error(`Job not found: ${input.jobId}`);
    }

    await dataLogger.log('get_bulk_job_status', {
      jobId: input.jobId,
      executionTime: Date.now() - startTime
    });

    return {
      success: true,
      job: {
        id: job.job_id,
        status: job.status,
        progress: job.progress,
        totalItems: job.total_items,
        successfulItems: job.successful_items,
        failedItems: job.failed_items,
        errors: job.errors,
        createdAt: job.created_at,
        completedAt: job.completed_at
      }
    };

  } catch (error) {
    await dataLogger.log('get_bulk_job_status', {
      errorMessage: error.message,
      executionTime: Date.now() - startTime
    });
    throw error;
  }
}

// Tool 5: Download CSV Template
export async function downloadCSVTemplate(input: {
  resourceType: 'customer' | 'product';
}) {
  const startTime = Date.now();

  try {
    const template = parser.generateCSVTemplate(input.resourceType);

    await dataLogger.log('download_csv_template', {
      resourceType: input.resourceType,
      executionTime: Date.now() - startTime
    });

    return {
      success: true,
      csvContent: template,
      filename: `${input.resourceType}-import-template.csv`
    };

  } catch (error) {
    await dataLogger.log('download_csv_template', {
      errorMessage: error.message,
      executionTime: Date.now() - startTime
    });
    throw error;
  }
}
```

---

## 🗄️ **DATABASE SCHEMA ADDITIONS**

### **New Supabase Tables:**

```sql
-- Bulk job tracking table
CREATE TABLE billy_bulk_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id VARCHAR(100) UNIQUE NOT NULL,
  organization_id UUID NOT NULL REFERENCES billy_organizations(id) ON DELETE CASCADE,
  resource_type VARCHAR(20) NOT NULL, -- 'customer', 'product', 'invoice'
  operation VARCHAR(20) NOT NULL, -- 'import', 'export', 'update', 'delete'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  progress DECIMAL(5,2) DEFAULT 0, -- 0-100%
  total_items INTEGER NOT NULL,
  successful_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]', -- Array of error objects
  options JSONB DEFAULT '{}', -- Job configuration
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bulk_jobs_org ON billy_bulk_jobs(organization_id);
CREATE INDEX idx_bulk_jobs_status ON billy_bulk_jobs(status);
CREATE INDEX idx_bulk_jobs_created ON billy_bulk_jobs(created_at DESC);

-- Bulk job item tracking (detailed progress per item)
CREATE TABLE billy_bulk_job_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id VARCHAR(100) NOT NULL REFERENCES billy_bulk_jobs(job_id) ON DELETE CASCADE,
  item_index INTEGER NOT NULL,
  item_data JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  result JSONB, -- Success result or error details
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(job_id, item_index)
);

CREATE INDEX idx_bulk_job_items_job ON billy_bulk_job_items(job_id);
CREATE INDEX idx_bulk_job_items_status ON billy_bulk_job_items(status);
```

---

## 📈 **PROGRESS TRACKING UI**

### **Real-time Progress Component:**

```typescript
// BulkJobProgress.tsx
import { useEffect, useState } from 'react';
import { supabase } from './supabase-client';

interface BulkJob {
  jobId: string;
  status: string;
  progress: number;
  totalItems: number;
  successfulItems: number;
  failedItems: number;
}

export function BulkJobProgress({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<BulkJob | null>(null);

  useEffect(() => {
    // Subscribe to real-time updates
    const subscription = supabase
      .from(`billy_bulk_jobs:job_id=eq.${jobId}`)
      .on('UPDATE', (payload) => {
        setJob(payload.new as BulkJob);
      })
      .subscribe();

    // Initial fetch
    fetchJobStatus();

    return () => {
      subscription.unsubscribe();
    };
  }, [jobId]);

  const fetchJobStatus = async () => {
    const { data } = await supabase
      .from('billy_bulk_jobs')
      .select('*')
      .eq('job_id', jobId)
      .single();
    
    if (data) setJob(data);
  };

  if (!job) return <div>Loading...</div>;

  return (
    <div className="bulk-job-progress">
      <h3>Bulk Import Progress</h3>
      
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${job.progress}%` }}
        />
      </div>
      
      <div className="stats">
        <span>Total: {job.totalItems}</span>
        <span>✅ Success: {job.successfulItems}</span>
        <span>❌ Failed: {job.failedItems}</span>
      </div>
      
      <div className={`status ${job.status}`}>
        Status: {job.status.toUpperCase()}
      </div>
    </div>
  );
}
```

---

## 🎯 **SUCCESS METRICS**

### **Performance Targets:**

- **Import Speed:** 100 customers/minute (with rate limiting)
- **Export Speed:** 1000 customers/minute (from cache)
- **Error Rate:** <5% for well-formatted CSV files
- **UI Responsiveness:** Real-time progress updates (<1s latency)

### **Business Value:**

- **Time Savings:** 90% reduction in manual data entry time
- **Data Quality:** Automated validation reduces errors by 80%
- **Scalability:** Handle imports up to 10,000 items per job
- **User Experience:** Visual progress tracking and error reporting

---

**Version:** 1.0  
**Created:** 2025-10-14  
**Author:** Jonas Abde (w/ GitHub Copilot)  
**Status:** 📦 Design Complete - Ready for Implementation
