import { expect, test } from "@playwright/test";

/**
 * Test login flow and cookie behavior
 * Run: npx playwright test tests/login-cookie-test.ts --headed
 */

test.describe("Login Cookie Test", () => {
  test("should set app_session_id cookie after login", async ({
    page,
    context,
  }) => {
    // Enable detailed logging
    page.on("console", msg => console.log("BROWSER LOG:", msg.text()));
    page.on("request", request => {
      if (
        request.url().includes("/api/auth/login") ||
        request.url() === "http://localhost:3000/"
      ) {
        console.log("REQUEST:", request.method(), request.url());
        console.log("REQUEST COOKIES:", request.headers()["cookie"] || "none");
      }
    });
    page.on("response", async response => {
      if (
        response.url().includes("/api/auth/login") ||
        response.url() === "http://localhost:3000/"
      ) {
        console.log("RESPONSE:", response.status(), response.url());
        const setCookie = response.headers()["set-cookie"];
        console.log("SET-COOKIE HEADER:", setCookie || "none");
      }
    });

    // Step 1: Navigate to homepage
    console.log("\n=== STEP 1: Navigate to homepage ===");
    await page.goto("http://localhost:3000");
    await page.waitForLoadState("networkidle");

    // Take screenshot of initial state
    await page.screenshot({ path: "test-results/01-initial-load.png" });

    // Check initial cookies
    const initialCookies = await context.cookies();
    console.log(
      "\nInitial cookies:",
      initialCookies.map(c => c.name)
    );

    // Step 2: Find and click login button
    console.log("\n=== STEP 2: Click login button ===");
    const loginButton = page.getByRole("link", {
      name: /sign in to continue/i,
    });
    await expect(loginButton).toBeVisible();
    await page.screenshot({ path: "test-results/02-before-click.png" });

    await loginButton.click();

    // Step 3: Wait for navigation/redirect
    console.log("\n=== STEP 3: Wait for redirect ===");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "test-results/03-after-login.png" });

    // Step 4: Check cookies after login
    console.log("\n=== STEP 4: Verify cookies ===");
    const cookiesAfterLogin = await context.cookies();
    console.log(
      "\nCookies after login:",
      cookiesAfterLogin.map(c => ({
        name: c.name,
        value: c.value.substring(0, 20) + "...",
        domain: c.domain,
        path: c.path,
        httpOnly: c.httpOnly,
        sameSite: c.sameSite,
        secure: c.secure,
      }))
    );

    // Check for app_session_id cookie
    const sessionCookie = cookiesAfterLogin.find(
      c => c.name === "app_session_id"
    );

    if (sessionCookie) {
      console.log("\n✅ SUCCESS: app_session_id cookie found!");
      console.log("Cookie details:", {
        domain: sessionCookie.domain,
        path: sessionCookie.path,
        httpOnly: sessionCookie.httpOnly,
        sameSite: sessionCookie.sameSite,
        secure: sessionCookie.secure,
        expires: sessionCookie.expires,
      });
    } else {
      console.log("\n❌ FAILURE: app_session_id cookie NOT found!");
      console.log(
        "Available cookies:",
        cookiesAfterLogin.map(c => c.name)
      );
    }

    // Step 5: Check if we can access document.cookie (non-httpOnly cookies)
    console.log("\n=== STEP 5: Check document.cookie ===");
    const documentCookies = await page.evaluate(() => document.cookie);
    console.log("document.cookie:", documentCookies || "(empty)");

    // Step 6: Make a test request to see which cookies are sent
    console.log("\n=== STEP 6: Test API request ===");
    await page.goto("http://localhost:3000/");
    await page.waitForLoadState("networkidle");

    const finalCookies = await context.cookies();
    console.log(
      "\nFinal cookies sent to server:",
      finalCookies.map(c => c.name)
    );

    // Assertions
    expect(sessionCookie, "app_session_id cookie should be set").toBeDefined();
    expect(sessionCookie?.httpOnly).toBe(false); // Current setting
    expect(sessionCookie?.path).toBe("/");
    expect(sessionCookie?.sameSite).toBe("Lax");
  });

  test("should maintain session across page reloads", async ({
    page,
    context,
  }) => {
    console.log("\n=== Test: Session Persistence ===");

    // Login first
    await page.goto("http://localhost:3000");
    const loginButton = page.getByRole("link", {
      name: /sign in to continue/i,
    });
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForLoadState("networkidle");
    }

    // Get cookies after login
    const cookiesAfterLogin = await context.cookies();
    const sessionCookie = cookiesAfterLogin.find(
      c => c.name === "app_session_id"
    );
    console.log("Session cookie after login:", !!sessionCookie);

    // Reload page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Check if still logged in
    const cookiesAfterReload = await context.cookies();
    const sessionCookieAfterReload = cookiesAfterReload.find(
      c => c.name === "app_session_id"
    );
    console.log("Session cookie after reload:", !!sessionCookieAfterReload);

    expect(sessionCookieAfterReload).toBeDefined();
    expect(sessionCookieAfterReload?.value).toBe(sessionCookie?.value);
  });
});
