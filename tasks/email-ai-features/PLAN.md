# Email AI Features - Implementation Plan

**Task ID:** email-ai-features
**Dato:** 5. november 2025
**Priority:** 🟠 HIGH VALUE
**Status:** In Progress

---

## 📋 Overview

Dette task implementerer **AI-powered features** for Email tab, inspireret af moderne email clients som Shortwave.ai og Superhuman. Features giver brugerne intelligent email håndtering med automatiske opsummeringer og smart label suggestions.

### Features i Phase 1:

1. **AI Email Summaries** - Auto-generate korte opsummeringer for lange emails
2. **Smart Auto-Labeling** - Foreslå labels baseret på email content med confidence scores

---

## 🎯 Goals

- ✅ Auto-generate summaries for emails >200 words (max 150 chars)
- ✅ Smart label suggestions med confidence scoring (0-100%)
- ✅ Cache AI results i database for performance
- ✅ Display summaries prominent i email list
- ✅ Show label suggestions med "Auto Apply" for high confidence
- ✅ Batch processing for existing emails (background job)

---

## 🔧 Technical Approach

### 1. AI Email Summaries

**Goal:** Generate 1-2 sentence summaries (max 150 chars) for long emails

#### Database Schema Addition:

```typescript
// Add to emails table
alter table emails add column ai_summary text null;
alter table emails add column ai_summary_generated_at timestamp null;
```

#### Backend Implementation:

```typescript
// server/src/services/ai-email-summary.ts
import { openai } from "@/lib/openai"; // or Gemini API

export async function generateEmailSummary(
  emailText: string,
  subject: string
): Promise<string> {
  if (emailText.split(" ").length < 200) {
    return ""; // Skip short emails
  }

  const prompt = `Summarize this email in 1-2 sentences (max 150 chars):

Subject: ${subject}

${emailText.substring(0, 2000)}

Summary:`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Fast and cheap
    messages: [{ role: "user", content: prompt }],
    max_tokens: 50,
    temperature: 0.3,
  });

  return response.choices[0].message.content?.trim() || "";
}
```

#### tRPC Endpoint:

```typescript
// server/src/trpc/routes/inbox/email.ts
generateSummary: protectedProcedure
  .input(z.object({ emailId: z.number() }))
  .mutation(async ({ input, ctx }) => {
    const email = await ctx.db
      .select()
      .from(emails)
      .where(eq(emails.id, input.emailId))
      .limit(1);

    if (!email[0]) throw new Error('Email not found');

    const summary = await generateEmailSummary(
      email[0].text || '',
      email[0].subject || ''
    );

    await ctx.db
      .update(emails)
      .set({
        ai_summary: summary,
        ai_summary_generated_at: new Date().toISOString(),
      })
      .where(eq(emails.id, input.emailId));

    return { summary };
  }),
```

#### UI Integration:

```typescript
// client/src/components/inbox/EmailTab.tsx
{email.aiSummary && (
  <p className="text-xs text-muted-foreground italic mt-1">
    {email.aiSummary}
  </p>
)}
```

---

### 2. Smart Auto-Labeling

**Goal:** Suggest 1-3 labels per email med confidence scores

#### Label Categories:

- 🟢 **Lead** - Nye forespørgsler (keywords: "tilbud", "pris", "rengøring", "flyt")
- 🔵 **Booking** - Bekræftelser (keywords: "dato", "tid", "adresse", "booking")
- 🟡 **Finance** - Invoices/betalinger (keywords: "faktura", "betaling", "invoice")
- 🔴 **Support** - Klager/problemer (keywords: "problem", "klage", "hjælp")
- 🟣 **Newsletter** - Marketing (keywords: "unsubscribe", "newsletter")

#### Backend Implementation:

```typescript
// server/src/services/ai-label-suggestions.ts
interface LabelSuggestion {
  label: string;
  confidence: number; // 0-100
  reason: string;
}

export async function suggestLabels(
  emailText: string,
  subject: string,
  from: string
): Promise<LabelSuggestion[]> {
  const prompt = `Analyze this email and suggest relevant labels with confidence scores (0-100).

Categories: Lead, Booking, Finance, Support, Newsletter

Subject: ${subject}
From: ${from}
Body: ${emailText.substring(0, 1000)}

Respond in JSON format:
[
  { "label": "Lead", "confidence": 85, "reason": "Customer asking for quote" },
  ...
]`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  return JSON.parse(response.choices[0].message.content || "[]");
}
```

#### Database Schema Addition:

```typescript
// Add to emails table
alter table emails add column ai_label_suggestions jsonb null;
alter table emails add column ai_labels_generated_at timestamp null;
```

#### tRPC Endpoint:

