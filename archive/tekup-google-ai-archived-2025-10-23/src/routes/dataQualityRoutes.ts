/**
 * DATA QUALITY API ROUTES
 * Endpoints til data-rengøring og kvalitetssikring
 */

import { Router, Request, Response } from 'express';
import {
  removeDuplicateLeads,
  standardizePhoneNumbers,
  validateEmails,
  generateDataQualityReport,
  runCompleteDataCleaning,
} from '../services/dataCleaningService';
import { logger } from '../logger';

const router = Router();

/**
 * GET /api/data-quality/report
 * Generate comprehensive data quality report
 */
router.get('/report', (req: Request, res: Response) => {
  void (async () => {
    try {
      logger.info('Generating data quality report');

      const report = await generateDataQualityReport();

      res.json({
        success: true,
        report,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      logger.error({ error }, 'Failed to generate data quality report');
      res.status(500).json({
        success: false,
        error: 'Failed to generate report',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })();
});

/**
 * POST /api/data-quality/clean/duplicates
 * Remove duplicate leads
 */
router.post('/clean/duplicates', (req: Request, res: Response) => {
  void (async () => {
    try {
      logger.info('Starting duplicate removal');

      const result = await removeDuplicateLeads();

      res.json({
        success: true,
        result,
        message: `Removed ${result.duplicates} duplicate leads`,
      });

    } catch (error) {
      logger.error({ error }, 'Failed to remove duplicates');
      res.status(500).json({
        success: false,
        error: 'Failed to remove duplicates',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })();
});

/**
 * POST /api/data-quality/clean/phones
 * Standardize phone numbers
 */
router.post('/clean/phones', (req: Request, res: Response) => {
  void (async () => {
    try {
      logger.info('Starting phone standardization');

      const count = await standardizePhoneNumbers();

      res.json({
        success: true,
        standardized: count,
        message: `Standardized ${count} phone numbers`,
      });

    } catch (error) {
      logger.error({ error }, 'Failed to standardize phones');
      res.status(500).json({
        success: false,
        error: 'Failed to standardize phones',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })();
});

/**
 * POST /api/data-quality/clean/emails
 * Validate and fix email addresses
 */
router.post('/clean/emails', (req: Request, res: Response) => {
  void (async () => {
    try {
      logger.info('Starting email validation');

      const result = await validateEmails();

      res.json({
        success: true,
        result,
        message: `Fixed ${result.fixed} emails, found ${result.invalid} invalid`,
      });

    } catch (error) {
      logger.error({ error }, 'Failed to validate emails');
      res.status(500).json({
        success: false,
        error: 'Failed to validate emails',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })();
});

/**
 * POST /api/data-quality/clean/all
 * Run complete data cleaning workflow
 */
router.post('/clean/all', (req: Request, res: Response) => {
  void (async () => {
    try {
      logger.info('Starting complete data cleaning');

      const result = await runCompleteDataCleaning();

      res.json({
        success: true,
        result,
        message: 'Complete data cleaning finished',
        summary: {
          duplicatesRemoved: result.duplicatesRemoved,
          phonesStandardized: result.phonesStandardized,
          emailsFixed: result.emailsFixed,
          recommendations: result.report.recommendations,
        },
      });

    } catch (error) {
      logger.error({ error }, 'Failed to run complete data cleaning');
      res.status(500).json({
        success: false,
        error: 'Failed to run data cleaning',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })();
});

export default router;

