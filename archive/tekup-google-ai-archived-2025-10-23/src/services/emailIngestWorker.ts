import { google, gmail_v1 } from "googleapis";
import { prisma } from "./databaseService";
import { getGoogleAuthClient } from "./googleAuth";
import { logger } from "../logger";
import { searchThreads, listRecentMessages } from "./gmailService";

const gmailScopes = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify"
];

interface EmailIngestStats {
  totalThreads: number;
  newThreads: number;
  updatedThreads: number;
  matchedThreads: number;
  unmatchedThreads: number;
  errors: number;
  errorLog: string[];
}

export class EmailIngestWorker {
  private gmail: gmail_v1.Gmail | null = null;

  constructor() {
    const auth = getGoogleAuthClient(gmailScopes);
    if (auth) {
      this.gmail = google.gmail({ version: "v1", auth });
    }
  }

  /**
   * Main ingest function - fetches and processes all email threads
   */
  async runFullIngest(): Promise<EmailIngestStats> {
    logger.info("Starting full email ingest");

    // Create ingest run record
    const ingestRun = await prisma.emailIngestRun.create({
      data: {
        startedAt: new Date(),
        status: "running",
      },
    });

    const stats: EmailIngestStats = {
      totalThreads: 0,
      newThreads: 0,
      updatedThreads: 0,
      matchedThreads: 0,
      unmatchedThreads: 0,
      errors: 0,
      errorLog: [],
    };

    try {
      // Fetch all threads (in batches to avoid rate limits)
      const allThreads = await this.fetchAllThreads();
      stats.totalThreads = allThreads.length;

      logger.info({ threadCount: allThreads.length }, "Fetched email threads");

      // Process each thread
      for (const thread of allThreads) {
        try {
          await this.processThread(thread);
        } catch (error) {
          stats.errors++;
          stats.errorLog.push(`Thread ${thread.id}: ${error}`);
          logger.error({ threadId: thread.id, error }, "Failed to process thread");
        }
      }

      // Count matched vs unmatched
      const matchedCount = await prisma.emailThread.count({
        where: { isMatched: true },
      });

      const unmatchedCount = await prisma.emailThread.count({
        where: { isMatched: false },
      });

      stats.matchedThreads = matchedCount;
      stats.unmatchedThreads = unmatchedCount;

      // Update ingest run
      await prisma.emailIngestRun.update({
        where: { id: ingestRun.id },
        data: {
          finishedAt: new Date(),
          status: "completed",
          totalEmails: stats.totalThreads,
          newEmails: stats.newThreads,
          updatedEmails: stats.updatedThreads,
          errors: stats.errors,
          errorLog: stats.errorLog,
        },
      });

      logger.info({ stats }, "Email ingest completed successfully");
      return stats;

    } catch (error) {
      // Update ingest run with failure
      await prisma.emailIngestRun.update({
        where: { id: ingestRun.id },
        data: {
          finishedAt: new Date(),
          status: "failed",
          errors: stats.errors,
          errorLog: [...stats.errorLog, `Global error: ${error}`],
        },
      });

      logger.error({ error, stats }, "Email ingest failed");
      throw error;
    }
  }

  /**
   * Fetch all threads from Gmail with full message data
   */
  private async fetchAllThreads(): Promise<gmail_v1.Schema$Thread[]> {
    if (!this.gmail) {
      logger.debug("No Gmail client available, returning empty threads");
      return [];
    }

    const allThreads: gmail_v1.Schema$Thread[] = [];
    let nextPageToken: string | undefined;

    do {
      const response = await this.gmail.users.threads.list({
        userId: "me",
        maxResults: 500, // Max per request
        pageToken: nextPageToken,
        q: "has:attachment OR -label:draft", // Include threads with attachments, exclude drafts
      });

      if (response.data.threads) {
        // Fetch full thread data for each thread to get message details
        const threadPromises = response.data.threads.map(async (thread) => {
          if (!thread.id) return null;
          
          try {
            // Retry mechanism for Gmail API calls
            let retries = 3;
            let lastError;
            
            while (retries > 0) {
              try {
                const fullThread = await this.gmail!.users.threads.get({
                  userId: "me",
                  id: thread.id,
                  format: "full", // Get full thread data including messages
                });
                
                logger.debug({
                  threadId: thread.id,
                  messageCount: fullThread.data.messages?.length || 0
                }, "Successfully fetched full thread data");
                
                return fullThread.data;
              } catch (error) {
                lastError = error;
                retries--;
                
                if (retries > 0) {
                  logger.warn({
                    threadId: thread.id,
                    retriesLeft: retries,
                    error: error.message
                  }, "Gmail API call failed, retrying...");
                  
                  // Exponential backoff
                  await new Promise(resolve => setTimeout(resolve, 1000 * (3 - retries)));
                }
              }
            }
            
            logger.error({ threadId: thread.id, error: lastError }, "Failed to fetch full thread data after retries");
            return thread; // Fallback to basic thread data
          } catch (error) {
            logger.error({ threadId: thread.id, error }, "Unexpected error fetching thread data");
            return thread; // Fallback to basic thread data
          }
        });

        const fullThreads = await Promise.all(threadPromises);
        allThreads.push(...fullThreads.filter((t): t is gmail_v1.Schema$Thread => t !== null));
      }

      nextPageToken = response.data.nextPageToken || undefined;

      logger.debug({
        fetched: allThreads.length,
        nextPageToken: nextPageToken ? "exists" : "none"
      }, "Fetched thread batch with full data");

    } while (nextPageToken);

    return allThreads;
  }

