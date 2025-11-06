import { expect, test } from "@playwright/test";

// This test intercepts the tRPC batch POST to /api/trpc and swaps the
// inbox.email.list result with a deterministic mock that includes
// hasAttachments=true, so the UI should render the paperclip icon.

test.describe("Email list UI", () => {
  test("shows paperclip for attachments and search placeholder", async ({
    page,
  }) => {
    await page.route("**/api/trpc", async (route, request) => {
      try {
        if (request.method() !== "POST") {
          return route.continue();
        }
        let batch: any;
        try {
          batch = request.postDataJSON();
        } catch {
          return route.continue();
        }
        if (!Array.isArray(batch)) {
          return route.continue();
        }

        // Fetch the real response so we can merge our mocked result for just the list call
        const realResponse = await route.fetch();
        const status = realResponse.status();
        const headers = realResponse.headers();
        let json: any;
        try {
          json = await realResponse.json();
        } catch {
          json = [];
        }

        // Build a deterministic mock thread with an attachment
        const now = new Date().toISOString();
        const mockedThreads = [
          {
            id: "thread-mock-1",
            snippet: "with attachment",
            messages: [
              {
                id: "msg-mock-1",
                threadId: "thread-mock-1",
                from: "Test <test@example.com>",
                to: "Me <me@example.com>",
                subject: "Has attachment",
                body: "Hello",
                bodyText: "Hello",
                date: now,
              },
            ],
            labels: [],
            unread: false,
            subject: "Has attachment",
            from: "Test <test@example.com>",
            date: now,
            hasAttachments: true,
          },
        ];

        // Merge: replace any inbox.email.list entry with our mocked result
        if (Array.isArray(json)) {
          json = json.map((entry: any, idx: number) => {
            const item = batch[idx];
            if (item?.path === "inbox.email.list") {
              return {
                id: entry?.id ?? item?.id ?? String(idx),
                result: { type: "data", data: mockedThreads },
              };
            }
            return entry;
          });
        }

        await route.fulfill({
          status,
          headers,
          body: JSON.stringify(json),
        });
      } catch (e) {
        // On any failure, fall back to the real request
        return route.continue();
      }
    });

    // Login first to obtain a dev session cookie
    await page.goto("/api/auth/login", { waitUntil: "load" });
    await page.waitForTimeout(500);

    // Go to the app (baseURL comes from playwright.config)
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Ensure we're on the Email view/tab if navigation is required in the UI
    const emailTab = page.getByRole("tab", { name: /^Email$/i });
    if (await emailTab.count().catch(() => 0)) {
      await emailTab
        .first()
        .click()
        .catch(() => {});
    } else {
      const emailLink = page.getByRole("link", { name: /^Email$/i });
      if (await emailLink.count().catch(() => 0)) {
        await emailLink
          .first()
          .click()
          .catch(() => {});
      }
    }

    // Wait a tick to allow list render
    await page.waitForLoadState("networkidle");

    // The Email panel should have a search input with this placeholder
    const searchInput = page.getByPlaceholder(
      "Søg emails, kontakter, labels..."
    );
    await expect(searchInput).toBeVisible({ timeout: 15000 });

    // Wait for the mocked list to render, then expect a paperclip indicator
    // We render the icon inside a <div title="Vedhæftet fil"> … <svg />
    const paperclip = page.getByTitle("Vedhæftet fil");
    await expect(paperclip.first()).toBeVisible({ timeout: 15000 });
  });
});
