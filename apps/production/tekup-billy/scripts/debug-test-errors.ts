/**
 * Debug script to identify TestSprite 500 errors
 * Checks environment variables, Billy API connection, and endpoint availability
 */

import dotenv from "dotenv";
import { BillyClient } from "../src/billy-client.js";
import { getBillyConfig, validateEnvironment } from "../src/config.js";

dotenv.config();

async function debugTestErrors() {
  console.log("🔍 Debugging TestSprite 500 Errors...\n");

  // 1. Check environment variables
  console.log("1️⃣ Checking Environment Variables...");
  const requiredVars = ["BILLY_API_KEY", "BILLY_ORGANIZATION_ID"];
  const optionalVars = ["BILLY_ORG_ID", "BILLY_API_BASE", "MCP_API_KEY"];

  let hasAllRequired = true;
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      console.log(
        `  ✅ ${varName}: ${value.substring(0, 10)}... (${value.length} chars)`
      );
    } else {
      console.log(`  ❌ ${varName}: NOT SET`);
      hasAllRequired = false;
    }
  }

  for (const varName of optionalVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`  ✅ ${varName}: Set`);
    } else {
      console.log(`  ⚠️  ${varName}: Not set (optional)`);
    }
  }

  if (!hasAllRequired) {
    console.log("\n❌ Missing required environment variables!");
    console.log(
      "   Please set BILLY_API_KEY and BILLY_ORGANIZATION_ID in .env file"
    );
    return;
  }

  // 2. Validate config
  console.log("\n2️⃣ Validating Configuration...");
  try {
    validateEnvironment();
    const config = getBillyConfig();
    console.log("  ✅ Configuration valid");
    console.log(`  - Organization ID: ${config.organizationId}`);
    console.log(`  - API Base: ${config.apiBase}`);
    console.log(`  - Test Mode: ${config.testMode}`);
    console.log(`  - Dry Run: ${config.dryRun}`);
  } catch (error) {
    console.log(
      `  ❌ Configuration error: ${error instanceof Error ? error.message : String(error)}`
    );
    return;
  }

  // 3. Test Billy API connection
  console.log("\n3️⃣ Testing Billy API Connection...");
  try {
    const config = getBillyConfig();
    const client = new BillyClient(config);

    // Test organization endpoint
    console.log("  Testing GET /organization...");
    const org = await client.getOrganization();

    if (org) {
      console.log("  ✅ Billy API connection successful!");
      console.log(`  - Organization Name: ${org.name}`);
      console.log(`  - Organization ID: ${org.id}`);
    } else {
      console.log("  ❌ Billy API returned null organization");
    }
  } catch (error) {
    console.log(`  ❌ Billy API connection failed:`);
    console.log(
      `     Error: ${error instanceof Error ? error.message : String(error)}`
    );
    if (error instanceof Error && error.stack) {
      console.log(`     Stack: ${error.stack.split("\n")[0]}`);
    }
    return;
  }

  // 4. Test customer creation endpoint
  console.log("\n4️⃣ Testing Customer Creation Endpoint...");
  try {
    const config = getBillyConfig();
    const client = new BillyClient(config);

    // Try to create a test customer
    const testCustomer = {
      name: `Test Customer ${Date.now()}`,
      isCustomer: true,
      isSupplier: false,
      countryId: "DK",
    };

    console.log("  Creating test customer...");
    const contact = await client.createContact(testCustomer);

    if (contact) {
      console.log("  ✅ Customer creation successful!");
      console.log(`  - Contact ID: ${contact.id}`);
      console.log(`  - Contact Name: ${contact.name}`);

      // Cleanup: Try to delete (if Billy API supports it)
      console.log(
        "  (Test customer created - may need manual cleanup in Billy.dk)"
      );
    } else {
      console.log("  ❌ Customer creation returned null");
    }
  } catch (error) {
    console.log(`  ❌ Customer creation failed:`);
    console.log(
      `     Error: ${error instanceof Error ? error.message : String(error)}`
    );
    if (error instanceof Error && error.stack) {
      const stackLines = error.stack.split("\n").slice(0, 5);
      console.log(`     Stack: ${stackLines.join("\n")}`);
    }
  }

  // 5. Test HTTP server endpoint
  console.log("\n5️⃣ Testing HTTP Server Endpoint...");
  try {
    const response = await fetch("http://localhost:3000/health");
    if (response.ok) {
      const data = await response.json();
      console.log("  ✅ HTTP server is running");
      console.log(`  - Status: ${data.status || "unknown"}`);
    } else {
      console.log(`  ⚠️  HTTP server responded with ${response.status}`);
    }
  } catch (error) {
    console.log(`  ❌ HTTP server not reachable:`);
    console.log(
      `     Error: ${error instanceof Error ? error.message : String(error)}`
    );
    console.log("     Make sure server is running: npm run dev:http");
  }

  console.log("\n✅ Debug complete!");
}

debugTestErrors().catch(console.error);
