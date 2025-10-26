import { getAutoResponseService } from "../services/emailAutoResponseService";
import { checkForNewLeads } from "../services/leadMonitor";
import { logger } from "../logger";

/**
 * Email Auto-Response CLI Tool
 * 
 * Commands:
 * - test: Generate a test response for the most recent lead
 * - pending: List all pending responses awaiting approval
 * - approve <leadId>: Approve a pending response
 * - reject <leadId>: Reject a pending response
 * - stats: Show auto-response statistics
 * - enable: Enable auto-response
 * - disable: Disable auto-response
 * - config: Show current configuration
 */

async function testResponse(): Promise<void> {
    console.log("\n🧪 Testing Email Auto-Response System...\n");

    try {
        // Get recent leads
        const newLeads = await checkForNewLeads();

        if (newLeads.length === 0) {
            console.log("❌ No new leads found to test with");
            return;
        }

        const lead = newLeads[0];
        console.log(`📧 Testing response for lead: ${lead.name || "Unknown"}`);
        console.log(`   Email: ${lead.email || "N/A"}`);
        console.log(`   Task: ${lead.taskType || "N/A"}`);
        console.log(`   Source: ${lead.source}\n`);

        // Create service with approval required for testing
        const service = getAutoResponseService({
            enabled: true,
            requireApproval: true,
            responseDelay: 0,
        });

        // Process lead
        const status = await service.processLead(lead);

        console.log(`✅ Response generated: ${status.status}`);
        console.log(`   Generated at: ${status.generatedAt.toLocaleString()}`);

        // Show the pending response
        const pending = service.getPendingResponses();
        if (pending.length > 0) {
            const { response } = pending[0];
            console.log("\n📨 Generated Email:");
            console.log("━".repeat(60));
            console.log(`To: ${response.to}`);
            console.log(`Subject: ${response.subject}`);
            console.log("━".repeat(60));
            console.log(response.body);
            console.log("━".repeat(60));
            console.log(
                "\n💡 Use 'npm run email:approve <leadId>' to send this email"
            );
        }
    } catch (err) {
        console.error("❌ Error testing response:", err);
        logger.error({ err }, "Failed to test auto-response");
    }
}

function listPendingResponses(): void {
    console.log("\n📋 Pending Email Responses\n");

    const service = getAutoResponseService();
    const pending = service.getPendingResponses();

    if (pending.length === 0) {
        console.log("✅ No pending responses");
        return;
    }

    pending.forEach((item, index) => {
        console.log(`${index + 1}. Lead: ${item.status.leadName}`);
        console.log(`   ID: ${item.leadId}`);
        console.log(`   To: ${item.response.to}`);
        console.log(`   Subject: ${item.response.subject}`);
        console.log(`   Generated: ${item.status.generatedAt.toLocaleString()}`);
        console.log("");
    });

    console.log(
        `💡 Use 'npm run email:approve <leadId>' to approve and send`
    );
    console.log(
        `💡 Use 'npm run email:reject <leadId>' to reject a response`
    );
}

async function approveResponse(leadId: string): Promise<void> {
    console.log(`\n✅ Approving response for lead: ${leadId}\n`);

    const service = getAutoResponseService();
    const success = await service.approvePendingResponse(leadId);

    if (success) {
        console.log("✅ Response approved and sent successfully!");
    } else {
        console.log("❌ Failed to approve response (lead not found or already processed)");
    }
}

async function rejectResponse(leadId: string): Promise<void> {
    console.log(`\n❌ Rejecting response for lead: ${leadId}\n`);

    const service = getAutoResponseService();
    const success = await service.rejectPendingResponse(leadId);

    if (success) {
        console.log("✅ Response rejected");
    } else {
        console.log("❌ Failed to reject response (lead not found)");
    }
}

function showStats(): void {
    console.log("\n📊 Email Auto-Response Statistics\n");

    const service = getAutoResponseService();
    const stats = service.getStatistics();

    console.log("Status Breakdown:");
    console.log(`  ✅ Sent: ${stats.sent}`);
    console.log(`  ⏳ Pending: ${stats.pending}`);
    console.log(`  ❌ Failed: ${stats.failed}`);
    console.log(`  👍 Approved: ${stats.approved}`);
    console.log(`  👎 Rejected: ${stats.rejected}`);
    console.log(`  📊 Total: ${stats.totalResponses}`);
    console.log("");
    console.log("Configuration:");
    console.log(`  🔧 Enabled: ${stats.enabled ? "Yes" : "No"}`);
    console.log(
        `  🔒 Requires Approval: ${stats.requireApproval ? "Yes" : "No"}`
    );
    console.log(`  📈 Today's Count: ${stats.todayCount}/${stats.dailyLimit}`);
}

