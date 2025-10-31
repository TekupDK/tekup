/**
 * Comprehensive Railway endpoint testing script
 * Tests all critical endpoints to verify functionality before TestSprite re-run
 */

import dotenv from "dotenv";
dotenv.config();

const RAILWAY_URL = "https://tekup-billy-production.up.railway.app";
const API_KEY =
  "bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b";

interface TestResult {
  endpoint: string;
  method: string;
  status: "pass" | "fail";
  statusCode?: number;
  error?: string;
  responseTime?: number;
}

const results: TestResult[] = [];

async function testEndpoint(
  name: string,
  endpoint: string,
  method: "GET" | "POST",
  body?: any
): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
      },
    };

    if (body && method === "POST") {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${RAILWAY_URL}${endpoint}`, options);
    const responseTime = Date.now() - startTime;

    let responseData;
    try {
      responseData = await response.json();
    } catch {
      responseData = { raw: await response.text() };
    }

    if (response.ok) {
      return {
        endpoint: name,
        method,
        status: "pass",
        statusCode: response.status,
        responseTime,
      };
    } else {
      return {
        endpoint: name,
        method,
        status: "fail",
        statusCode: response.status,
        error: responseData.error || responseData.message || "Unknown error",
        responseTime,
      };
    }
  } catch (error) {
    return {
      endpoint: name,
      method,
      status: "fail",
      error: error instanceof Error ? error.message : String(error),
      responseTime: Date.now() - startTime,
    };
  }
}

async function runAllTests() {
  console.log("🧪 Testing Railway Endpoints...\n");

  // Health endpoints
  results.push(await testEndpoint("Health Check", "/health", "GET"));
  results.push(await testEndpoint("Version", "/version", "GET"));

  // Auth endpoints
  results.push(
    await testEndpoint(
      "Validate Auth",
      "/api/v1/tools/validate_auth",
      "POST",
      {}
    )
  );

  // Customer endpoints
  results.push(
    await testEndpoint(
      "List Customers",
      "/api/v1/tools/list_customers",
      "POST",
      { limit: 5 }
    )
  );

  // Invoice endpoints
  results.push(
    await testEndpoint("List Invoices", "/api/v1/tools/list_invoices", "POST", {
      limit: 5,
    })
  );

  // Product endpoints
  results.push(
    await testEndpoint("List Products", "/api/v1/tools/list_products", "POST", {
      limit: 5,
    })
  );

  // Revenue endpoints
  const today = new Date().toISOString().split("T")[0];
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStr = lastMonth.toISOString().split("T")[0];
  results.push(
    await testEndpoint("Get Revenue", "/api/v1/tools/get_revenue", "POST", {
      startDate: lastMonthStr,
      endDate: today,
    })
  );

  // Summary
  console.log("\n📊 Test Results:\n");
  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;

  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}\n`);

  results.forEach((result) => {
    const icon = result.status === "pass" ? "✅" : "❌";
    const time = result.responseTime ? ` (${result.responseTime}ms)` : "";
    const status = result.statusCode ? ` [${result.statusCode}]` : "";
    const error = result.error ? ` - ${result.error}` : "";
    console.log(
      `${icon} ${result.method} ${result.endpoint}${status}${time}${error}`
    );
  });

  console.log(
    `\n${passed === results.length ? "✅ All tests passed!" : "⚠️ Some tests failed"}`
  );

  return { passed, failed, total: results.length };
}

runAllTests().catch(console.error);
