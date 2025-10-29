#!/usr/bin/env node
/**
 * Quick introspection of renos.services using Supabase REST
 * Helps determine existing column types to align Prisma model safely.
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://oaevagdgrasfppbrxbey.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

(async () => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase
      .from("services")
      .select("id, name, category, default_price_dkk")
      .limit(3);

    if (error) {
      console.error("Error querying services:", error.message);
      process.exit(1);
    }

    console.log("Sample services rows:", data);
    if (data && data.length > 0) {
      const sample = data[0];
      console.log("\nDetected types:");
      console.log(" - id typeof:", typeof sample.id, "value:", sample.id);
      console.log(
        " - category typeof:",
        typeof sample.category,
        "value:",
        sample.category
      );
      console.log(
        " - default_price_dkk typeof:",
        typeof sample.default_price_dkk,
        "value:",
        sample.default_price_dkk
      );
    } else {
      console.log("No rows in services table to inspect.");
    }
  } catch (e) {
    console.error("Fatal:", e.message);
    process.exit(1);
  }
})();
