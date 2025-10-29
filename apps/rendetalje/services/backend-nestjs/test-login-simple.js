/**
 * Simple login test without Supabase - tests backend auth directly
 */

const baseUrl = "http://localhost:3000";

async function testLogin() {
  console.log("🔐 Testing Login Endpoint\n");

  // Test with our created user
  const loginData = {
    email: "test@rendetalje.dk",
    password: "Test123456!",
  };

  console.log("📤 Request:");
  console.log(`   POST ${baseUrl}/api/v1/auth/login`);
  console.log(`   Body: ${JSON.stringify(loginData, null, 2)}\n`);

  try {
    const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    console.log(`📥 Response: ${response.status} ${response.statusText}\n`);

    const data = await response.json();

    if (response.ok) {
      console.log("✅ LOGIN SUCCESS!\n");
      console.log("👤 User:", {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
      });
      console.log("\n🔑 Token:", data.accessToken.substring(0, 50) + "...");

      // Test token with /auth/me
      console.log("\n\n🧪 Testing Token with /auth/me...\n");
      const meResponse = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${data.accessToken}`,
        },
      });

      if (meResponse.ok) {
        const meData = await meResponse.json();
        console.log("✅ Token valid! User profile:", meData);
      } else {
        console.log("❌ Token validation failed:", await meResponse.text());
      }
    } else {
      console.log("❌ LOGIN FAILED\n");
      console.log("Error:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log("❌ ERROR:", error.message);
  }
}

testLogin();
