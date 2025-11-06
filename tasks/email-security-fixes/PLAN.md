# Email Security Fixes - Implementation Plan

**Task ID:** email-security-fixes
**Dato:** 5. november 2025
**Priority:** 🔴 CRITICAL
**Status:** In Progress

---

## 📋 Overview

Dette task adresserer **kritiske sikkerhedsproblemer** identificeret i `IMPROVEMENTS_PLAN.md` som truer systemets integritet trods 96% production-ready status.

### Problems Identified:

1. **HMAC Signature Verification mangler** → Email spoofing risk
2. **XSS Prevention mangler** → Cross-site scripting via email HTML
3. **Input Field Visibility Bug** → UX problem på visse skærme

---

## 🎯 Goals

- ✅ Implement HMAC SHA256 signature verification for inbound email webhooks
- ✅ Add Content-Security-Policy headers to email iframe rendering
- ✅ Fix chat input visibility bug with z-index/positioning review
- ✅ Ensure all security tests pass
- ✅ Document security best practices for future development

---

## 🔧 Technical Approach

### 1. HMAC Signature Verification

**File:** `server/src/services/inbound-email.ts`

**Current State:**

```typescript
// TODO: Verify HMAC signature from webhook
// Current: Accepts all incoming webhooks without validation
```

**Solution:**

```typescript
import crypto from "crypto";

function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const computed = hmac.digest("hex");

  // Timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
}

export async function handleInboundEmail(req: Request) {
  const signature = req.headers["x-webhook-signature"];
  const payload = JSON.stringify(req.body);

  if (!verifyHmacSignature(payload, signature, process.env.WEBHOOK_SECRET!)) {
    throw new Error("Invalid webhook signature");
  }

  // Continue processing...
}
```

**Environment Variable:**

- Add `WEBHOOK_SECRET` to `.env` (generate with `openssl rand -hex 32`)

---

### 2. XSS Prevention in Email HTML

**File:** `client/src/components/inbox/EmailIframeView.tsx`

**Current State:**

```typescript
<iframe
  srcDoc={emailHtml}
  className="w-full h-full"
/>
```

**Solution:**

```typescript
<iframe
  srcDoc={emailHtml}
  sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
  className="w-full h-full"
  title="Email content"
  csp="default-src 'none'; img-src https: data:; style-src 'unsafe-inline';"
/>
```

**Security Layers:**

1. **sandbox attribute:** Restricts iframe capabilities
   - `allow-same-origin`: Required for CID images
   - `allow-popups`: For mailto/external links
   - NO `allow-scripts`: Blocks JavaScript execution
2. **CSP headers:** Content-Security-Policy
   - `default-src 'none'`: Block all by default
   - `img-src https: data:`: Allow images (CID support)
   - `style-src 'unsafe-inline'`: Allow inline CSS (email formatting)

---

### 3. Input Field Visibility Bug

**Files to Review:**

- `client/src/components/chat/ChatInterface.tsx`
- `client/src/components/chat/ChatInput.tsx`
- Layout CSS (z-index conflicts)

**Investigation Steps:**

1. Check z-index hierarchy across components
2. Review fixed/sticky positioning
3. Test on different screen sizes (responsive issues?)
4. Verify inbox panel doesn't overlap chat input

**Likely Fix:**

```typescript
// ChatInput.tsx
<div className="sticky bottom-0 z-50 bg-white border-t">
  {/* Ensure z-index is higher than inbox panel (z-40) */}
  <textarea />
</div>
```

---

## 📁 Files to Modify

### Backend:

1. `server/src/services/inbound-email.ts` - Add HMAC verification
2. `server/src/middleware/webhook-auth.ts` - Create reusable middleware (NEW)
3. `.env.template.txt` - Add WEBHOOK_SECRET documentation

### Frontend:

1. `client/src/components/inbox/EmailIframeView.tsx` - Add CSP + sandbox
2. `client/src/components/chat/ChatInput.tsx` - Fix z-index layering
3. `client/src/components/chat/ChatInterface.tsx` - Review positioning

### Tests:

1. `tests/security/hmac-verification.spec.ts` - Test HMAC validation (NEW)
2. `tests/security/xss-prevention.spec.ts` - Test iframe sandboxing (NEW)
3. `tests/ui-smoke.spec.ts` - Update to verify input visibility

---

## 🧪 Testing Strategy

### 1. HMAC Verification Tests

```typescript
describe("HMAC Signature Verification", () => {
  it("should accept valid HMAC signature", async () => {
    const payload = { from: "test@example.com" };
    const signature = generateHmac(payload, WEBHOOK_SECRET);

    const response = await request(app)
      .post("/api/inbound/email")
      .set("x-webhook-signature", signature)
      .send(payload);

    expect(response.status).toBe(200);
  });

  it("should reject invalid HMAC signature", async () => {
    const payload = { from: "test@example.com" };
    const invalidSignature = "invalid-signature";

    const response = await request(app)
      .post("/api/inbound/email")
      .set("x-webhook-signature", invalidSignature)
      .send(payload);

    expect(response.status).toBe(401);
  });

  it("should reject missing HMAC signature", async () => {
    const response = await request(app)
      .post("/api/inbound/email")
      .send({ from: "test@example.com" });

    expect(response.status).toBe(401);
  });
});
```

