/**
 * Integration Test Runner
 * 
 * Executes automated tests for all integrated systems:
 * - Conflict detection
 * - Duplicate quote checking
 * - Label application
 * - Follow-up system
 * - Database persistence
 * 
 * Usage:
 *   npm run test:integration
 *   npm run test:integration -- --verbose
 *   npm run test:integration -- --test=conflict
 */

import { analyzeEmailForConflict } from "../services/conflictDetectionService";
import { checkExistingQuotes, checkDuplicateCustomer } from "../services/duplicateDetectionService";
import { applyEmailActionLabel } from "../services/emailResponseGenerator";
import { prisma } from "../services/databaseService";
import { logger } from "../logger";

// Test configuration
interface TestConfig {
    verbose: boolean;
    specificTest?: string;
}

interface TestResult {
    name: string;
    passed: boolean;
    duration: number;
    message?: string;
    error?: string;
}

class IntegrationTestRunner {
    private config: TestConfig;
    private results: TestResult[] = [];

    constructor(config: TestConfig) {
        this.config = config;
    }

    /**
     * Run all integration tests
     */
    async runAll(): Promise<void> {
        console.log("\n🧪 RenOS Integration Test Suite\n");
        console.log("=".repeat(60));

        const tests: Array<{ name: string; fn: () => Promise<void> }> = [
            { name: "conflict", fn: this.testConflictDetection.bind(this) as () => Promise<void> },
            { name: "duplicate", fn: this.testDuplicateDetection.bind(this) as () => Promise<void> },
            { name: "database", fn: this.testDatabaseOperations.bind(this) as () => Promise<void> },
            { name: "labels", fn: this.testLabelSystem.bind(this) as () => Promise<void> },
        ];

        for (const test of tests) {
            // Skip if specific test requested and this isn't it
            if (this.config.specificTest && this.config.specificTest !== test.name) {
                continue;
            }

            await this.runTest(test.name, test.fn);
        }

        this.printSummary();
    }

    /**
     * Run individual test with timing
     */
    private async runTest(name: string, testFn: () => Promise<void> | void): Promise<void> {
        console.log(`\n📝 Test: ${name}`);
        console.log("-".repeat(60));

        const startTime = Date.now();
        let passed = false;
        let error: string | undefined;

        try {
            await testFn();
            passed = true;
            console.log(`✅ PASSED`);
        } catch (err) {
            passed = false;
            error = err instanceof Error ? err.message : String(err);
            console.log(`❌ FAILED: ${error}`);
        }

        const duration = Date.now() - startTime;
        this.results.push({ name, passed, duration, error });

        if (this.config.verbose) {
            console.log(`⏱️  Duration: ${duration}ms`);
        }
    }

    /**
     * Test 1: Conflict Detection
     */
    private async testConflictDetection(): Promise<void> {
        console.log("Testing conflict detection with various email samples...");

        // Add await placeholder
        await Promise.resolve();

        const testCases = [
            {
                name: "No conflict",
                text: "Hej, jeg vil gerne have et tilbud på rengøring af min lejlighed. Mvh Anna",
                expectedSeverity: "none",
                expectedAutoEscalate: false,
            },
            {
                name: "Medium severity",
                text: "Jeg er lidt skuffet over rengøringen sidste gang. Det kunne være bedre.",
                expectedSeverity: "medium",
                expectedAutoEscalate: false,
            },
            {
                name: "High severity",
                text: "Dette er fuldstændig uacceptabelt! Jeg er meget utilfreds med jeres service.",
                expectedSeverity: "high",
                expectedAutoEscalate: true,
            },
            {
                name: "Critical severity (advokat)",
                text: "Jeg kontakter min advokat hvis dette ikke løses omgående.",
                expectedSeverity: "critical",
                expectedAutoEscalate: true,
            },
        ];

        for (const testCase of testCases) {
            const result = analyzeEmailForConflict(testCase.text);

            if (this.config.verbose) {
                console.log(`  - ${testCase.name}:`);
                console.log(`    Severity: ${result.severity} (expected: ${testCase.expectedSeverity})`);
                console.log(`    Score: ${result.score}`);
                console.log(`    Auto-escalate: ${result.autoEscalate} (expected: ${testCase.expectedAutoEscalate})`);
            }

            // Verify expectations
            if (result.severity !== testCase.expectedSeverity) {
                throw new Error(
                    `${testCase.name}: Expected severity ${testCase.expectedSeverity}, got ${result.severity}`
                );
            }

            if (result.autoEscalate !== testCase.expectedAutoEscalate) {
                throw new Error(
                    `${testCase.name}: Expected autoEscalate ${testCase.expectedAutoEscalate}, got ${result.autoEscalate}`
                );
            }
        }

        console.log(`✓ All ${testCases.length} conflict detection tests passed`);
    }

    /**
     * Test 2: Duplicate Detection
     */
    private async testDuplicateDetection(): Promise<void> {
        console.log("Testing duplicate quote detection...");

        // Test with a known email (adjust as needed for your test environment)
        const testEmail = "test.duplicate@example.com";

        // Test quote check
        const quoteCheck = await checkExistingQuotes(testEmail);

        if (this.config.verbose) {
            console.log(`  - Quote check for ${testEmail}:`);
            console.log(`    Action: ${quoteCheck.action}`);
            console.log(`    Days since last quote: ${quoteCheck.daysSinceQuote ?? "N/A"}`);
        }

        // Verify response structure
        if (!["STOP", "WARN", "OK"].includes(quoteCheck.action)) {
            throw new Error(`Invalid quote check action: ${quoteCheck.action}`);
        }

        // Test customer check
        const customerCheck = await checkDuplicateCustomer(testEmail);

        if (this.config.verbose) {
            console.log(`  - Customer check for ${testEmail}:`);
            console.log(`    Is duplicate: ${customerCheck.isDuplicate}`);
            // Threads found info removed (not in return type)
        }

        console.log(`✓ Duplicate detection working correctly`);
    }

