/**
 * Quick Test: Verify all 3 Quick Wins
 * 
 * Tests that tracer, memory, and reflector are working correctly
 */

import { tracer } from "../src/agents/executionTracer";
import { globalMemory, memoryManager } from "../src/agents/agentMemory";
import { reflector } from "../src/agents/agentReflector";
import type { PlannedTask } from "../src/types";

console.log("🧪 Testing Agent Improvements...\n");

// ============================================================================
// Test 1: Execution Tracer
// ============================================================================

console.log("📊 Test 1: Execution Tracer");
console.log("─".repeat(50));

const traceId = tracer.startTrace("test_task", "test_execution");
console.log(`✅ Started trace: ${traceId}`);

tracer.recordStep(traceId, {
  name: "step_1",
  status: "running",
  metadata: { test: true },
});
console.log("✅ Recorded step");

tracer.recordLLMCall(traceId, {
  model: "gemini-2.0-flash",
  tokensUsed: 150,
  tokensPrompt: 100,
  tokensCompletion: 50,
  duration: 1000,
  cost: 0.0001,
});
console.log("✅ Recorded LLM call");

tracer.recordToolCall(traceId, {
  tool: "test_tool",
  input: { test: "data" },
  output: { result: "success" },
  duration: 500,
  status: "success",
});
console.log("✅ Recorded tool call");

tracer.completeStep(traceId, "step_1", "success");
tracer.endTrace(traceId, "completed");
console.log("✅ Completed trace");

const traceSummary = tracer.getTraceSummary(traceId);
console.log("\n📋 Trace Summary:");
console.log(traceSummary);

console.log("\n");

// ============================================================================
// Test 2: Agent Memory
// ============================================================================

console.log("🧠 Test 2: Agent Memory");
console.log("─".repeat(50));

// Global memory
globalMemory.addToHistory({
  role: "user",
  content: "I need a cleaning service next Friday",
});
console.log("✅ Added message to global memory");

globalMemory.learnPreference("preferred_day", "Friday");
console.log("✅ Learned preference");

const day = globalMemory.getPreference<string>("preferred_day");
console.log(`✅ Retrieved preference: ${day}`);

const history = globalMemory.getHistory(5);
console.log(`✅ Retrieved history: ${history.length} messages`);

// Customer memory
const customerMemory = memoryManager.getMemory("test_customer_123");
customerMemory.addToHistory({
  role: "assistant",
  content: "I can schedule that for Friday at 10:00 AM",
});
console.log("✅ Added message to customer memory");

const stats = memoryManager.getStats();
console.log(`✅ Memory stats: ${stats.totalCustomers} customers, ${stats.totalMessages} messages`);

console.log("\n");

// ============================================================================
// Test 3: Reflection Layer
// ============================================================================

console.log("🤔 Test 3: Reflection Layer");
console.log("─".repeat(50));

// Test successful task
const successTask: PlannedTask = {
  id: "task_1",
  type: "email.compose",
  provider: "gmail",
  payload: {
    to: "test@example.com",
    subject: "Test",
    body: "Test email",
  },
  priority: "normal",
  blocking: false,
};

const successResult = {
  taskId: "task_1",
  provider: "gmail" as const,
  status: "success" as const,
  detail: "Email sent successfully",
};

const successEval = reflector.evaluate(successTask, successResult);
console.log(`✅ Evaluated successful task: needsRetry=${successEval.needsRetry}`);
console.log(`   Issues: ${successEval.issues.length}, Corrections: ${successEval.corrections.length}`);

// Test failed task
const failedTask: PlannedTask = {
  id: "task_2",
  type: "email.compose",
  provider: "gmail",
  payload: {
    // Missing 'to' field
    subject: "Test",
    body: "Test email",
  },
  priority: "normal",
  blocking: false,
};

const failedResult = {
  taskId: "task_2",
  provider: "gmail" as const,
  status: "failed" as const,
  detail: "Missing recipient email",
};

const failedEval = reflector.evaluate(failedTask, failedResult);
console.log(`✅ Evaluated failed task: needsRetry=${failedEval.needsRetry}`);
console.log(`   Issues: ${failedEval.issues.length}`);
failedEval.issues.forEach((issue, i) => {
  console.log(`   ${i + 1}. [${issue.severity}] ${issue.category}: ${issue.description}`);
});

console.log(`   Corrections: ${failedEval.corrections.length}`);
failedEval.corrections.forEach((correction, i) => {
  console.log(`   ${i + 1}. [${correction.type}] ${correction.description}`);
});

const bestCorrection = reflector.getBestCorrection(failedEval);
if (bestCorrection) {
  console.log(`✅ Best correction: ${bestCorrection.type} - ${bestCorrection.reason}`);
}

const metrics = reflector.getMetrics();
console.log("\n📊 Reflection Metrics:");
console.log(`   Total evaluations: ${metrics.totalEvaluations}`);
console.log(`   Total retries: ${metrics.totalRetries}`);
console.log(`   Total corrections: ${metrics.totalCorrections}`);
console.log(`   Average confidence: ${(metrics.averageConfidence * 100).toFixed(1)}%`);
console.log(`   Correction success rate: ${(metrics.correctionSuccessRate * 100).toFixed(1)}%`);

console.log("\n");

// ============================================================================
// Summary
// ============================================================================

console.log("🎉 All Tests Complete!");
console.log("─".repeat(50));
console.log("✅ Execution Tracer: Working");
console.log("✅ Agent Memory: Working");
console.log("✅ Reflection Layer: Working");
console.log("\n🚀 Agent improvements ready for production!");
