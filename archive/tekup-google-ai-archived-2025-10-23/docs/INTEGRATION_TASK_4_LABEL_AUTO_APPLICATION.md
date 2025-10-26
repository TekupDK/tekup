# ✅ Integration Task 4: Label Auto-Application\n\n\n\n## 📋 Task Overview\n\n\n\n**Status**: ✅ COMPLETE  
**Duration**: 1 hour  
**Priority**: HIGH  
**Date**: 2025-01-03
\n\n## 🎯 Objectives\n\n\n\nAutomatically apply Gmail labels after key email actions to track lead workflow progression:
\n\n- Quote sent → Apply "quote_sent" label\n\n- Booking confirmed → Apply "booked" label  \n\n- Follow-up needed → Apply "follow_up_needed" label\n\n- Job completed → Apply "completed" label\n\n\n\n## 🏗️ Implementation\n\n\n\n### 1. New Helper Function: `applyEmailActionLabel()`\n\n\n\n**File**: `src/services/emailResponseGenerator.ts` (lines 704-758)

Wrapper function that applies appropriate label after email action:
\n\n```typescript
export async function applyEmailActionLabel(
    threadId: string | undefined,
    action: "quote_sent" | "booked" | "follow_up_needed" | "completed",
    reason?: string
): Promise<boolean> {
    if (!threadId) {
        logger.warn({ action }, "⚠️ Cannot apply label - no thread ID provided");\n\n        return false;
    }

    try {
        const result = await applyLabelToThread(
            threadId,
            action,
            reason || `Email action: ${action}`
        );

        if (result.success) {
            logger.info(
                { 
                    threadId, 
                    action, 
                    labelName: result.labelName,
                    labelId: result.labelId
                },
                `✅ Label applied successfully: ${action}`
            );
            return true;
        } else {
            logger.warn(
                { threadId, action, error: result.error },
                `⚠️ Failed to apply label: ${result.error}`
            );
            return false;
        }
    } catch (error) {
        logger.error({ threadId, action, error }, "❌ Error applying email action label");
        return false;
    }
}\n\n```

