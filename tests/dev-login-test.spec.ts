import { expect, test } from "@playwright/test";

test("Direct dev-login test", async ({ page, context }) => {
  console.log("🔧 Testing dev-login endpoint directly");

  // Gå direkte til dev-login (CORRECT endpoint: /api/auth/login)
  await page.goto("http://localhost:3000/api/auth/login");
  await page.waitForTimeout(2000);

  // Tag screenshot
  await page.screenshot({
    path: "test-results/dev-login-result.png",
    fullPage: true,
  });
  console.log("📸 Screenshot taken");

  // Tjek cookies
  const cookies = await context.cookies();
  console.log("🍪 All cookies:", JSON.stringify(cookies, null, 2));

  const appSessionCookie = cookies.find(c => c.name === "app_session_id");

  if (appSessionCookie) {
    console.log("✅ app_session_id cookie FOUND!");
    console.log("   Value:", appSessionCookie.value.substring(0, 30) + "...");
    console.log("   Domain:", appSessionCookie.domain);
    console.log("   Path:", appSessionCookie.path);
    console.log("   HttpOnly:", appSessionCookie.httpOnly);
    console.log("   Secure:", appSessionCookie.secure);
    console.log("   SameSite:", appSessionCookie.sameSite);
  } else {
    console.log("❌ app_session_id cookie NOT FOUND");
    console.log(
      "Available cookies:",
      cookies.map(c => c.name)
    );
  }

  // Nu skal vi gå til / og se om cookien sendes med
  console.log("\n🔄 Navigating to homepage...");
  await page.goto("http://localhost:3000/");
  await page.waitForLoadState("networkidle");

  // Tag screenshot af homepage
  await page.screenshot({
    path: "test-results/homepage-after-login.png",
    fullPage: true,
  });

  // Tjek om vi er logged in ved at se på siden
  const pageContent = await page.content();
  const isLoggedIn =
    !pageContent.includes("Sign in") && !pageContent.includes("Log in");

  console.log("🏠 Homepage loaded");
  console.log("   Is logged in?", isLoggedIn);

  // Tjek cookies igen efter navigation
  const finalCookies = await context.cookies();
  const finalAppSessionCookie = finalCookies.find(
    c => c.name === "app_session_id"
  );

  console.log(
    "🍪 Cookie still present after navigation?",
    !!finalAppSessionCookie
  );

  expect(finalAppSessionCookie).toBeDefined();
  console.log("\n✅ TEST PASSED: Cookie persists across navigation!");
});