```typescript
suggestLabels: protectedProcedure
  .input(z.object({ emailId: z.number() }))
  .mutation(async ({ input, ctx }) => {
    const email = await ctx.db
      .select()
      .from(emails)
      .where(eq(emails.id, input.emailId))
      .limit(1);

    if (!email[0]) throw new Error('Email not found');

    const suggestions = await suggestLabels(
      email[0].text || '',
      email[0].subject || '',
      email[0].fromEmail
    );

    await ctx.db
      .update(emails)
      .set({
        ai_label_suggestions: suggestions,
        ai_labels_generated_at: new Date().toISOString(),
      })
      .where(eq(emails.id, input.emailId));

    return { suggestions };
  }),

applyLabelSuggestion: protectedProcedure
  .input(z.object({
    threadId: z.string(),
    label: z.string(),
  }))
  .mutation(async ({ input, ctx }) => {
    // Apply label via Gmail API (existing logic)
    await addLabelToThread(input.threadId, input.label);
    return { success: true };
  }),
```

#### UI Integration:

```typescript
// client/src/components/inbox/LabelSuggestions.tsx
export function LabelSuggestions({ emailId, suggestions }) {
  const applyLabel = trpc.inbox.email.applyLabelSuggestion.useMutation();

  return (
    <div className="flex gap-2 mt-2">
      {suggestions.map(s => (
        <button
          key={s.label}
          onClick={() => applyLabel.mutate({ emailId, label: s.label })}
          className={cn(
            "text-xs px-2 py-1 rounded border",
            s.confidence > 85 ? "border-green-500 bg-green-50" : "border-gray-300"
          )}
        >
          {s.label} ({s.confidence}%)
        </button>
      ))}
    </div>
  );
}
```

---

## 📁 Files to Create/Modify

### Backend:

1. `server/src/services/ai-email-summary.ts` - Summary generation logic (NEW)
2. `server/src/services/ai-label-suggestions.ts` - Label suggestion logic (NEW)
3. `server/src/trpc/routes/inbox/email.ts` - Add generateSummary, suggestLabels endpoints
4. `drizzle/schema.ts` - Add ai_summary, ai_label_suggestions columns
5. `drizzle/migrations/` - Create migration for new columns

### Frontend:

1. `client/src/components/inbox/EmailTab.tsx` - Display summaries
2. `client/src/components/inbox/LabelSuggestions.tsx` - Label suggestion UI (NEW)
3. `client/src/components/inbox/EmailThreadView.tsx` - Show suggestions in thread view

### Configuration:

1. `.env` - Add OPENAI_API_KEY or GEMINI_API_KEY
2. `.env.template.txt` - Document AI API keys

---

## 🧪 Testing Strategy

### 1. Summary Generation Tests

```typescript
describe("AI Email Summaries", () => {
  it("should generate summary for long email", async () => {
    const longText = "Lorem ipsum...".repeat(100); // >200 words
    const summary = await generateEmailSummary(longText, "Test Subject");

    expect(summary).toBeDefined();
    expect(summary.length).toBeLessThanOrEqual(150);
  });

  it("should skip short emails", async () => {
    const shortText = "Short email";
    const summary = await generateEmailSummary(shortText, "Test");

    expect(summary).toBe("");
  });

  it("should cache summary in database", async () => {
    const email = await db.select().from(emails).where(eq(emails.id, 1));

    expect(email[0].ai_summary).toBeDefined();
    expect(email[0].ai_summary_generated_at).toBeDefined();
  });
});
```

### 2. Label Suggestion Tests

```typescript
describe("Smart Auto-Labeling", () => {
  it("should suggest labels with confidence scores", async () => {
    const text = "Jeg vil gerne have et tilbud på rengøring...";
    const suggestions = await suggestLabels(
      text,
      "Tilbud forespørgsel",
      "kunde@example.com"
    );

    expect(suggestions).toHaveLength.greaterThan(0);
    expect(suggestions[0]).toHaveProperty("label");
    expect(suggestions[0]).toHaveProperty("confidence");
    expect(suggestions[0].confidence).toBeGreaterThanOrEqual(0);
    expect(suggestions[0].confidence).toBeLessThanOrEqual(100);
  });

  it("should identify Lead emails correctly", async () => {
    const text =
      "Jeg vil gerne have et tilbud på flytterengøring til næste uge";
    const suggestions = await suggestLabels(text, "Tilbud", "test@example.com");

    const leadSuggestion = suggestions.find(s => s.label === "Lead");
    expect(leadSuggestion).toBeDefined();
    expect(leadSuggestion?.confidence).toBeGreaterThan(70);
  });

  it("should auto-apply high confidence labels", async () => {
    const suggestions = [
      { label: "Lead", confidence: 90, reason: "Quote request" },
    ];

    // Should auto-apply
    expect(suggestions[0].confidence).toBeGreaterThan(85);
  });
});
```

### 3. UI Integration Tests

