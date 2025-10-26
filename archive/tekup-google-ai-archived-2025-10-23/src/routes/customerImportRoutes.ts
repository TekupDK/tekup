import { Router, Request, Response } from "express";
import { 
    importCustomers, 
    importFromCSV, 
    exportCustomersToCSV, 
    getCustomerImportStatistics 
} from "../services/enhancedCustomerImportService";
import { logger } from "../logger";

const router = Router();

/**
 * POST /api/customer-import/import
 * Import customers from JSON data
 */
router.post("/import", (req: Request, res: Response) => {
    void (async () => {
        try {
            const { customers, options = {} } = req.body;

            if (!customers || !Array.isArray(customers)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid request body",
                    message: "customers array is required"
                });
            }

            logger.info(
                { customerCount: customers.length, options },
                "Starting customer import via API"
            );

            const result = await importCustomers(customers, options);

            res.json({
                success: result.success,
                data: result,
                message: result.success 
                    ? "Customer import completed successfully"
                    : "Customer import failed"
            });

        } catch (error) {
            logger.error({ error }, "Customer import API failed");
            res.status(500).json({
                success: false,
                error: "Customer import failed",
                message: error instanceof Error ? error.message : String(error)
            });
        }
    })();
});

/**
 * POST /api/customer-import/import-csv
 * Import customers from CSV data
 */
router.post("/import-csv", (req: Request, res: Response) => {
    void (async () => {
        try {
            const { csvData, options = {} } = req.body;

            if (!csvData || typeof csvData !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: "Invalid request body",
                    message: "csvData string is required"
                });
            }

            logger.info(
                { csvDataLength: csvData.length, options },
                "Starting CSV customer import via API"
            );

            const result = await importFromCSV(csvData, options);

            res.json({
                success: result.success,
                data: result,
                message: result.success 
                    ? "CSV customer import completed successfully"
                    : "CSV customer import failed"
            });

        } catch (error) {
            logger.error({ error }, "CSV customer import API failed");
            res.status(500).json({
                success: false,
                error: "CSV customer import failed",
                message: error instanceof Error ? error.message : String(error)
            });
        }
    })();
});

/**
 * GET /api/customer-import/export
 * Export customers to CSV
 */
router.get("/export", (req: Request, res: Response) => {
    void (async () => {
        try {
            const { customerIds } = req.query;
            const ids = customerIds ? String(customerIds).split(',') : undefined;

            logger.info(
                { customerIds: ids },
                "Starting customer export via API"
            );

            const csvData = await exportCustomersToCSV(ids);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="customers.csv"');
            res.send(csvData);

        } catch (error) {
            logger.error({ error }, "Customer export API failed");
            res.status(500).json({
                success: false,
                error: "Customer export failed",
                message: error instanceof Error ? error.message : String(error)
            });
        }
    })();
});

/**
 * GET /api/customer-import/statistics
 * Get customer import statistics
 */
router.get("/statistics", (req: Request, res: Response) => {
    void (async () => {
        try {
            const statistics = await getCustomerImportStatistics();

            res.json({
                success: true,
                data: statistics
            });

        } catch (error) {
            logger.error({ error }, "Failed to get customer import statistics");
            res.status(500).json({
                success: false,
                error: "Failed to get statistics",
                message: error instanceof Error ? error.message : String(error)
            });
        }
    })();
});

/**
 * POST /api/customer-import/validate
 * Validate customer data without importing
 */
router.post("/validate", (req: Request, res: Response) => {
    void (async () => {
        try {
            const { customers } = req.body;

            if (!customers || !Array.isArray(customers)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid request body",
                    message: "customers array is required"
                });
            }

            const validationResults = customers.map((customer, index) => {
                const errors: string[] = [];
                const warnings: string[] = [];

                // Required fields
                if (!customer.name || customer.name.trim().length === 0) {
                    errors.push("Name is required");
                }

                // Email validation
                if (customer.email) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(customer.email)) {
                        errors.push("Invalid email format");
                    }
                } else {
                    warnings.push("No email provided");
                }

                // Phone validation
                if (customer.phone) {
                    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
                    if (!phoneRegex.test(customer.phone)) {
                        warnings.push("Phone number format may be invalid");
                    }
                }

                // Revenue validation
                if (customer.totalRevenue !== undefined && customer.totalRevenue < 0) {
                    errors.push("Total revenue cannot be negative");
                }

                return {
                    index,
                    name: customer.name,
                    valid: errors.length === 0,
                    errors,
                    warnings
                };
            });

            const validCount = validationResults.filter(r => r.valid).length;
            const invalidCount = validationResults.length - validCount;

            res.json({
                success: true,
                data: {
                    totalCustomers: customers.length,
                    validCustomers: validCount,
                    invalidCustomers: invalidCount,
                    results: validationResults
                }
            });

        } catch (error) {
            logger.error({ error }, "Customer validation API failed");
            res.status(500).json({
                success: false,
                error: "Customer validation failed",
                message: error instanceof Error ? error.message : String(error)
            });
        }
    })();
});

export default router;