**Features:**
\n\n- ✅ Validates thread ID before attempting\n\n- ✅ Logs success/failure with context\n\n- ✅ Returns boolean for error handling\n\n- ✅ Safe fallback if label fails (doesn't crash)\n\n\n\n### 2. Label Workflow States\n\n\n\nFrom `src/types/labels.ts`:
\n\n```
new_lead (🆕)
    ↓
quote_sent (💌)
    ↓
awaiting_response (⏳)
    ↓
booked (✅) or lost (❌)
    ↓
completed (🎉)\n\n```

**Valid State Transitions:**
\n\n- `new_lead` → `quote_sent`, `lost`\n\n- `quote_sent` → `awaiting_response`, `booked`, `lost`\n\n- `awaiting_response` → `follow_up_needed`, `booked`, `lost`\n\n- `follow_up_needed` → `quote_sent`, `booked`, `lost`\n\n- `booked` → `completed`\n\n- `completed` → (terminal state)\n\n- `lost` → (terminal state)\n\n- `conflict` → (special state, can transition anywhere after resolution)\n\n\n\n### 3. Test Tool\n\n\n\n**File**: `src/tools/testLabelApplication.ts`

CLI tool to test label application:
\n\n```bash
npm run label:test <threadId> <action>
\n\n# Examples:\n\nnpm run label:test thread_abc123 quote_sent\n\nnpm run label:test thread_xyz789 booked
npm run label:test thread_def456 follow_up_needed
npm run label:test thread_ghi789 completed\n\n```

**Validations:**
\n\n- ✅ Checks thread ID is provided\n\n- ✅ Validates action is one of 4 valid types\n\n- ✅ Shows success/failure clearly\n\n- ✅ Logs detailed info for debugging\n\n\n\n## 🔄 Integration Points\n\n\n\n### After Quote Sent\n\n\n\n**Location**: When email with quote is successfully sent
\n\n```typescript
import { applyEmailActionLabel } from "./services/emailResponseGenerator";

// After sending quote email via Gmail API
const emailSent = await gmailService.sendEmail({
    to: customer.email,
    subject: "Tilbud på rengøring",
    body: quoteBody,
    threadId: lead.threadId
});

if (emailSent) {
    // Auto-apply label
    await applyEmailActionLabel(
        lead.threadId,
        "quote_sent",
        "Quote email sent to customer"
    );
}\n\n```
\n\n### After Booking Confirmed\n\n\n\n**Location**: When customer confirms booking
\n\n```typescript
// After creating booking in database
const booking = await prisma.booking.create({
    data: {
        customerId: customer.id,
        startTime: bookingTime,
        duration: 120,
        status: "confirmed"
    }
});

// Auto-apply label
await applyEmailActionLabel(
    lead.threadId,
    "booked",
    `Booking confirmed for ${formatDate(bookingTime)}`
);\n\n```
\n\n### After Follow-up Needed\n\n\n\n**Location**: When lead requires manual follow-up
\n\n```typescript
// After detecting no response after X days
if (daysSinceQuote > 5 && !hasResponse) {
    await applyEmailActionLabel(
        lead.threadId,
        "follow_up_needed",
        `No response for ${daysSinceQuote} days - needs follow-up`\n\n    );
}\n\n```
\n\n### After Job Completed\n\n\n\n**Location**: When job is marked as completed
\n\n```typescript
// After job completion
await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "completed" }
});

// Auto-apply label
await applyEmailActionLabel(
    lead.threadId,
    "completed",
    "Job completed successfully"
);\n\n```
\n\n## 🧪 Testing\n\n\n\n### Manual Test\n\n\n\n```bash\n\n# First, get a real thread ID from Gmail\n\nnpm run label:threads new_lead\n\n\n\n# Test applying quote_sent label\n\nnpm run label:test <thread_id> quote_sent\n\n\n\n# Check if label was applied\n\nnpm run label:status <thread_id>\n\n```\n\n\n\n### Expected Behavior\n\n\n\n**Success Case:**
\n\n```
🧪 Testing label application...
Thread ID: thread_abc123
Action: quote_sent

[2025-01-03 20:45:12] INFO: 🏷️ Applying quote_sent label after email action
[2025-01-03 20:45:12] INFO: ✅ Label applied successfully: quote_sent

✅ SUCCESS: Label "quote_sent" applied to thread thread_abc123\n\n```

**Failure Case (invalid transition):**
\n\n```
🧪 Testing label application...
Thread ID: thread_abc123
Action: completed

[2025-01-03 20:45:12] INFO: 🏷️ Applying completed label after email action
[2025-01-03 20:45:12] WARN: ⚠️ Invalid state transition: quote_sent → completed
[2025-01-03 20:45:12] WARN: ⚠️ Failed to apply label: Invalid state transition

⚠️ FAILED: Could not apply label "completed" to thread thread_abc123\n\n```
\n\n### Build Test\n\n\n\n```bash\n\nnpm run build\n\n```

**Result**: ✅ SUCCESS - No compilation errors\n\n\n\n## 📊 Workflow Diagram\n\n\n\n```\n\nEmail Action → applyEmailActionLabel()
                        ↓
            Check threadId exists?
                        ↓
                YES │    NO
                    ↓     ↓
            Call         Return
            applyLabel   false
            ToThread        
                ↓
        Validate State
        Transition
                ↓
            Valid? 
                ↓
        YES │    NO
            ↓     ↓
        Apply    Return
        Label    error
            ↓
        Update
        Gmail
        Thread
            ↓
        Log
        Success
            ↓
        Return
        true\n\n```
\n\n## 🎯 Usage Examples\n\n\n\n### Example 1: Quote Generation & Send\n\n\n\n```typescript\n\nimport { EmailResponseGenerator, applyEmailActionLabel } from "./services/emailResponseGenerator";
import { gmailService } from "./services/gmailService";

// Generate quote
const generator = new EmailResponseGenerator();
const quote = await generator.generateResponse({
    lead,
    responseType: "tilbud"
});

// Send quote
if (quote.shouldSend) {
    const sent = await gmailService.sendEmail({
        to: quote.to,
        subject: quote.subject,
        body: quote.body,
        threadId: lead.threadId
    });

    // Auto-apply label after successful send
    if (sent) {
        await applyEmailActionLabel(
            lead.threadId,
            "quote_sent",
            `Quote sent to ${lead.email}`
        );
    }
}\n\n```
\n\n### Example 2: Booking Confirmation Flow\n\n\n\n```typescript\n\nimport { applyEmailActionLabel } from "./services/emailResponseGenerator";

async function confirmBooking(lead: Lead, bookingTime: Date) {
    // Create booking
    const booking = await prisma.booking.create({
        data: {
            leadId: lead.id,
            startTime: bookingTime,
            duration: 120,
            status: "confirmed"
        }
    });

    // Send confirmation email
    const confirmationSent = await sendBookingConfirmation(lead, booking);

    if (confirmationSent) {
        // Auto-apply booked label
        const labeled = await applyEmailActionLabel(
            lead.emailThreadId,
            "booked",
            `Booking confirmed: ${bookingTime.toLocaleDateString("da-DK")}`
        );

        if (labeled) {
            console.log("✅ Booking labeled in Gmail");
        }
    }

    return booking;
}\n\n```
\n\n### Example 3: Follow-up Detection\n\n\n\n```typescript\n\nimport { applyEmailActionLabel } from "./services/emailResponseGenerator";

async function checkForFollowUpNeeded() {
    // Get leads with quote sent but no response
    const leadsNeedingFollowUp = await prisma.lead.findMany({
        where: {
            status: "quote_sent",
            updatedAt: {
                lt: subDays(new Date(), 5) // 5 days ago
            }
        }
    });

    for (const lead of leadsNeedingFollowUp) {
        // Check if customer has responded
        const hasResponse = await checkCustomerResponse(lead.emailThreadId);

        if (!hasResponse) {
            // Mark for follow-up
            await applyEmailActionLabel(
                lead.emailThreadId,
                "follow_up_needed",
                `No response for 5+ days`\n\n            );

            console.log(`📌 Marked lead ${lead.id} for follow-up`);
        }
    }
}\n\n```
\n\n## 📈 Metrics & Monitoring\n\n\n\n### Log Entries\n\n\n\n**Label Applied Successfully:**
\n\n```json
{
  "level": "info",
  "time": "2025-01-03T20:45:12.123Z",
  "msg": "✅ Label applied successfully: quote_sent",
  "threadId": "thread_abc123",
  "action": "quote_sent",
  "labelName": "quote_sent",
  "labelId": "Label_123"
}\n\n```

**Label Application Failed:**
\n\n```json
{
  "level": "warn",
  "time": "2025-01-03T20:45:12.123Z",
  "msg": "⚠️ Failed to apply label: Invalid state transition",
  "threadId": "thread_abc123",
  "action": "completed",
  "error": "Cannot transition from quote_sent to completed"
}\n\n```

**Missing Thread ID:**
\n\n```json
{
  "level": "warn",
  "time": "2025-01-03T20:45:12.123Z",
  "msg": "⚠️ Cannot apply label - no thread ID provided",\n\n  "action": "quote_sent"
}\n\n```
\n\n### CLI Commands\n\n\n\n```bash\n\n# Test label application\n\nnpm run label:test <threadId> <action>\n\n\n\n# List threads with specific label\n\nnpm run label:threads quote_sent\n\n\n\n# Check thread status\n\nnpm run label:status <threadId>\n\n\n\n# List all labels\n\nnpm run label:list\n\n\n\n# Sync label state\n\nnpm run label:sync\n\n```\n\n\n\n## 🚨 Important Notes\n\n\n\n### Thread ID Required\n\n\n\n**CRITICAL**: You must have a valid Gmail thread ID to apply labels. If lead doesn't have `emailThreadId`, label application will fail silently (return false).
\n\n```typescript
// ❌ WRONG - will fail if threadId is undefined\n\nawait applyEmailActionLabel(lead.emailThreadId, "quote_sent");

// ✅ CORRECT - check first\n\nif (lead.emailThreadId) {
    await applyEmailActionLabel(lead.emailThreadId, "quote_sent");
}\n\n```
\n\n### State Transition Validation\n\n\n\nLabels follow strict workflow rules. You cannot skip states:
\n\n```typescript
// ❌ INVALID - cannot go directly from new_lead to completed\n\nnew_lead → completed  // BLOCKED

// ✅ VALID - follow workflow\n\nnew_lead → quote_sent → booked → completed  // OK\n\n```
\n\n### Dry-Run Mode\n\n\n\nIn `RUN_MODE=dry-run`, labels are NOT actually applied to Gmail, but all logging occurs as if they were. Check logs carefully during testing.
\n\n## 🎯 Success Criteria\n\n\n\n- [x] `applyEmailActionLabel()` function implemented\n\n- [x] Validates thread ID before applying\n\n- [x] Returns boolean for error handling\n\n- [x] Logs success/failure with context\n\n- [x] Test CLI tool created (`label:test` command)\n\n- [x] Package.json script added\n\n- [x] TypeScript compiles without errors\n\n- [x] Documentation complete\n\n\n\n## 🔜 Next Steps\n\n\n\n**Task 5**: End-to-end testing
\n\n- Test full workflow: Lead → Quote (with label) → Follow-up → Booking (with label)\n\n- Verify: Duplicates block, conflicts escalate, labels auto-apply\n\n- Test all CLI commands work correctly\n\n- Estimated time: 2 hours\n\n
**Task 6**: User guide for Jonas
\n\n- Document all CLI commands with examples\n\n- Document conflict/follow-up workflows\n\n- Document how to review/approve AI responses\n\n- Create quick reference cheat sheet\n\n- Estimated time: 1 hour\n\n
---

**Implementation Date**: 2025-01-03  
**Status**: ✅ COMPLETE  
**Build Status**: ✅ Passing  
**Integration**: ✅ Ready for use (requires thread IDs)  
**Testing**: ⏳ Needs real Gmail thread IDs for full test
