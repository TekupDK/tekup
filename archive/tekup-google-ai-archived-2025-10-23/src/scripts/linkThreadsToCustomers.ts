#!/usr/bin/env ts-node

/**
 * Manual Thread Linking Script
 * 
 * This script manually links email threads to customers based on email matching.
 * It's a quick fix for the Customer 360 functionality.
 */

import { prisma } from '../services/databaseService';
import { logger } from '../logger';

interface Customer {
  id: string;
  name: string;
  email: string | null;
}

interface Thread {
  id: string;
  gmailThreadId: string;
  subject: string;
  snippet: string;
  participants: string[];
  isMatched: boolean;
}

async function linkThreadsToCustomers() {
  try {
    logger.info('Starting manual thread linking process...');

    // Get all customers
    const customers = await prisma.customer.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    logger.info(`Found ${customers.length} customers`);

    // Get all unmatched threads
    const threads = await prisma.emailThread.findMany({
      where: { isMatched: false },
      select: {
        id: true,
        gmailThreadId: true,
        subject: true,
        snippet: true,
        participants: true,
        isMatched: true,
      },
      take: 100, // Process first 100 threads
    });

    logger.info(`Found ${threads.length} unmatched threads`);

    let matchedCount = 0;

    for (const thread of threads) {
      let matched = false;

      // Strategy 1: Match by participants
      for (const participant of thread.participants) {
        const customer = customers.find(c => c.email === participant);
        if (customer) {
          await prisma.emailThread.update({
            where: { id: thread.id },
            data: {
              customerId: customer.id,
              isMatched: true,
              matchedAt: new Date(),
              matchedBy: 'manual_participants',
              confidence: 1.0,
            },
          });

          logger.info(`Matched thread ${thread.id} to customer ${customer.name} via participants`);
          matched = true;
          matchedCount++;
          break;
        }
      }

      // Strategy 2: Match by snippet content (if not matched yet)
      if (!matched && thread.snippet) {
        const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
        const emailMatches = thread.snippet.match(emailRegex);
        
        if (emailMatches) {
          for (const email of emailMatches) {
            const customer = customers.find(c => c.email === email.toLowerCase());
            if (customer) {
              await prisma.emailThread.update({
                where: { id: thread.id },
                data: {
                  customerId: customer.id,
                  isMatched: true,
                  matchedAt: new Date(),
                  matchedBy: 'manual_snippet',
                  confidence: 0.8,
                },
              });

              logger.info(`Matched thread ${thread.id} to customer ${customer.name} via snippet`);
              matched = true;
              matchedCount++;
              break;
            }
          }
        }
      }

      // Strategy 3: Match by subject content (if not matched yet)
      if (!matched && thread.subject && thread.subject !== 'No Subject') {
        const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
        const emailMatches = thread.subject.match(emailRegex);
        
        if (emailMatches) {
          for (const email of emailMatches) {
            const customer = customers.find(c => c.email === email.toLowerCase());
            if (customer) {
              await prisma.emailThread.update({
                where: { id: thread.id },
                data: {
                  customerId: customer.id,
                  isMatched: true,
                  matchedAt: new Date(),
                  matchedBy: 'manual_subject',
                  confidence: 0.7,
                },
              });

              logger.info(`Matched thread ${thread.id} to customer ${customer.name} via subject`);
              matched = true;
              matchedCount++;
              break;
            }
          }
        }
      }
    }

    logger.info(`Manual linking completed. Matched ${matchedCount} threads.`);

    // Get updated stats
    const totalThreads = await prisma.emailThread.count();
    const matchedThreads = await prisma.emailThread.count({ where: { isMatched: true } });
    const unmatchedThreads = totalThreads - matchedThreads;

    logger.info(`Final stats: ${matchedThreads}/${totalThreads} threads matched (${unmatchedThreads} unmatched)`);

  } catch (error) {
    logger.error({ error }, 'Error in manual thread linking');
    throw error;
  }
}

// Run the script
if (require.main === module) {
  linkThreadsToCustomers()
    .then(() => {
      logger.info('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error({ error }, 'Script failed');
      process.exit(1);
    });
}

export { linkThreadsToCustomers };