### 2. XSS Prevention Tests

```typescript
describe("XSS Prevention in Email HTML", () => {
  it("should block JavaScript execution in iframe", async () => {
    const maliciousHtml = '<script>alert("XSS")</script>';

    await page.goto("/inbox");
    await page.click('[data-testid="email-item-1"]');

    // Verify script tag is not executed
    const alerts = [];
    page.on("dialog", dialog => alerts.push(dialog));

    await page.waitForTimeout(1000);
    expect(alerts).toHaveLength(0);
  });

  it("should allow safe HTML and images", async () => {
    const safeHtml = '<p>Hello</p><img src="data:image/png;base64,..." />';

    await page.goto("/inbox");
    await page.click('[data-testid="email-item-1"]');

    const iframe = await page.frameLocator('[title="Email content"]');
    await expect(iframe.locator("p")).toHaveText("Hello");
    await expect(iframe.locator("img")).toBeVisible();
  });
});
```

### 3. Input Visibility Tests

```typescript
describe("Chat Input Visibility", () => {
  it("should be visible on all screen sizes", async () => {
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 1366, height: 768 }, // Laptop
      { width: 768, height: 1024 }, // Tablet
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto("/");

      const input = await page.locator('[data-testid="chat-input"]');
      await expect(input).toBeVisible();

      // Verify input is not covered by inbox panel
      const inputBox = await input.boundingBox();
      expect(inputBox?.y).toBeGreaterThan(0);
    }
  });
});
```

---

## 📊 Implementation Steps

### Phase 1: HMAC Verification (1-2 timer)

1. [ ] Generate WEBHOOK_SECRET and add to `.env`
2. [ ] Create `webhook-auth.ts` middleware
3. [ ] Implement `verifyHmacSignature()` function
4. [ ] Add middleware to `/api/inbound/email` endpoint
5. [ ] Write unit tests for HMAC validation
6. [ ] Update `.env.template.txt` with documentation

### Phase 2: XSS Prevention (30-60 min)

1. [ ] Add `sandbox` attribute to iframe in `EmailIframeView.tsx`
2. [ ] Add CSP meta tag to iframe srcDoc
3. [ ] Test with malicious HTML samples
4. [ ] Write Playwright tests for XSS prevention
5. [ ] Document security headers in code comments

### Phase 3: Input Visibility Fix (30-60 min)

1. [ ] Review z-index hierarchy in `ChatInput.tsx` and `ChatInterface.tsx`
2. [ ] Test on different screen sizes
3. [ ] Fix positioning conflicts with inbox panel
4. [ ] Add responsive tests to `ui-smoke.spec.ts`
5. [ ] Verify fix across all browsers (Chrome, Firefox, Safari)

### Phase 4: Documentation & Validation (30 min)

1. [ ] Update `IMPROVEMENTS_PLAN.md` to mark security issues as resolved
2. [ ] Create `SECURITY.md` with best practices
3. [ ] Run all security tests (unit + E2E)
4. [ ] Production build validation
5. [ ] Update this PLAN.md → STATUS.md → CHANGELOG.md

---

## 🔗 Related Documents

- **Source Analysis:** `IMPROVEMENTS_PLAN.md` (Critical bugs section)
- **TODO List:** `todo.md` (Security TODOs)
- **Codebase Locations:**
  - `server/src/services/inbound-email.ts:42` (HMAC TODO)
  - `client/src/components/inbox/EmailIframeView.tsx:154` (XSS risk)

---

## ⚠️ Risks & Mitigations

| Risk                                      | Impact    | Mitigation                                             |
| ----------------------------------------- | --------- | ------------------------------------------------------ |
| Breaking inbound email flow               | 🔴 HIGH   | Test with valid/invalid signatures before deploy       |
| Iframe sandbox blocks legitimate features | 🟡 MEDIUM | Use minimal sandbox permissions + thorough testing     |
| Input visibility fix breaks other UI      | 🟡 MEDIUM | Test all chat/inbox interactions after z-index changes |
| WEBHOOK_SECRET leak                       | 🔴 HIGH   | Use environment variables, never commit to Git         |

---

## 🎯 Success Criteria

- ✅ All inbound emails verified with HMAC signature
- ✅ XSS attacks blocked in email HTML rendering
- ✅ Chat input visible on all screen sizes and browsers
- ✅ All security tests passing (unit + E2E)
- ✅ Production build successful
- ✅ Zero regressions in existing functionality
- ✅ Documentation updated with security best practices

---

## 📝 Notes

- **HMAC Algorithm:** SHA256 chosen for balance of security and performance
- **Timing-Safe Comparison:** Use `crypto.timingSafeEqual()` to prevent timing attacks
- **Sandbox Permissions:** Minimal permissions to reduce attack surface
- **CSP Headers:** Strict policy with only necessary exceptions for email rendering

---

**Next Steps:** Proceed to implementation of Phase 1 (HMAC Verification)