  /**
   * Process a single thread
   */
  private async processThread(gmailThread: gmail_v1.Schema$Thread): Promise<void> {
    if (!gmailThread.id || !gmailThread.snippet) {
      return;
    }

    // Check if thread already exists
    const existingThread = await prisma.emailThread.findUnique({
      where: { gmailThreadId: gmailThread.id },
    });

    if (existingThread) {
      // Update existing thread
      await this.updateExistingThread(existingThread, gmailThread);
      return;
    }

    // Create new thread
    await this.createNewThread(gmailThread);
  }

  /**
   * Update existing thread with latest data
   */
  private async updateExistingThread(
    existing: any,
    gmailThread: gmail_v1.Schema$Thread
  ): Promise<void> {
    // For now, just update lastMessageAt if thread has messages
    if (gmailThread.messages && gmailThread.messages.length > 0) {
      const lastMessage = gmailThread.messages[gmailThread.messages.length - 1];
      const lastMessageDate = lastMessage.internalDate
        ? new Date(Number(lastMessage.internalDate))
        : new Date();

      await prisma.emailThread.update({
        where: { id: existing.id },
        data: {
          lastMessageAt: lastMessageDate,
          updatedAt: new Date(),
        },
      });
    }
  }

  /**
   * Create new thread from Gmail data
   */
  private async createNewThread(gmailThread: gmail_v1.Schema$Thread): Promise<void> {
    if (!gmailThread.id || !gmailThread.snippet) {
      return;
    }

    // Extract participants and subject
    const participants: string[] = [];
    let subject = "No Subject";

    if (gmailThread.messages && gmailThread.messages.length > 0) {
      const firstMessage = gmailThread.messages[0];

      // Extract subject from first message
      const subjectHeader = firstMessage.payload?.headers?.find(
        h => h.name?.toLowerCase() === "subject"
      );
      subject = subjectHeader?.value || "No Subject";

      // Extract participants from all messages
      for (const message of gmailThread.messages) {
        const headers = message.payload?.headers || [];
        
        // Debug logging
        logger.debug({
          messageId: message.id,
          headersCount: headers.length,
          hasPayload: !!message.payload
        }, "Processing message for participants");

        // Extract from FROM header
        const fromHeader = headers.find(h => h.name?.toLowerCase() === "from");
        if (fromHeader?.value) {
          const emails = this.extractEmailsFromHeader(fromHeader.value);
          emails.forEach(email => {
            if (!participants.includes(email)) {
              participants.push(email);
              logger.debug({ email, source: 'from' }, "Added participant from FROM header");
            }
          });
        }

        // Extract from TO header
        const toHeader = headers.find(h => h.name?.toLowerCase() === "to");
        if (toHeader?.value) {
          const emails = this.extractEmailsFromHeader(toHeader.value);
          emails.forEach(email => {
            if (!participants.includes(email)) {
              participants.push(email);
              logger.debug({ email, source: 'to' }, "Added participant from TO header");
            }
          });
        }

        // Extract from CC header
        const ccHeader = headers.find(h => h.name?.toLowerCase() === "cc");
        if (ccHeader?.value) {
          const emails = this.extractEmailsFromHeader(ccHeader.value);
          emails.forEach(email => {
            if (!participants.includes(email)) {
              participants.push(email);
              logger.debug({ email, source: 'cc' }, "Added participant from CC header");
            }
          });
        }

        // Extract from BCC header (if available)
        const bccHeader = headers.find(h => h.name?.toLowerCase() === "bcc");
        if (bccHeader?.value) {
          const emails = this.extractEmailsFromHeader(bccHeader.value);
          emails.forEach(email => {
            if (!participants.includes(email)) {
              participants.push(email);
              logger.debug({ email, source: 'bcc' }, "Added participant from BCC header");
            }
          });
        }
      }

      // Debug final participants
      logger.debug({
        threadId: gmailThread.id,
        participantsCount: participants.length,
        participants: participants
      }, "Final participants extracted");
    }

    // Create thread record
    const thread = await prisma.emailThread.create({
      data: {
        gmailThreadId: gmailThread.id,
        subject,
        snippet: gmailThread.snippet,
        lastMessageAt: gmailThread.messages?.length
          ? new Date(Number(gmailThread.messages[gmailThread.messages.length - 1].internalDate || Date.now()))
          : new Date(),
        participants,
        messageCount: gmailThread.messages?.length || 0,
        labels: [], // Could extract from Gmail labels if needed
      },
    });

    // Try to match thread to customer
    await this.matchThreadToCustomer(thread);

    // Create message records for each message in thread
    if (gmailThread.messages) {
      for (const gmailMessage of gmailThread.messages) {
        await this.createEmailMessage(thread.id, gmailMessage);
      }
    }
  }

