/**
 * Test all subcontractor API endpoints with authentication
 */

const testEmail = "test@rendetalje.dk";
const testPassword = "Test123456!";
const baseUrl = "http://localhost:3000";

async function testEndpoints() {
  console.log("🧪 Testing Subcontractor API Endpoints\n");
  console.log("━".repeat(60));

  try {
    // 1. Login to get JWT token
    console.log("\n1️⃣ LOGIN");
    console.log("   POST /api/v1/auth/login");

    const loginResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      console.log("   ❌ Login failed:", error.message);
      console.log("   Status:", loginResponse.status);

      // Try to understand why
      if (loginResponse.status === 404) {
        console.log("\n   ⚠️  AUTH ENDPOINT NOT FOUND");
        console.log("   Backend may not have authentication module enabled");
        console.log("   Or endpoint path is different\n");
      }

      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.access_token || loginData.token;

    if (!token) {
      console.log("   ❌ No token in response:", loginData);
      return;
    }

    console.log("   ✅ Login successful!");
    console.log(`   Token: ${token.substring(0, 20)}...`);

    // 2. List all subcontractors
    console.log("\n2️⃣ LIST SUBCONTRACTORS");
    console.log("   GET /api/v1/subcontractors");

    const listResponse = await fetch(`${baseUrl}/api/v1/subcontractors`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!listResponse.ok) {
      console.log(`   ❌ Failed: ${listResponse.status}`);
      const error = await listResponse.json();
      console.log("   Error:", error.message);
      return;
    }

    const subcontractors = await listResponse.json();
    console.log(`   ✅ Found ${subcontractors.length} subcontractor(s)`);

    if (subcontractors.length > 0) {
      const first = subcontractors[0];
      console.log(`   📋 First: ${first.companyName} - ${first.contactName}`);
      console.log(`      Email: ${first.email}`);
      console.log(`      Rating: ${first.rating || "N/A"}`);
      console.log(`      Status: ${first.status}`);

      // 3. Get specific subcontractor
      console.log("\n3️⃣ GET SPECIFIC SUBCONTRACTOR");
      console.log(`   GET /api/v1/subcontractors/${first.id}`);

      const getResponse = await fetch(
        `${baseUrl}/api/v1/subcontractors/${first.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!getResponse.ok) {
        console.log(`   ❌ Failed: ${getResponse.status}`);
      } else {
        const detail = await getResponse.json();
        console.log("   ✅ Retrieved successfully");
        console.log(`   📊 Company: ${detail.companyName}`);
        console.log(`      Services: ${detail.services?.length || 0}`);
        console.log(`      Documents: ${detail.documents?.length || 0}`);
      }
    }

    // 4. Get services
    console.log("\n4️⃣ GET AVAILABLE SERVICES");
    console.log("   GET /api/v1/subcontractors/services");

    const servicesResponse = await fetch(
      `${baseUrl}/api/v1/subcontractors/services`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!servicesResponse.ok) {
      console.log(`   ❌ Failed: ${servicesResponse.status}`);
    } else {
      const services = await servicesResponse.json();
      console.log(`   ✅ Found ${services.length} services:`);
      services.slice(0, 5).forEach((s) => {
        console.log(`      - ${s.name} (${s.type})`);
      });
    }

    // 5. Create new subcontractor
    console.log("\n5️⃣ CREATE NEW SUBCONTRACTOR");
    console.log("   POST /api/v1/subcontractors");

    const newSubcontractor = {
      companyName: "Test Rengøring ApS",
      contactName: "Test Person",
      email: `test-${Date.now()}@example.dk`,
      phoneNumber: "+45 87 65 43 21",
      address: "Testvej 1",
      city: "Testby",
      zipCode: "8000",
      hourlyRate: 275,
      services: ["deep-cleaning"],
    };

    const createResponse = await fetch(`${baseUrl}/api/v1/subcontractors`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newSubcontractor),
    });

    if (!createResponse.ok) {
      console.log(`   ❌ Failed: ${createResponse.status}`);
      const error = await createResponse.json();
      console.log("   Error:", error.message);
    } else {
      const created = await createResponse.json();
      console.log("   ✅ Created successfully!");
      console.log(`   ID: ${created.id}`);
      console.log(`   Company: ${created.companyName}`);
    }

    console.log("\n━".repeat(60));
    console.log("🎉 API TEST COMPLETE!\n");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error);
  }
}

testEndpoints();
