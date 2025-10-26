import { logger } from "../logger";

/**
 * Test script for quote sending endpoint
 */
async function testQuoteSending() {
  try {
    logger.info("Testing quote sending endpoint");

    const testQuote = {
      to: "test@example.com",
      subject: "Test Quote - Rengøringstjeneste",
      body: `Hej Test,

Tak for din henvendelse om rengøringstjeneste.

Vi kan tilbyde:
- Privatrengøring: 1,500 DKK
- Hovedrengøring: 2,500 DKK
- Flytterengøring: 3,000 DKK

Vil du have mig til at sende et tilbud?

Med venlig hilsen,
RenOS Team`,
      leadId: "test-lead-123"
    };

    const response = await fetch("https://tekup-renos.onrender.com/api/quotes/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Note: In production, this would need a valid Clerk token
        // "Authorization": "Bearer <clerk-token>"
      },
      body: JSON.stringify(testQuote)
    });

    const result = await response.json();

    if (response.ok) {
      logger.info({
        success: true,
        data: result.data,
        message: result.message
      }, "Quote sent successfully");
    } else {
      logger.error({
        success: false,
        error: result.error,
        details: result.details
      }, "Quote sending failed");
    }

  } catch (error) {
    logger.error({ error }, "Test quote sending failed");
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  testQuoteSending()
    .then(() => {
      logger.info("Quote sending test completed");
      process.exit(0);
    })
    .catch((error) => {
      logger.error({ error }, "Quote sending test failed");
      process.exit(1);
    });
}

export { testQuoteSending };