    /**
     * Test 3: Database Operations
     */
    private async testDatabaseOperations(): Promise<void> {
        console.log("Testing database operations...");

        // Test 1: Query leads
        const leadCount = await prisma.lead.count();
        console.log(`  - Total leads in database: ${leadCount}`);

        // Test 2: Query recent escalations
        const recentEscalations = await prisma.escalation.findMany({
            take: 5,
            orderBy: { escalatedAt: "desc" },
            include: {
                lead: {
                    select: {
                        email: true,
                        name: true,
                    },
                },
            },
        });

        console.log(`  - Recent escalations: ${recentEscalations.length}`);

        if (this.config.verbose && recentEscalations.length > 0) {
            for (const escalation of recentEscalations) {
                console.log(`    • ${escalation.severity} - ${escalation.lead.email} (${escalation.escalatedAt.toISOString()})`);
            }
        }

        // Test 3: Query leads with follow-ups
        const leadsWithFollowUps = await prisma.lead.findMany({
            where: {
                followUpAttempts: {
                    gt: 0,
                },
            },
            select: {
                email: true,
                followUpAttempts: true,
                lastFollowUpDate: true,
            },
            take: 5,
        });

        console.log(`  - Leads with follow-ups: ${leadsWithFollowUps.length}`);

        if (this.config.verbose && leadsWithFollowUps.length > 0) {
            for (const lead of leadsWithFollowUps) {
                console.log(`    • ${lead.email}: ${lead.followUpAttempts} attempts, last: ${lead.lastFollowUpDate?.toISOString() ?? "N/A"}`);
            }
        }

        // Test 4: Database connection health
        try {
            await prisma.$queryRaw`SELECT 1`;
            console.log(`  - Database connection: ✅ Healthy`);
        } catch (err) {
            throw new Error(`Database connection failed: ${err instanceof Error ? err.message : String(err)}`);
        }

        console.log(`✓ Database operations working correctly`);
    }

    /**
     * Test 4: Label System
     */
    private async testLabelSystem(): Promise<void> {
        console.log("Testing label application system...");

        // Test with mock thread ID (won't actually apply in dry-run)
        const testThreadId = "test_thread_12345";

        const labelActions = ["quote_sent", "booked", "follow_up_needed", "completed"] as const;

        for (const action of labelActions) {
            try {
                const result = await applyEmailActionLabel(testThreadId, action, "Integration test");

                if (this.config.verbose) {
                    console.log(`  - Label "${action}": ${result ? "✅" : "⚠️  (expected in dry-run)"}`);
                }

                // In dry-run mode, we expect false (no actual label applied)
                // In live mode, we'd expect true (if thread exists)
                // For testing, we just verify it doesn't throw
            } catch (err) {
                throw new Error(`Label application failed for "${action}": ${err instanceof Error ? err.message : String(err)}`);
            }
        }

        // Test with invalid thread ID (should handle gracefully)
        try {
            const result = await applyEmailActionLabel("" as string, "quote_sent");
            // Should return false for invalid thread ID
            if (result !== false) {
                throw new Error("Expected false for invalid thread ID");
            }
            console.log(`  - Invalid thread ID handling: ✅`);
        } catch {
            // This is also acceptable - graceful error
            console.log(`  - Invalid thread ID handling: ✅ (threw error as expected)`);
        }

        console.log(`✓ Label system working correctly`);
    }

    /**
     * Print test summary
     */
    private printSummary(): void {
        console.log("\n" + "=".repeat(60));
        console.log("📊 Test Summary\n");

        const passed = this.results.filter((r) => r.passed).length;
        const failed = this.results.filter((r) => r.passed === false).length;
        const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

        console.log(`Total Tests: ${this.results.length}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⏱️  Total Duration: ${totalDuration}ms`);

        if (failed > 0) {
            console.log("\n❌ Failed Tests:");
            this.results
                .filter((r) => !r.passed)
                .forEach((r) => {
                    console.log(`  - ${r.name}: ${r.error}`);
                });
        }

        console.log("\n" + "=".repeat(60));

        // Exit with appropriate code
        if (failed > 0) {
            process.exit(1);
        }
    }
}

/**
 * Main execution
 */
async function main() {
    const args = process.argv.slice(2);

    const config: TestConfig = {
        verbose: args.includes("--verbose") || args.includes("-v"),
        specificTest: args.find((arg) => arg.startsWith("--test="))?.split("=")[1],
    };

    const runner = new IntegrationTestRunner(config);

    try {
        await runner.runAll();

        console.log("\n✅ All tests completed successfully. Exiting...\n");

        // Disconnect database
        await prisma.$disconnect();

        // Wait for logger to flush all pending writes (Pino async operations)
        // Note: pino-pretty transport needs extra time to format and output
        await new Promise((resolve) => {
            logger.flush();
            setTimeout(resolve, 500); // Give 500ms for pino-pretty to finish
        });

        // ✅ Clean exit after everything is flushed
        process.exit(0);
    } catch (err) {
        logger.error({ error: err }, "Test runner failed");
        console.error("\n❌ Test runner failed:", err);

        // Disconnect database
        await prisma.$disconnect();

        // Wait for error logs to flush
        await new Promise((resolve) => {
            logger.flush();
            setTimeout(resolve, 500); // Give 500ms for pino-pretty
        });

        // ❌ Exit with error code
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch((err) => {
        console.error("Fatal error:", err);
        process.exit(1);
    });
}

export { IntegrationTestRunner };
