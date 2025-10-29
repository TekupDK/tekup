const { Pool } = require("pg");

console.log("📝 Inserting test subcontractor data...\n");

const pool = new Pool({
  connectionString:
    "postgresql://postgres:Habibie12345%40@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false },
});

async function seedTestData() {
  try {
    // Check existing subcontractors
    const existing = await pool.query(
      "SELECT COUNT(*) FROM renos.subcontractors"
    );
    console.log(
      `Current subcontractors in database: ${existing.rows[0].count}`
    );

    if (existing.rows[0].count > 0) {
      console.log("✅ Test data already exists!\n");

      // Show existing data
      const subs = await pool.query(`
        SELECT id, company_name, contact_name, email, rating, status 
        FROM renos.subcontractors 
        ORDER BY created_at DESC 
        LIMIT 5
      `);

      console.log("📋 Existing subcontractors:");
      subs.rows.forEach((sub) => {
        console.log(
          `  - ${sub.company_name} (${sub.contact_name}) - Rating: ${sub.rating || "N/A"} - ${sub.status}`
        );
      });

      pool.end();
      return;
    }

    // Insert test subcontractor
    console.log("Creating test subcontractor: Bassimas Clean ApS\n");

    const result = await pool.query(`
      INSERT INTO renos.subcontractors (
        company_name, 
        contact_name, 
        email, 
        phone, 
        address, 
        city, 
        zip_code,
        status,
        rating,
        notes
      ) VALUES (
        'Bassimas Clean ApS',
        'Bassima Mohamed',
        'bassima@bassimasclean.dk',
        '+45 12 34 56 78',
        'Eksempelvej 123',
        'København',
        '2100',
        'active',
        4.5,
        'Specialiseret i dybderengøring og fraflytning. Meget pålidelig.'
      ) RETURNING *
    `);

    const subcontractorId = result.rows[0].id;
    console.log(`✅ Created subcontractor: ${result.rows[0].company_name}`);
    console.log(`   ID: ${subcontractorId}\n`);

    // Get available services
    const services = await pool.query(
      "SELECT id, name FROM renos.services LIMIT 3"
    );
    console.log(`Found ${services.rows.length} services to link\n`);

    // Link subcontractor to services
    for (const service of services.rows) {
      await pool.query(
        `
        INSERT INTO renos.subcontractor_services (subcontractor_id, service_id, hourly_rate)
        VALUES ($1, $2, $3)
      `,
        [subcontractorId, service.id, 250 + Math.floor(Math.random() * 100)]
      );

      console.log(`✅ Linked to service: ${service.name}`);
    }

    // Add test review
    console.log("\nAdding test review...");
    await pool.query(
      `
      INSERT INTO renos.subcontractor_reviews (
        subcontractor_id,
        job_id,
        rating,
        comment,
        created_by
      ) VALUES ($1, gen_random_uuid(), 5, 'Fantastisk arbejde! Meget grundig og professionel.', 'test-user')
    `,
      [subcontractorId]
    );

    console.log("✅ Added review\n");

    // Verify final state
    const final = await pool.query(
      `
      SELECT 
        s.company_name,
        s.rating,
        COUNT(DISTINCT ss.service_id) as service_count,
        COUNT(DISTINCT r.id) as review_count
      FROM renos.subcontractors s
      LEFT JOIN renos.subcontractor_services ss ON s.id = ss.subcontractor_id
      LEFT JOIN renos.subcontractor_reviews r ON s.id = r.subcontractor_id
      WHERE s.id = $1
      GROUP BY s.id, s.company_name, s.rating
    `,
      [subcontractorId]
    );

    const stats = final.rows[0];
    console.log("📊 Final verification:");
    console.log(`   Company: ${stats.company_name}`);
    console.log(`   Rating: ${stats.rating}`);
    console.log(`   Services: ${stats.service_count}`);
    console.log(`   Reviews: ${stats.review_count}`);

    console.log("\n🎉 Test data seeded successfully!\n");
  } catch (error) {
    console.error("❌ Error seeding data:", error.message);
    console.error(error);
  } finally {
    pool.end();
  }
}

seedTestData();
