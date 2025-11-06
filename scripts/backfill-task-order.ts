/**
 * Backfill script: Set orderIndex for existing tasks based on createdAt per user
 *
 * This ensures deterministic ordering for tasks created before the orderIndex column was added.
 * Tasks with orderIndex=0 will be updated to have sequential indices based on creation time.
 *
 * Usage:
 *   pnpm tsx scripts/backfill-task-order.ts
 */

import { asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { tasks } from "../drizzle/schema";

async function backfillTaskOrder() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL not found in environment");
    process.exit(1);
  }

  console.log("🔄 Connecting to database...");

  // Parse DATABASE_URL to extract schema parameter (PostgreSQL doesn't accept schema in connection string)
  const parsedUrl = new URL(dbUrl);
  const schema = parsedUrl.searchParams.get("schema");

  // Remove schema from URL as postgres.js doesn't support it as query parameter
  if (schema) {
    parsedUrl.searchParams.delete("schema");
  }

  const connectionString = parsedUrl.toString();
  const client = postgres(connectionString);

  // If schema is specified, set search_path after connection
  if (schema) {
    await client`SET search_path TO ${client(schema)}`;
  }

  const db = drizzle(client);

  try {
    // Get all tasks grouped by userId, ordered by createdAt
    const allTasks = await db
      .select()
      .from(tasks)
      .orderBy(asc(tasks.userId), asc(tasks.createdAt));

    console.log(`📊 Found ${allTasks.length} total tasks`);

    // Group tasks by userId
    const tasksByUser = new Map<number, typeof allTasks>();
    for (const task of allTasks) {
      const userTasks = tasksByUser.get(task.userId) || [];
      userTasks.push(task);
      tasksByUser.set(task.userId, userTasks);
    }

    console.log(`👥 Processing tasks for ${tasksByUser.size} users`);

    let updatedCount = 0;

    // Process each user's tasks
    for (const [userId, userTasks] of tasksByUser.entries()) {
      console.log(`\n👤 User ${userId}: ${userTasks.length} tasks`);

      // Assign orderIndex based on creation order
      for (let i = 0; i < userTasks.length; i++) {
        const task = userTasks[i];
        const newOrderIndex = i;

        // Only update if orderIndex is different (avoid unnecessary writes)
        if (task.orderIndex !== newOrderIndex) {
          await db
            .update(tasks)
            .set({ orderIndex: newOrderIndex })
            .where(eq(tasks.id, task.id));

          updatedCount++;
          console.log(
            `  ✓ Task ${task.id}: "${task.title?.substring(0, 40)}..." → orderIndex=${newOrderIndex}`
          );
        }
      }
    }

    console.log(`\n✅ Backfill complete!`);
    console.log(`   Updated ${updatedCount} tasks`);
    console.log(
      `   Skipped ${allTasks.length - updatedCount} tasks (already correct)`
    );
  } catch (error) {
    console.error("❌ Backfill failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the backfill
backfillTaskOrder().catch(console.error);
