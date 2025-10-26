#!/usr/bin/env node

import { 
    importCustomers, 
    importFromCSV, 
    exportCustomersToCSV, 
    getCustomerImportStatistics 
} from "../services/enhancedCustomerImportService";
import { logger } from "../logger";
import * as fs from "fs";
import * as path from "path";

/**
 * Customer Import CLI Tool
 * 
 * Commands:
 * - import: Import customers from JSON file
 * - import-csv: Import customers from CSV file
 * - export: Export customers to CSV
 * - statistics: Show import statistics
 * - validate: Validate customer data
 */

async function importFromFile(filePath: string, options: any = {}): Promise<void> {
    console.log(`\n📥 Importing customers from: ${filePath}\n`);
    console.log("━".repeat(80));

    try {
        if (!fs.existsSync(filePath)) {
            console.error(`❌ File not found: ${filePath}`);
            return;
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const fileExt = path.extname(filePath).toLowerCase();

        let result;
        if (fileExt === '.csv') {
            result = await importFromCSV(fileContent, options);
        } else if (fileExt === '.json') {
            const customers = JSON.parse(fileContent);
            result = await importCustomers(customers, options);
        } else {
            console.error("❌ Unsupported file format. Use .json or .csv files.");
            return;
        }

        if (result.success) {
            console.log("✅ Customer import completed successfully!");
            console.log("");
            console.log("📊 Results:");
            console.log(`   Customers processed: ${result.customersProcessed}`);
            console.log(`   Customers created: ${result.customersCreated}`);
            console.log(`   Customers updated: ${result.customersUpdated}`);
            console.log(`   Bookings created: ${result.bookingsCreated}`);
            console.log(`   Errors: ${result.errors.length}`);
            console.log(`   Warnings: ${result.warnings.length}`);
            console.log(`   Processing time: ${result.processingTime}ms`);
            
            if (result.errors.length > 0) {
                console.log("");
                console.log("❌ Errors encountered:");
                result.errors.forEach((error, index) => {
                    console.log(`   ${index + 1}. ${error}`);
                });
            }

            if (result.warnings.length > 0) {
                console.log("");
                console.log("⚠️  Warnings:");
                result.warnings.forEach((warning, index) => {
                    console.log(`   ${index + 1}. ${warning}`);
                });
            }
        } else {
            console.log("❌ Customer import failed!");
            console.log("");
            console.log("Errors:");
            result.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }

    } catch (error) {
        console.error("❌ Import failed:", error);
        logger.error({ error, filePath }, "Customer import tool failed");
    }

    console.log("\n" + "━".repeat(80));
}

async function exportToFile(outputPath: string, customerIds?: string[]): Promise<void> {
    console.log(`\n📤 Exporting customers to: ${outputPath}\n`);
    console.log("━".repeat(80));

    try {
        const csvData = await exportCustomersToCSV(customerIds);
        
        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, csvData, 'utf-8');

        console.log("✅ Customer export completed successfully!");
        console.log(`   File saved: ${outputPath}`);
        console.log(`   File size: ${(csvData.length / 1024).toFixed(2)} KB`);

    } catch (error) {
        console.error("❌ Export failed:", error);
        logger.error({ error, outputPath }, "Customer export tool failed");
    }

    console.log("\n" + "━".repeat(80));
}

async function showStatistics(): Promise<void> {
    console.log("\n📊 Customer Import Statistics\n");
    console.log("━".repeat(80));

    try {
        const stats = await getCustomerImportStatistics();

        console.log("👥 Customer Statistics:");
        console.log(`   Total customers: ${stats.totalCustomers}`);
        console.log(`   With email: ${stats.customersWithEmail}`);
        console.log(`   With phone: ${stats.customersWithPhone}`);
        console.log(`   With address: ${stats.customersWithAddress}`);
        console.log("");
        console.log("📅 Booking Statistics:");
        console.log(`   Total bookings: ${stats.totalBookings}`);
        console.log(`   Total revenue: ${stats.totalRevenue.toLocaleString("da-DK")} kr`);
        console.log("");
        console.log("📈 Data Quality:");
        const emailPercentage = ((stats.customersWithEmail / stats.totalCustomers) * 100).toFixed(1);
        const phonePercentage = ((stats.customersWithPhone / stats.totalCustomers) * 100).toFixed(1);
        const addressPercentage = ((stats.customersWithAddress / stats.totalCustomers) * 100).toFixed(1);
        
        console.log(`   Email coverage: ${emailPercentage}%`);
        console.log(`   Phone coverage: ${phonePercentage}%`);
        console.log(`   Address coverage: ${addressPercentage}%`);

    } catch (error) {
        console.error("❌ Failed to get statistics:", error);
        logger.error({ error }, "Failed to get customer import statistics");
    }

    console.log("\n" + "━".repeat(80));
}

