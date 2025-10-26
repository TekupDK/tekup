import { prisma } from "../services/databaseService";
import { logger } from "../logger";

/**
 * Re-run email matching on existing unmatched threads
 * This script will try to match threads that have empty participants
 */
async function rerunEmailMatching() {
  logger.info("Starting email matching re-run for unmatched threads");

  try {
    // Get all unmatched threads
    const unmatchedThreads = await prisma.emailThread.findMany({
      where: { isMatched: false },
      select: {
        id: true,
        gmailThreadId: true,
        subject: true,
        snippet: true,
        participants: true,
        messageCount: true
      },
      take: 100 // Process first 100 for testing
    });

    logger.info({
      unmatchedCount: unmatchedThreads.length
    }, "Found unmatched threads to process");

    let matchedCount = 0;
    let updatedParticipantsCount = 0;

    for (const thread of unmatchedThreads) {
      logger.debug({
        threadId: thread.id,
        currentParticipants: thread.participants,
        messageCount: thread.messageCount
      }, "Processing thread");

      // Strategy 1: Try to get participants from email messages
      if (thread.participants.length === 0) {
        const messages = await prisma.emailMessage.findMany({
          where: { threadId: thread.id },
          select: { from: true, to: true }
        });

        const messageParticipants: string[] = [];

        for (const message of messages) {
          // Extract from field
          if (message.from) {
            const fromEmail = message.from.match(/<([^>]+)>/)?.[1] || 
                             message.from.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)?.[1];
            if (fromEmail && !messageParticipants.includes(fromEmail.toLowerCase())) {
              messageParticipants.push(fromEmail.toLowerCase());
            }
          }

          // Extract to field
          if (message.to && message.to.length > 0) {
            for (const toField of message.to) {
              const toEmail = toField.match(/<([^>]+)>/)?.[1] || 
                             toField.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)?.[1];
              if (toEmail && !messageParticipants.includes(toEmail.toLowerCase())) {
                messageParticipants.push(toEmail.toLowerCase());
              }
            }
          }
        }

        // Update thread with found participants
        if (messageParticipants.length > 0) {
          await prisma.emailThread.update({
            where: { id: thread.id },
            data: { participants: messageParticipants }
          });
          
          updatedParticipantsCount++;
          logger.debug({
            threadId: thread.id,
            participants: messageParticipants
          }, "Updated thread participants from message data");
        }
      }

      // Strategy 2: Try snippet-based matching
      if (thread.snippet) {
        const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
        const emailMatches = thread.snippet.match(emailRegex);

        if (emailMatches) {
          for (const email of emailMatches) {
            const customer = await prisma.customer.findFirst({
              where: { email: email.toLowerCase() },
            });

            if (customer) {
              await prisma.emailThread.update({
                where: { id: thread.id },
                data: {
                  customerId: customer.id,
                  isMatched: true,
                  matchedAt: new Date(),
                  matchedBy: "rerun_snippet_email",
                  confidence: 0.8,
                },
              });

              matchedCount++;
              logger.info({
                threadId: thread.id,
                customerId: customer.id,
                email: email
              }, "Thread matched to customer via snippet email (rerun)");

              break; // Found a match, move to next thread
            }
          }
        }
      }

      // Strategy 3: Try participant-based matching (if we found participants)
      const updatedThread = await prisma.emailThread.findUnique({
        where: { id: thread.id },
        select: { participants: true }
      });

      if (updatedThread && updatedThread.participants.length > 0) {
        for (const participant of updatedThread.participants) {
          const customer = await prisma.customer.findFirst({
            where: { email: participant },
          });

          if (customer) {
            await prisma.emailThread.update({
              where: { id: thread.id },
              data: {
                customerId: customer.id,
                isMatched: true,
                matchedAt: new Date(),
                matchedBy: "rerun_participant_email",
                confidence: 1.0,
              },
            });

            matchedCount++;
            logger.info({
              threadId: thread.id,
              customerId: customer.id,
              email: participant
            }, "Thread matched to customer via participant email (rerun)");

            break; // Found a match, move to next thread
          }
        }
      }
    }

    // Get final stats
    const finalStats = await prisma.emailThread.aggregate({
      _count: {
        _all: true,
        isMatched: true
      },
      where: { isMatched: true }
    });

    const totalUnmatched = await prisma.emailThread.count({
      where: { isMatched: false }
    });

    logger.info({
      processedThreads: unmatchedThreads.length,
      matchedInThisRun: matchedCount,
      updatedParticipants: updatedParticipantsCount,
      totalMatched: finalStats._count.isMatched,
      totalUnmatched: totalUnmatched
    }, "Email matching re-run completed");

  } catch (error) {
    logger.error({ error }, "Email matching re-run failed");
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  rerunEmailMatching()
    .then(() => {
      logger.info("Email matching re-run completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      logger.error({ error }, "Email matching re-run failed");
      process.exit(1);
    });
}

export { rerunEmailMatching };