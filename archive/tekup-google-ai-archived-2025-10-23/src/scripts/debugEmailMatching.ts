import { prisma } from "../services/databaseService";
import { logger } from "../logger";

/**
 * Debug script to analyze email matching issues
 */
async function debugEmailMatching() {
  try {
    logger.info("Starting email matching debug analysis");

    // Get some unmatched threads
    const sampleUnmatchedThreads = await prisma.emailThread.findMany({
      where: { isMatched: false },
      select: {
        id: true,
        gmailThreadId: true,
        subject: true,
        snippet: true,
        participants: true,
        messageCount: true
      },
      take: 5
    });

    logger.info({
      unmatchedCount: sampleUnmatchedThreads.length
    }, "Found unmatched threads to analyze");

    for (const thread of sampleUnmatchedThreads) {
      logger.info({
        threadId: thread.id,
        subject: thread.subject,
        participants: thread.participants,
        participantsCount: thread.participants.length,
        snippet: thread.snippet.substring(0, 100),
        messageCount: thread.messageCount
      }, "Thread analysis");

      // Check if we have messages for this thread
      const messages = await prisma.emailMessage.findMany({
        where: { threadId: thread.id },
        select: { from: true, to: true },
        take: 3
      });

      logger.info({
        threadId: thread.id,
        messageCount: messages.length,
        messages: messages.map(m => ({
          from: m.from,
          to: m.to
        }))
      }, "Thread messages");

      // Try to extract emails from snippet
      if (thread.snippet) {
        const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
        const emailMatches = thread.snippet.match(emailRegex);
        
        logger.info({
          threadId: thread.id,
          snippetEmails: emailMatches || []
        }, "Emails found in snippet");
      }
    }

    // Get all customers
    const customers = await prisma.customer.findMany({
      select: { id: true, name: true, email: true }
    });

    logger.info({
      customerCount: customers.length,
      customers: customers.map(c => ({ id: c.id, name: c.name, email: c.email }))
    }, "Available customers for matching");

    // Check overall stats
    const totalThreads = await prisma.emailThread.count();
    const matchedThreads = await prisma.emailThread.count({
      where: { isMatched: true }
    });
    const totalUnmatchedThreads = totalThreads - matchedThreads;

    logger.info({
      totalThreads,
      matchedThreads,
      totalUnmatchedThreads,
      matchRate: totalThreads > 0 ? (matchedThreads / totalThreads * 100).toFixed(2) + "%" : "0%"
    }, "Overall email matching stats");

  } catch (error) {
    logger.error({ error }, "Email matching debug failed");
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  debugEmailMatching()
    .then(() => {
      logger.info("Email matching debug completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      logger.error({ error }, "Email matching debug failed");
      process.exit(1);
    });
}

export { debugEmailMatching };