async function validateFile(filePath: string): Promise<void> {
    console.log(`\n🔍 Validating customer data in: ${filePath}\n`);
    console.log("━".repeat(80));

    try {
        if (!fs.existsSync(filePath)) {
            console.error(`❌ File not found: ${filePath}`);
            return;
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const fileExt = path.extname(filePath).toLowerCase();

        let customers;
        if (fileExt === '.csv') {
            const lines = fileContent.trim().split('\n');
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            customers = [];

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                const customer = {
                    name: values[0] || '',
                    email: values[1] || undefined,
                    phone: values[2] || undefined,
                    address: values[3] || undefined,
                    companyName: values[4] || undefined,
                    notes: values[5] || undefined,
                    tags: values[6] ? values[6].split(';').map(t => t.trim()) : undefined,
                    totalLeads: values[7] ? parseInt(values[7]) : undefined,
                    totalBookings: values[8] ? parseInt(values[8]) : undefined,
                    totalRevenue: values[9] ? parseFloat(values[9]) : undefined,
                    lastContactAt: values[10] ? new Date(values[10]) : undefined
                };
                customers.push(customer);
            }
        } else if (fileExt === '.json') {
            customers = JSON.parse(fileContent);
        } else {
            console.error("❌ Unsupported file format. Use .json or .csv files.");
            return;
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
                index: index + 1,
                name: customer.name,
                valid: errors.length === 0,
                errors,
                warnings
            };
        });

        const validCount = validationResults.filter(r => r.valid).length;
        const invalidCount = validationResults.length - validCount;

        console.log("📊 Validation Results:");
        console.log(`   Total customers: ${customers.length}`);
        console.log(`   Valid customers: ${validCount}`);
        console.log(`   Invalid customers: ${invalidCount}`);
        console.log("");

        if (invalidCount > 0) {
            console.log("❌ Invalid customers:");
            validationResults
                .filter(r => !r.valid)
                .forEach(result => {
                    console.log(`   ${result.index}. ${result.name}`);
                    result.errors.forEach(error => {
                        console.log(`      - ${error}`);
                    });
                });
            console.log("");
        }

        if (validationResults.some(r => r.warnings.length > 0)) {
            console.log("⚠️  Warnings:");
            validationResults
                .filter(r => r.warnings.length > 0)
                .forEach(result => {
                    console.log(`   ${result.index}. ${result.name}`);
                    result.warnings.forEach(warning => {
                        console.log(`      - ${warning}`);
                    });
                });
        }

        if (validCount === customers.length) {
            console.log("✅ All customers are valid!");
        }

    } catch (error) {
        console.error("❌ Validation failed:", error);
        logger.error({ error, filePath }, "Customer validation tool failed");
    }

    console.log("\n" + "━".repeat(80));
}

// Main CLI handler
async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const command = args[0];

    try {
        switch (command) {
            case "import":
                const importFile = args[1];
                const importOptions = {
                    validateData: !args.includes('--no-validate'),
                    createBookings: args.includes('--create-bookings'),
                    sendConfirmations: args.includes('--send-confirmations'),
                    dryRun: args.includes('--dry-run'),
                    batchSize: parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '50')
                };
                if (!importFile) {
                    console.error("❌ File path required for import command");
                    return;
                }
                await importFromFile(importFile, importOptions);
                break;

            case "import-csv":
                const csvFile = args[1];
                const csvOptions = {
                    validateData: !args.includes('--no-validate'),
                    createBookings: args.includes('--create-bookings'),
                    sendConfirmations: args.includes('--send-confirmations'),
                    dryRun: args.includes('--dry-run'),
                    batchSize: parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '50')
                };
                if (!csvFile) {
                    console.error("❌ File path required for import-csv command");
                    return;
                }
                await importFromFile(csvFile, csvOptions);
                break;

            case "export":
                const outputFile = args[1] || 'customers.csv';
                const customerIds = args.find(arg => arg.startsWith('--customer-ids='))?.split('=')[1]?.split(',');
                await exportToFile(outputFile, customerIds);
                break;

            case "statistics":
                await showStatistics();
                break;

            case "validate":
                const validateFilePath = args[1];
                if (!validateFilePath) {
                    console.error("❌ File path required for validate command");
                    return;
                }
                await validateFile(validateFilePath);
                break;

            default:
                console.log("\n👥 Customer Import Tool\n");
                console.log("Usage: npm run customer:import <command> [options]\n");
                console.log("Commands:");
                console.log("  import <file>           - Import customers from JSON file");
                console.log("  import-csv <file>       - Import customers from CSV file");
                console.log("  export [file]           - Export customers to CSV (default: customers.csv)");
                console.log("  statistics              - Show import statistics");
                console.log("  validate <file>         - Validate customer data without importing");
                console.log("");
                console.log("Options:");
                console.log("  --no-validate           - Skip data validation");
                console.log("  --create-bookings       - Create bookings for customers");
                console.log("  --send-confirmations    - Send confirmation emails");
                console.log("  --dry-run               - Show what would be imported without actually importing");
                console.log("  --batch-size=N          - Process N customers at a time (default: 50)");
                console.log("  --customer-ids=id1,id2  - Export specific customers only");
                console.log("");
                console.log("Examples:");
                console.log("  npm run customer:import import customers.json");
                console.log("  npm run customer:import import-csv customers.csv --create-bookings");
                console.log("  npm run customer:import export customers_export.csv");
                console.log("  npm run customer:import statistics");
                console.log("  npm run customer:import validate customers.json");
                console.log("");
                break;
        }
    } catch (error) {
        console.error("\n❌ Unexpected error:", error);
        logger.error({ error }, "Customer import tool failed");
        process.exit(1);
    }
}

// Run CLI
main().catch((err) => {
    console.error("❌ Fatal error:", err);
    logger.error({ err }, "Customer import tool fatal error");
    process.exit(1);
});
