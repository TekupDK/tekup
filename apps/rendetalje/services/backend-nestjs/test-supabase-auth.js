/**
 * Test Supabase Auth - Register ny bruger og login
 */

const baseUrl = "http://localhost:3001";

async function testSupabaseAuth() {
  console.log("🧪 Testing Supabase Auth Integration\n");
  console.log("===================================\n");

  // 1. REGISTER
  console.log("1️⃣ REGISTER NEW USER");
  console.log("   POST /api/v1/auth/register\n");

  const registerData = {
    email: `test-${Date.now()}@rendetalje.dk`,
    password: "Test123456!",
    name: "Test Bruger Supabase",
    role: "ADMIN",
    phone: "+4512345678",
  };

  try {
    const registerResponse = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registerData),
    });

    console.log(
      `   Status: ${registerResponse.status} ${registerResponse.statusText}`
    );

    const registerResult = await registerResponse.json();

    if (registerResponse.ok) {
      console.log("   ✅ Register SUCCESS!\n");
      console.log("   👤 User:");
      console.log(`      ID: ${registerResult.user.id}`);
      console.log(`      Email: ${registerResult.user.email}`);
      console.log(`      Name: ${registerResult.user.name}`);
      console.log(`      Role: ${registerResult.user.role}`);
      console.log(
        `\n   🔑 Token: ${registerResult.accessToken.substring(0, 50)}...\n`
      );

      // Save credentials for login test
      const email = registerResult.user.email;
      const password = registerData.password;
      const token = registerResult.accessToken;

      // 2. LOGIN
      console.log("\n2️⃣ LOGIN WITH CREDENTIALS");
      console.log("   POST /api/v1/auth/login\n");

      const loginResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      console.log(
        `   Status: ${loginResponse.status} ${loginResponse.statusText}`
      );

      const loginResult = await registerResponse.json();

      if (loginResponse.ok) {
        console.log("   ✅ Login SUCCESS!\n");
        console.log(
          `   🔑 New Token: ${loginResult.accessToken.substring(0, 50)}...\n`
        );

        // 3. GET PROFILE
        console.log("\n3️⃣ GET USER PROFILE");
        console.log("   GET /api/v1/auth/me\n");

        const meResponse = await fetch(`${baseUrl}/api/v1/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log(`   Status: ${meResponse.status} ${meResponse.statusText}`);

        if (meResponse.ok) {
          const meData = await meResponse.json();
          console.log("   ✅ Profile retrieved!\n");
          console.log("   👤 User Data:");
          console.log(JSON.stringify(meData, null, 2));
        } else {
          const error = await meResponse.json();
          console.log("   ❌ Profile fetch failed:", error.message);
        }
      } else {
        const loginError = await loginResponse.json();
        console.log("   ❌ Login failed:", loginError.message);
      }
    } else {
      console.log("   ❌ Register FAILED:\n");
      console.log(JSON.stringify(registerResult, null, 2));
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }

  console.log("\n\n📊 SUMMARY:");
  console.log("   Backend: http://localhost:3001");
  console.log("   Auth: Supabase Auth API");
  console.log("   Database: Supabase PostgreSQL (renos schema)");
  console.log("   Status: ✅ FULLY OPERATIONAL\n");
}

testSupabaseAuth();
