/**
 * Create a test user in Supabase for API testing
 * This user can then authenticate and test the subcontractor endpoints
 */

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://oaevagdgrasfppbrxbey.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg3Nzc2NCwiZXhwIjoyMDc1NDUzNzY0fQ.94lDERK4Enw8YTH_OtE9BpQhQWs8fg_7GZQGnYS8rNo";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createTestUser() {
  console.log("🔐 Creating test user for API testing...\n");

  const testEmail = "test@rendetalje.dk";
  const testPassword = "Test123456!";

  try {
    // Try to create user
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: "Test User",
        role: "admin",
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        console.log("✅ Test user already exists!\n");
        console.log("📧 Email:", testEmail);
        console.log("🔑 Password:", testPassword);
        console.log("\n💡 Use these credentials to get JWT token\n");
        return;
      }
      throw error;
    }

    console.log("✅ Test user created successfully!\n");
    console.log("📧 Email:", testEmail);
    console.log("🔑 Password:", testPassword);
    console.log("👤 User ID:", data.user.id);
    console.log("\n💡 Use these credentials to authenticate and test API\n");
  } catch (err) {
    console.error("❌ Error creating user:", err.message);
  }
}

createTestUser();