function enableAutoResponse(): void {
    console.log("\n✅ Enabling Auto-Response System\n");

    const service = getAutoResponseService();
    service.updateConfig({ enabled: true });

    console.log("✅ Auto-response is now enabled");
    console.log(
        "💡 New leads will be automatically responded to based on configuration"
    );
}

function disableAutoResponse(): void {
    console.log("\n❌ Disabling Auto-Response System\n");

    const service = getAutoResponseService();
    service.updateConfig({ enabled: false });

    console.log("✅ Auto-response is now disabled");
    console.log("💡 New leads will not receive automatic responses");
}

function showConfig(): void {
    console.log("\n⚙️  Email Auto-Response Configuration\n");

    const service = getAutoResponseService();
    const stats = service.getStatistics();

    console.log(`Enabled: ${stats.enabled}`);
    console.log(`Requires Approval: ${stats.requireApproval}`);
    console.log(`Daily Limit: ${stats.dailyLimit} responses`);
    console.log(`Today's Count: ${stats.todayCount}`);
}

async function startAutoResponseMonitoring(): Promise<void> {
    console.log("\n🚀 Starting Email Auto-Response Monitoring\n");

    const service = getAutoResponseService({
        enabled: true,
        requireApproval: false,
        responseDelay: 30,
        maxResponsesPerDay: 50,
    });

    console.log("✅ Auto-response service initialized");
    console.log("📧 Monitoring for new leads...\n");

    // Simple monitoring loop
    const checkInterval = setInterval(() => {
        void (async () => {
            try {
                const newLeads = await checkForNewLeads();
                if (newLeads.length > 0) {
                    console.log(`\n📬 Found ${newLeads.length} new lead(s)`);

                    for (const lead of newLeads) {
                        console.log(`   Processing: ${lead.name || "Unknown"} (${lead.email})`);

                        const status = await service.processLead(lead);
                        console.log(`   ✅ Auto-response ${status.status}`);
                    }
                }
            } catch (err) {
                console.error(`❌ Error checking for leads:`, err);
            }
        })();
    }, 60000); // Check every minute

    console.log("💡 Press Ctrl+C to stop monitoring\n");

    // Keep process alive
    process.on("SIGINT", () => {
        clearInterval(checkInterval);
        console.log("\n\n👋 Shutting down...\n");
        process.exit(0);
    });

    await new Promise<void>(() => {
        // Infinite promise
    });
}

async function main(): Promise<void> {
    const command = process.argv[2] || "help";
    const arg = process.argv[3];

    try {
        switch (command) {
            case "test":
                await testResponse();
                break;
            case "pending":
                listPendingResponses();
                break;
            case "approve":
                if (!arg) {
                    console.error("❌ Please provide a lead ID");
                    process.exit(1);
                }
                await approveResponse(arg);
                break;
            case "reject":
                if (!arg) {
                    console.error("❌ Please provide a lead ID");
                    process.exit(1);
                }
                await rejectResponse(arg);
                break;
            case "stats":
                showStats();
                break;
            case "enable":
                enableAutoResponse();
                break;
            case "disable":
                disableAutoResponse();
                break;
            case "config":
                showConfig();
                break;
            case "monitor":
                await startAutoResponseMonitoring();
                break;
            case "help":
            default:
                console.log("\n📧 Email Auto-Response CLI Tool\n");
                console.log("Commands:");
                console.log("  test       - Generate a test response for most recent lead");
                console.log("  pending    - List all pending responses");
                console.log("  approve <leadId> - Approve and send a pending response");
                console.log("  reject <leadId>  - Reject a pending response");
                console.log("  stats      - Show auto-response statistics");
                console.log("  enable     - Enable auto-response system");
                console.log("  disable    - Disable auto-response system");
                console.log("  config     - Show current configuration");
                console.log(
                    "  monitor    - Start monitoring with auto-response enabled"
                );
                console.log("  help       - Show this help message\n");
                console.log("Examples:");
                console.log("  npm run email:test");
                console.log("  npm run email:pending");
                console.log("  npm run email:approve 1234567890abcdef");
                console.log("  npm run email:stats");
                console.log("  npm run email:monitor\n");
                break;
        }
    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
    console.log("\n\n👋 Shutting down...\n");
    process.exit(0);
});

main().catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
});
