// Express Request augmentation for tenant context
import 'express';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      apiKeyId?: string;
    }
  }
}

export {}; // ensure this file is treated as a module
