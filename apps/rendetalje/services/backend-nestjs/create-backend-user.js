/**
 * Create user in backend's renos_users table (not Supabase auth)
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:Habibie12345%40@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=renos&sslmode=require",
    },
  },
});

async function createUser() {
  try {
    console.log("🔐 Creating user in renos_users table...\n");

    const email = "test@rendetalje.dk";
    const password = "Test123456!";
    const name = "Test User";

    // Check if user exists
    const existingUser = await prisma.renosUser.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("⚠️  User already exists!");
      console.log("📧 Email:", existingUser.email);
      console.log("👤 Name:", existingUser.name);
      console.log("🔑 Role:", existingUser.role);
      console.log("✅ Active:", existingUser.isActive);
      console.log("🆔 ID:", existingUser.id);

      // Check password
      const isValid = await bcrypt.compare(password, existingUser.passwordHash);
      console.log(
        "\n🔒 Password validation:",
        isValid ? "✅ Match" : "❌ Mismatch"
      );

      return;
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.renosUser.create({
      data: {
        email,
        name,
        passwordHash,
        role: "ADMIN", // or 'EMPLOYEE', 'OWNER'
        isActive: true,
      },
    });

    console.log("✅ User created successfully!\n");
    console.log("📧 Email:", user.email);
    console.log("👤 Name:", user.name);
    console.log("🔑 Role:", user.role);
    console.log("🆔 ID:", user.id);
    console.log("🔒 Password: Test123456!");
    console.log("\n💡 You can now login with these credentials");
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.code) console.error("   Code:", error.code);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
