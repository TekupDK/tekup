/**
 * Sentry Test Script - Trigger intentional error
 * Run with: node dist/tools/sentryTest.js
 */

import * as Sentry from "@sentry/node";

console.log("🧪 Testing Sentry error capture...");

// Test 1: Capture a simple error
try {
    console.log("Test 1: Throwing intentional error...");
    throw new Error("🧪 Test error from RenOS - Sentry integration working!");
} catch (error) {
    Sentry.captureException(error);
    console.log("✅ Test error sent to Sentry");
}

// Test 2: Capture a message
Sentry.captureMessage("🧪 Test message from RenOS", "info");
console.log("✅ Test message sent to Sentry");

// Test 3: Add context and capture error
Sentry.setContext("test_context", {
    test_type: "manual_verification",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
});

Sentry.setTag("test_id", "category_a_verification");

try {
    console.log("Test 3: Error with context...");
    // Simulate undefined function call
    const undefinedFunction: any = undefined;
    undefinedFunction();
} catch (error) {
    Sentry.captureException(error);
    console.log("✅ Error with context sent to Sentry");
}

// Flush and wait for events to be sent
void Sentry.flush(2000).then(() => {
    console.log("\n🎉 All test events sent to Sentry!");
    console.log("Check dashboard: https://rendetalje-org.sentry.io");
    process.exit(0);
});
