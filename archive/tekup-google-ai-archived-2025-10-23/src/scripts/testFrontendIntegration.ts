import { logger } from "../logger";

/**
 * Test frontend integration with production backend
 */
async function testFrontendIntegration() {
  try {
    logger.info("Starting frontend integration tests");

    const baseUrl = "https://tekup-renos.onrender.com";
    const frontendUrl = "https://tekup-renos-1.onrender.com";

    // Test 1: Backend Health Check
    logger.info("Test 1: Backend Health Check");
    try {
      const healthResponse = await fetch(`${baseUrl}/health`);
      const healthData = await healthResponse.json();
      
      if (healthResponse.ok) {
        logger.info({ status: healthData.status }, "✅ Backend health check passed");
      } else {
        logger.error({ status: healthData.status }, "❌ Backend health check failed");
      }
    } catch (error) {
      logger.error({ error: error.message }, "❌ Backend health check error");
    }

    // Test 2: Dashboard API (without auth for now)
    logger.info("Test 2: Dashboard API");
    try {
      const dashboardResponse = await fetch(`${baseUrl}/api/dashboard/stats/overview`);
      const dashboardData = await dashboardResponse.json();
      
      if (dashboardResponse.ok) {
        logger.info({ 
          customers: dashboardData.customers,
          leads: dashboardData.leads,
          bookings: dashboardData.bookings 
        }, "✅ Dashboard API working");
      } else {
        logger.error({ error: dashboardData.error }, "❌ Dashboard API failed");
      }
    } catch (error) {
      logger.error({ error: error.message }, "❌ Dashboard API error");
    }

    // Test 3: Email Matching API
    logger.info("Test 3: Email Matching API");
    try {
      const emailMatchingResponse = await fetch(`${baseUrl}/api/email-matching/stats`);
      const emailMatchingData = await emailMatchingResponse.json();
      
      if (emailMatchingResponse.ok) {
        logger.info({ 
          totalThreads: emailMatchingData.stats.totalThreads,
          matchedThreads: emailMatchingData.stats.matchedThreads,
          matchRate: emailMatchingData.stats.matchRate
        }, "✅ Email matching API working");
      } else {
        logger.error({ error: emailMatchingData.error }, "❌ Email matching API failed");
      }
    } catch (error) {
      logger.error({ error: error.message }, "❌ Email matching API error");
    }

    // Test 4: Quote Sending API
    logger.info("Test 4: Quote Sending API");
    try {
      const testQuote = {
        to: "test@example.com",
        subject: "Integration Test Quote",
        body: "This is a test quote for integration testing.",
        leadId: "test-integration-123"
      };

      const quoteResponse = await fetch(`${baseUrl}/api/quotes/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testQuote)
      });
      
      const quoteData = await quoteResponse.json();
      
      if (quoteResponse.ok) {
        logger.info({ messageId: quoteData.data.messageId }, "✅ Quote sending API working");
      } else {
        logger.error({ error: quoteData.error }, "❌ Quote sending API failed");
      }
    } catch (error) {
      logger.error({ error: error.message }, "❌ Quote sending API error");
    }

    // Test 5: Monitoring API
    logger.info("Test 5: Monitoring API");
    try {
      const monitoringResponse = await fetch(`${baseUrl}/api/monitoring/health`);
      const monitoringData = await monitoringResponse.json();
      
      if (monitoringResponse.ok) {
        logger.info({ 
          status: monitoringData.status,
          database: monitoringData.database.status,
          uptime: monitoringData.uptime
        }, "✅ Monitoring API working");
      } else {
        logger.error({ error: monitoringData.error }, "❌ Monitoring API failed");
      }
    } catch (error) {
      logger.error({ error: error.message }, "❌ Monitoring API error");
    }

    // Test 6: Frontend Accessibility
    logger.info("Test 6: Frontend Accessibility");
    try {
      const frontendResponse = await fetch(frontendUrl);
      
      if (frontendResponse.ok) {
        logger.info("✅ Frontend is accessible");
      } else {
        logger.error({ status: frontendResponse.status }, "❌ Frontend not accessible");
      }
    } catch (error) {
      logger.error({ error: error.message }, "❌ Frontend accessibility error");
    }

    logger.info("Frontend integration tests completed");

  } catch (error) {
    logger.error({ error }, "Frontend integration test failed");
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  testFrontendIntegration()
    .then(() => {
      logger.info("Frontend integration tests completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      logger.error({ error }, "Frontend integration tests failed");
      process.exit(1);
    });
}

export { testFrontendIntegration };