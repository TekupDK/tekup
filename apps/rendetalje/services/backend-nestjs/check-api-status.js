/**
 * Quick API status check without authentication
 * Shows which endpoints are available
 */

const baseUrl = "http://localhost:3000";

async function checkEndpoints() {
  console.log("🔍 API Endpoint Status Check\n");

  const endpoints = [
    { method: "GET", path: "/api/v1/health", desc: "Health check" },
    { method: "GET", path: "/api/v1/health/db", desc: "Database health" },
    {
      method: "POST",
      path: "/api/v1/auth/login",
      desc: "Login (test)",
      body: { email: "test@test.dk", password: "test" },
    },
    {
      method: "GET",
      path: "/api/v1/subcontractors",
      desc: "List subcontractors (requires auth)",
    },
    {
      method: "GET",
      path: "/api/v1/subcontractors/services",
      desc: "List services (requires auth)",
    },
  ];

  for (const endpoint of endpoints) {
    try {
      const options = {
        method: endpoint.method,
        headers: { "Content-Type": "application/json" },
      };

      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }

      const response = await fetch(`${baseUrl}${endpoint.path}`, options);

      const statusEmoji = response.ok
        ? "✅"
        : response.status === 401
          ? "🔒"
          : response.status === 404
            ? "❌"
            : "⚠️";

      console.log(`${statusEmoji} ${endpoint.method} ${endpoint.path}`);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Desc: ${endpoint.desc}`);

      if (response.status === 401) {
        console.log("   → Authentication required (expected)");
      } else if (response.status === 404) {
        console.log("   → Endpoint not found");
      } else if (!response.ok && response.status !== 401) {
        try {
          const error = await response.json();
          console.log(`   Error: ${error.message || JSON.stringify(error)}`);
        } catch (e) {
          console.log("   Error: Could not parse error response");
        }
      }

      console.log("");
    } catch (error) {
      console.log(`❌ ${endpoint.method} ${endpoint.path}`);
      console.log(`   Error: ${error.message}\n`);
    }
  }

  console.log("\n📊 Summary:");
  console.log("   ✅ = Working");
  console.log("   🔒 = Requires authentication (expected)");
  console.log("   ⚠️  = Error/unexpected status");
  console.log("   ❌ = Not found\n");
}

checkEndpoints();
