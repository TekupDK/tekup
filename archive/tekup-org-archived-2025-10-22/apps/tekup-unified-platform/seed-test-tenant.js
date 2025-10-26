const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Create a test tenant
  const tenant = await prisma.tenant.upsert({
    where: { domain: 'test.tekup.com' },
    update: {},
    create: {
      id: 'test-tenant',
      name: 'Test Tenant',
      domain: 'test.tekup.com',
      settings: JSON.stringify({ features: ['crm', 'leads', 'flow'] }),
      active: true,
    },
  });

  console.log('Created test tenant:', tenant);

  // Create a test user for the tenant
  const user = await prisma.user.upsert({
    where: { email: 'admin@test.tekup.com' },
    update: {},
    create: {
      email: 'admin@test.tekup.com',
      name: 'Test Admin',
      password: 'test-password-hash',
      roles: JSON.stringify(['admin']),
      tenantId: tenant.id,
    },
  });

  console.log('Created test user:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