```typescript
describe("AI Features UI", () => {
  it("should display summary below subject line", async () => {
    await page.goto("/inbox");
    await page.click('[data-testid="email-item-1"]');

    const summary = await page.locator(".email-summary").textContent();
    expect(summary).toBeTruthy();
    expect(summary.length).toBeLessThanOrEqual(150);
  });

  it("should show label suggestions with confidence", async () => {
    await page.goto("/inbox");
    await page.click('[data-testid="email-item-1"]');

    const suggestions = await page
      .locator('[data-testid="label-suggestion"]')
      .count();
    expect(suggestions).toBeGreaterThan(0);

    const firstSuggestion = await page
      .locator('[data-testid="label-suggestion"]')
      .first();
    const text = await firstSuggestion.textContent();
    expect(text).toMatch(/\d+%/); // Should show confidence percentage
  });

  it("should apply label on click", async () => {
    await page.goto("/inbox");
    await page.click('[data-testid="email-item-1"]');
    await page.click('[data-testid="label-suggestion"]:has-text("Lead")');

    await expect(page.locator(".toast")).toHaveText(/Label applied/);
  });
});
```

---

## 📊 Implementation Steps

### Phase 1: Database Schema (30 min)

1. [ ] Add ai_summary, ai_summary_generated_at columns to emails table
2. [ ] Add ai_label_suggestions, ai_labels_generated_at columns
3. [ ] Create Drizzle migration
4. [ ] Run migration on development database

### Phase 2: Backend - AI Summary (1-2 timer)

1. [ ] Create `ai-email-summary.ts` service
2. [ ] Implement `generateEmailSummary()` function
3. [ ] Add OpenAI/Gemini API integration
4. [ ] Add tRPC endpoint `generateSummary`
5. [ ] Add error handling and rate limiting
6. [ ] Write unit tests

### Phase 3: Backend - Smart Labeling (1-2 timer)

1. [ ] Create `ai-label-suggestions.ts` service
2. [ ] Implement `suggestLabels()` function
3. [ ] Add tRPC endpoints `suggestLabels`, `applyLabelSuggestion`
4. [ ] Write unit tests

### Phase 4: Frontend - UI Integration (2-3 timer)

1. [ ] Display AI summaries in EmailTab
2. [ ] Create LabelSuggestions component
3. [ ] Add loading states and error handling
4. [ ] Add "Generate Summary" button for on-demand
5. [ ] Add "Auto Apply" for high confidence labels
6. [ ] Style with Tailwind (subtle, non-intrusive)

### Phase 5: Batch Processing (1 timer)

1. [ ] Create background job for processing existing emails
2. [ ] Add rate limiting (max 60 requests/minute for OpenAI)
3. [ ] Add progress tracking
4. [ ] Add admin UI for triggering batch processing

### Phase 6: Testing & Documentation (1 timer)

1. [ ] Write E2E tests
2. [ ] Run TypeScript check
3. [ ] Production build validation
4. [ ] Update README with AI features documentation
5. [ ] Update PLAN.md → STATUS.md → CHANGELOG.md

---

## 🔗 Related Documents

- **Roadmap:** `docs/EMAIL_TAB_AI_FEATURES_ROADMAP.md`
- **Email Tab Status:** `docs/EMAIL_TAB_COMPLETE_ROADMAP.md`
- **API Docs:** OpenAI API, Gemini API

---

## ⚠️ Risks & Mitigations

| Risk                         | Impact    | Mitigation                                                     |
| ---------------------------- | --------- | -------------------------------------------------------------- |
| OpenAI API rate limits       | 🟡 MEDIUM | Implement caching, batch processing, fallback to Gemini        |
| High API costs               | 🟡 MEDIUM | Use gpt-4o-mini (cheap), cache results, skip short emails      |
| Inaccurate label suggestions | 🟡 MEDIUM | Show confidence scores, require user confirmation <85%         |
| Slow summary generation      | 🟡 MEDIUM | Generate async, show loading state, cache in database          |
| Database migration issues    | 🟡 MEDIUM | Test migrations locally first, backup production before deploy |

---

## 🎯 Success Criteria

- ✅ Summaries generated for all emails >200 words
- ✅ Summaries max 150 chars, readable, and accurate
- ✅ Label suggestions with >75% accuracy
- ✅ High confidence labels (>85%) can be auto-applied
- ✅ UI displays summaries and suggestions prominently
- ✅ All tests passing (unit + E2E)
- ✅ Production build successful
- ✅ API costs <$10/month for typical usage

---

## 💰 Cost Estimation

### OpenAI API Costs (gpt-4o-mini):

- **Input:** $0.150 per 1M tokens
- **Output:** $0.600 per 1M tokens

**Typical Email:**

- Input: ~500 tokens (email text + prompt)
- Output: ~50 tokens (summary or labels)

**Cost per email:** ~$0.00008 (0.008 cents)

**For 1000 emails/month:** ~$0.08
**For 10,000 emails/month:** ~$0.80

**Estimated monthly cost:** $1-10 depending on volume 💰

---

## 📝 Notes

- **AI Model Choice:** Start with gpt-4o-mini (fast, cheap), fallback to Gemini 2.5 Flash
- **Caching Strategy:** Cache results for 24 hours, regenerate on request
- **Batch Processing:** Process 10 emails at a time, wait 1s between batches (rate limit)
- **UI Design:** Subtle, non-intrusive, similar to Shortwave.ai's AI summaries

---

**Next Steps:** Proceed to database schema creation and migration
