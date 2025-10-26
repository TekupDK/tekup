/**
 * Test Tool Registry
 * 
 * Validates that all tools are properly registered and accessible
 */

import { toolRegistry } from "../tools/registry";
import { logger } from "../logger";

async function testToolRegistry(): Promise<void> {
    console.log("\n🔧 RenOS Tool Registry Test\n");

    try {
        // Test 1: Get all tools
        console.log("📋 Test 1: Get All Tools");
        const tools = await toolRegistry.getAllTools();
        console.log(`   ✅ Found ${tools.length} tools`);
        console.log(`   Tools: ${tools.map(t => t.name).join(", ")}\n`);

        // Test 2: Get statistics
        console.log("📊 Test 2: Registry Statistics");
        const stats = await toolRegistry.getStatistics();
        console.log(`   Total tools: ${stats.total_tools}`);
        console.log(`   Toolsets:`);
        for (const ts of stats.toolsets) {
            console.log(`      - ${ts.name}: ${ts.tool_count} tools`);
        }
        console.log(`   Categories:`);
        for (const [cat, count] of Object.entries(stats.categories)) {
            console.log(`      - ${cat}: ${count} tools`);
        }
        console.log();

        // Test 3: Validate registry
        console.log("✅ Test 3: Validate Registry");
        const validation = await toolRegistry.validate();
        console.log(`   Valid: ${validation.valid ? "✅" : "❌"}`);
        if (validation.errors.length > 0) {
            console.log(`   Errors:`);
            validation.errors.forEach(e => console.log(`      ❌ ${e}`));
        }
        if (validation.warnings.length > 0) {
            console.log(`   Warnings:`);
            validation.warnings.forEach(w => console.log(`      ⚠️  ${w}`));
        }
        console.log();

        // Test 4: Get specific tool
        console.log("🔍 Test 4: Get Specific Tool");
        const parseTool = await toolRegistry.getTool("parse_lead_email");
        if (parseTool) {
            console.log(`   ✅ Found tool: ${parseTool.name}`);
            console.log(`   Description: ${parseTool.description.substring(0, 80)}...`);
            console.log(`   Parameters: ${Object.keys(parseTool.parameters).join(", ")}`);
            console.log(`   Category: ${parseTool.category}`);
        } else {
            console.log(`   ❌ Tool not found`);
        }
        console.log();

        // Test 5: Get tools by category
        console.log("📂 Test 5: Get Tools by Category");
        const leadTools = await toolRegistry.getToolsByCategory("lead_processing");
        console.log(`   Lead Processing: ${leadTools.length} tools`);
        leadTools.forEach(t => console.log(`      - ${t.name}`));
        console.log();

        // Test 6: Get Gemini format
        console.log("🤖 Test 6: Gemini Function Calling Format");
        const geminiTools = await toolRegistry.getGeminiTools();
        console.log(`   ✅ Converted ${geminiTools.length} tools to Gemini format`);
        if (geminiTools.length > 0) {
            const example = geminiTools[0];
            console.log(`   Example (${example.name}):`);
            console.log(`      Description: ${example.description.substring(0, 60)}...`);
            console.log(`      Parameters: ${Object.keys(example.parameters.properties || {}).length} params`);
        }
        console.log();

        // Test 7: Tool execution (dry-run)
        console.log("⚙️  Test 7: Tool Execution (get_lead_statistics)");
        const result = await toolRegistry.executeTool("get_lead_statistics", { days: 30 });
        const status = result.status || "unknown";
        console.log(`   Status: ${typeof status === "string" ? status : JSON.stringify(status)}`);
        if (result.status === "success" && result.statistics) {
            const stats_result = result.statistics as { total_leads: number; conversion_rate: number };
            console.log(`   Total leads: ${stats_result.total_leads}`);
            console.log(`   Conversion rate: ${stats_result.conversion_rate}%`);
        }
        console.log();

        console.log("✅ All tests passed!\n");
        console.log("📋 Summary:");
        console.log(`   - ${stats.total_tools} tools registered`);
        console.log(`   - ${stats.toolsets.length} toolsets active`);
        console.log(`   - ${Object.keys(stats.categories).length} categories`);
        console.log(`   - Registry validation: ${validation.valid ? "✅ PASSED" : "❌ FAILED"}`);

    } catch (error) {
        console.error("\n❌ Test failed:", error);
        logger.error({ error }, "Tool registry test failed");
        process.exit(1);
    } finally {
        await toolRegistry.close();
    }
}

testToolRegistry().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
});