  /**
   * Match thread to customer using various strategies
   */
  private async matchThreadToCustomer(thread: any): Promise<void> {
    // Strategy 1: Exact email match from participants
    for (const participant of thread.participants) {
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
            matchedBy: "exact_email",
            confidence: 1.0,
          },
        });

        logger.info({
          threadId: thread.id,
          customerId: customer.id,
          email: participant
        }, "Thread matched to customer via exact email");

        return;
      }
    }

    // Strategy 2: Match by snippet content (fallback for empty participants)
    if (thread.participants.length === 0 && thread.snippet) {
      logger.debug({
        threadId: thread.id,
        snippet: thread.snippet.substring(0, 100)
      }, "Attempting snippet-based matching due to empty participants");
      
      // Try to extract email from snippet
      const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
      const emailMatches = thread.snippet.match(emailRegex);
      
      if (emailMatches) {
        logger.debug({
          threadId: thread.id,
          emailMatches: emailMatches
        }, "Found emails in snippet");
        
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
                matchedBy: "snippet_email",
                confidence: 0.8,
              },
            });

            logger.info({
              threadId: thread.id,
              customerId: customer.id,
              email: email
            }, "Thread matched to customer via snippet email");

            return;
          }
        }
      }
    }

    // Strategy 2: Domain match for business customers
    for (const participant of thread.participants) {
      const emailDomain = participant.split('@')[1];
      if (emailDomain && !emailDomain.includes('gmail.com') && !emailDomain.includes('hotmail.com')) {
        // Look for customers with same domain (business emails)
        const customers = await prisma.customer.findMany({
          where: {
            email: {
              contains: `@${emailDomain}`,
            },
          },
        });

        if (customers.length === 1) {
          // Single match - likely the same company
          await prisma.emailThread.update({
            where: { id: thread.id },
            data: {
              customerId: customers[0].id,
              isMatched: true,
              matchedAt: new Date(),
              matchedBy: "domain",
              confidence: 0.8,
            },
          });

          logger.info({
            threadId: thread.id,
            customerId: customers[0].id,
            domain: emailDomain
          }, "Thread matched to customer via domain");

          return;
        }
      }
    }

    // Strategy 3: Try to get participants from email messages if thread participants is empty
    if (thread.participants.length === 0) {
      logger.debug({
        threadId: thread.id
      }, "Attempting to get participants from email messages");
      
      // Get all messages for this thread
      const messages = await prisma.emailMessage.findMany({
        where: { threadId: thread.id },
        select: { from: true, to: true }
      });
      
      const messageParticipants: string[] = [];
      
      for (const message of messages) {
        // Extract from field
        if (message.from) {
          const fromEmail = message.from.match(/<([^>]+)>/)?.[1] || message.from.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)?.[1];
          if (fromEmail && !messageParticipants.includes(fromEmail.toLowerCase())) {
            messageParticipants.push(fromEmail.toLowerCase());
          }
        }
        
        // Extract to field
        if (message.to && message.to.length > 0) {
          for (const toField of message.to) {
            const toEmail = toField.match(/<([^>]+)>/)?.[1] || toField.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)?.[1];
            if (toEmail && !messageParticipants.includes(toEmail.toLowerCase())) {
              messageParticipants.push(toEmail.toLowerCase());
            }
          }
        }
      }
      
      logger.debug({
        threadId: thread.id,
        messageParticipants: messageParticipants
      }, "Found participants from email messages");
      
      // Update thread with found participants
      if (messageParticipants.length > 0) {
        await prisma.emailThread.update({
          where: { id: thread.id },
          data: { participants: messageParticipants }
        });
        logger.debug({
          threadId: thread.id,
          participants: messageParticipants
        }, "Updated thread participants from message data");
      }
      
      // Try to match with these participants
      for (const participant of messageParticipants) {
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
              matchedBy: "message_email",
              confidence: 0.9,
            },
          });

          logger.info({
            threadId: thread.id,
            customerId: customer.id,
            email: participant
          }, "Thread matched to customer via message email");

          return;
        }
      }
    }

    // Strategy 4: Heuristic matching (name similarity, etc.)
    // For now, leave unmatched for manual review
    logger.debug({
      threadId: thread.id,
      participants: thread.participants
    }, "Thread left unmatched for manual review");
  }

  /**
   * Create email message record
   */
  private async createEmailMessage(
    threadId: string,
    gmailMessage: gmail_v1.Schema$Message
  ): Promise<void> {
    if (!gmailMessage.id) return;

    const headers = gmailMessage.payload?.headers || [];

    // Extract email data
    const fromHeader = headers.find(h => h.name?.toLowerCase() === "from");
    const toHeader = headers.find(h => h.name?.toLowerCase() === "to");
    const subjectHeader = headers.find(h => h.name?.toLowerCase() === "subject");

    const from = fromHeader?.value || "Unknown";
    const to = toHeader?.value ? [toHeader.value] : [];
    const subject = subjectHeader?.value || "No Subject";

    // Extract body
    let body = "";
    if (gmailMessage.payload) {
      body = this.extractEmailBody(gmailMessage.payload);
    }

    const sentAt = gmailMessage.internalDate
      ? new Date(Number(gmailMessage.internalDate))
      : new Date();

    // Determine direction (inbound if from external, outbound if from us)
    const fromEmail = from.match(/<([^>]+)>/)?.[1] || from;
    const isInbound = !fromEmail.includes("rendetalje.dk") && !fromEmail.includes("tekup");

    await prisma.emailMessage.create({
      data: {
        gmailMessageId: gmailMessage.id,
        gmailThreadId: gmailMessage.threadId || "",
        threadId,
        from,
        to,
        subject,
        body,
        bodyPreview: body.slice(0, 200),
        direction: isInbound ? "inbound" : "outbound",
        sentAt,
      },
    });
  }

  /**
   * Extract emails from email header value
   * Handles formats like: "Name <email@domain.com>", "email@domain.com", "Name1 <email1@domain.com>, Name2 <email2@domain.com>"
   */
  private extractEmailsFromHeader(headerValue: string): string[] {
    const emails: string[] = [];
    
    // Split by comma first to handle multiple recipients
    const parts = headerValue.split(',').map(part => part.trim());
    
    for (const part of parts) {
      // Try to match "Name <email@domain.com>" format first
      const angleMatch = part.match(/<([^>]+)>/);
      if (angleMatch) {
        const email = angleMatch[1].toLowerCase().trim();
        if (this.isValidEmail(email)) {
          emails.push(email);
        }
      } else {
        // Try to match plain email format
        const emailMatch = part.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch) {
          const email = emailMatch[1].toLowerCase().trim();
          if (this.isValidEmail(email)) {
            emails.push(email);
          }
        }
      }
    }
    
    return emails;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Extract email body from Gmail message payload
   */
  private extractEmailBody(payload: gmail_v1.Schema$MessagePart): string {
    let bodyText = "";

    // If this part has body data, decode it
    if (payload.body?.data) {
      bodyText += Buffer.from(payload.body.data, "base64").toString("utf-8");
    }

    // Recursively extract from nested parts
    if (payload.parts && payload.parts.length > 0) {
      for (const part of payload.parts) {
        const mimeType = part.mimeType?.toLowerCase();
        if (mimeType === "text/plain" || mimeType === "text/html") {
          bodyText += this.extractEmailBody(part);
        }
      }
    }

    return bodyText;
  }

  /**
   * Get ingest statistics
   */
  async getIngestStats(): Promise<any> {
    const latestRun = await prisma.emailIngestRun.findFirst({
      orderBy: { createdAt: "desc" },
    });

    const threadStats = await prisma.emailThread.aggregate({
      _count: true,
      where: { isMatched: true },
    });

    return {
      latestIngest: latestRun,
      totalThreads: await prisma.emailThread.count(),
      matchedThreads: threadStats._count,
      unmatchedThreads: await prisma.emailThread.count() - threadStats._count,
    };
  }
}

/**
 * Run email ingest worker
 */
export async function runEmailIngest(): Promise<EmailIngestStats> {
  const worker = new EmailIngestWorker();
  return await worker.runFullIngest();
}
