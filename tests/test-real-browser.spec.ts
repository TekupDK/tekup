import { expect, test } from "@playwright/test";

test("Login flow med rigtig browser", async ({ page, context }) => {
  // Lyt til alle cookies
  context.on("response", async response => {
    const setCookie = response.headers()["set-cookie"];
    if (setCookie) {
      console.log("🍪 Set-Cookie header:", setCookie);
    }
  });

  // Gå til localhost
  console.log("📍 Navigating to http://localhost:3000");
  await page.goto("http://localhost:3000");

  // Vent på at siden loader
  await page.waitForLoadState("networkidle");

  // Tag screenshot før login
  await page.screenshot({
    path: "test-results/1-before-login.png",
    fullPage: true,
  });
  console.log("📸 Screenshot: before-login");

  // Find og klik på Google Sign in
  const signInButton = page
    .getByRole("button", { name: /sign in|log in/i })
    .first();
  await signInButton.click();
  console.log("🖱️ Clicked sign in button");

  // Vent lidt
  await page.waitForTimeout(2000);

  // Tag screenshot efter klik
  await page.screenshot({
    path: "test-results/2-after-signin-click.png",
    fullPage: true,
  });
  console.log("📸 Screenshot: after-signin-click");

  // Tjek om vi blev redirected til OAuth eller om der er en dev-login
  const currentUrl = page.url();
  console.log("📍 Current URL:", currentUrl);

  // Hvis vi har en dev-login endpoint, brug den
  if (currentUrl.includes("localhost")) {
    // Prøv at gå direkte til dev-login
    console.log("🔧 Using dev-login endpoint");
    await page.goto("http://localhost:3000/api/oauth/dev-login");
    await page.waitForTimeout(1000);

    // Tjek cookies efter dev-login
    const cookies = await context.cookies();
    console.log("🍪 Cookies after dev-login:", cookies);

    const appSessionCookie = cookies.find(c => c.name === "app_session_id");
    if (appSessionCookie) {
      console.log("✅ app_session_id cookie found:", {
        value: appSessionCookie.value.substring(0, 20) + "...",
        domain: appSessionCookie.domain,
        path: appSessionCookie.path,
        httpOnly: appSessionCookie.httpOnly,
        secure: appSessionCookie.secure,
        sameSite: appSessionCookie.sameSite,
      });
    } else {
      console.log("❌ app_session_id cookie NOT found!");
      console.log(
        "Available cookies:",
        cookies.map(c => c.name)
      );
    }

    // Vent på redirect
    await page
      .waitForURL("http://localhost:3000/", { timeout: 5000 })
      .catch(() => {
        console.log("⚠️ No redirect happened, manually navigating");
      });
    await page.goto("http://localhost:3000/");
    await page.waitForLoadState("networkidle");
  }

  // Tag screenshot efter login
  await page.screenshot({
    path: "test-results/3-after-login.png",
    fullPage: true,
  });
  console.log("📸 Screenshot: after-login");

  // Tjek cookies igen
  const finalCookies = await context.cookies();
  console.log(
    "🍪 Final cookies:",
    finalCookies.map(c => c.name)
  );

  const finalAppSessionCookie = finalCookies.find(
    c => c.name === "app_session_id"
  );
  expect(finalAppSessionCookie).toBeDefined();
  console.log("✅ Login test completed successfully!");
});
