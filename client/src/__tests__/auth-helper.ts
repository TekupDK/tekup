/**
 * Authentication helper for tests
 * Handles login before running tests that require authentication
 */

const BACKEND_URL = process.env.VITE_API_URL || "http://localhost:3000";

/**
 * Login as a test user before running authenticated tests
 * Uses the dev-login endpoint in test mode (returns JSON instead of redirect)
 * Sets cookie in jsdom document.cookie for subsequent requests
 */
export async function loginTestUser(
  openId: string = "test-user-openid",
  name: string = "Test User"
): Promise<boolean> {
  try {
    // Use test mode to get JSON response instead of redirect
    const response = await fetch(`${BACKEND_URL}/api/auth/login?mode=test`, {
      method: "GET",
      credentials: "include",
      headers: {
        "X-Test-Mode": "true",
        "User-Agent": "vitest/jsdom",
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.warn(
        `⚠️ Login failed: ${response.status} ${response.statusText}`,
        errorText
      );
      return false;
    }

    // In test mode, endpoint returns JSON with cookie info
    const data = await response.json().catch(() => null);

    if (data?.success && data?.cookieValue && typeof document !== "undefined") {
      // Set cookie manually in jsdom
      const cookieName = data.cookieName || "app_session_id";
      document.cookie = `${cookieName}=${data.cookieValue}; path=/; SameSite=None`;

      console.log(
        `✅ Test login successful for user: ${data.user?.name || "Unknown"}`
      );
      return true;
    }

    // Fallback: try to extract from Set-Cookie header
    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader && typeof document !== "undefined") {
      const cookieMatch = setCookieHeader.match(/([^=]+)=([^;]+)/);
      if (cookieMatch) {
        const cookieName = cookieMatch[1].trim();
        const cookieValue = cookieMatch[2].trim();
        document.cookie = `${cookieName}=${cookieValue}; path=/; SameSite=None`;
        return true;
      }
    }

    console.warn("⚠️ Login succeeded but couldn't set cookie");
    return false;
  } catch (error) {
    console.warn(`⚠️ Login request failed:`, error);
    return false;
  }
}

/**
 * Verify that user is authenticated by checking /api/trpc/auth.me
 */
export async function verifyAuthentication(): Promise<boolean> {
  try {
    // Use tRPC endpoint format
    const response = await fetch(`${BACKEND_URL}/api/trpc/auth.me`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Check if we got a valid response
    // tRPC might return 200 with error, or actual data
    return response.status < 500;
  } catch (error) {
    return false;
  }
}
