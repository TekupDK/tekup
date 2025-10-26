import { logger } from "../logger";

/**
 * UptimeRobot monitoring setup guide
 * This script provides instructions for setting up external monitoring
 */
async function setupUptimeMonitoring() {
  try {
    logger.info("Setting up UptimeRobot monitoring guide");

    const baseUrl = "https://tekup-renos.onrender.com";
    const frontendUrl = "https://tekup-renos-1.onrender.com";

    console.log(`
# 🚀 UptimeRobot Monitoring Setup Guide

## 1. Create UptimeRobot Account
- Go to: https://uptimerobot.com
- Sign up for free account
- Verify email address

## 2. Add Backend Monitoring
- **Monitor Type**: HTTP(s)
- **Friendly Name**: RenOS Backend API
- **URL**: ${baseUrl}/health
- **Monitoring Interval**: 5 minutes
- **Timeout**: 30 seconds
- **Alert Contacts**: Add your email

## 3. Add Frontend Monitoring
- **Monitor Type**: HTTP(s)
- **Friendly Name**: RenOS Frontend
- **URL**: ${frontendUrl}
- **Monitoring Interval**: 5 minutes
- **Timeout**: 30 seconds
- **Alert Contacts**: Add your email

## 4. Add Database Monitoring
- **Monitor Type**: HTTP(s)
- **Friendly Name**: RenOS Database Health
- **URL**: ${baseUrl}/api/monitoring/health
- **Monitoring Interval**: 5 minutes
- **Timeout**: 30 seconds
- **Alert Contacts**: Add your email

## 5. Add API Endpoint Monitoring
- **Monitor Type**: HTTP(s)
- **Friendly Name**: RenOS Dashboard API
- **URL**: ${baseUrl}/api/dashboard/stats/overview
- **Monitoring Interval**: 10 minutes
- **Timeout**: 30 seconds
- **Alert Contacts**: Add your email

## 6. Setup Webhook Notifications
- Go to: https://uptimerobot.com/dashboard.php#mySettings
- Click "Alert Contacts" → "Add Alert Contact"
- Choose "Webhook" as contact type
- **Webhook URL**: ${baseUrl}/api/uptime/webhook
- **Friendly Name**: RenOS Webhook
- **Method**: POST
- **Content Type**: application/json

## 7. Configure Alert Thresholds
- **Down Alert**: Immediate (0 minutes)
- **Up Alert**: Immediate (0 minutes)
- **Pause Alert**: 1 hour
- **Start Alert**: Immediate

## 8. Test Monitoring
Run these commands to test endpoints:

\`\`\`bash
# Test backend health
curl -s "${baseUrl}/health" | jq '.'

# Test frontend
curl -s "${frontendUrl}" | head -20

# Test database health
curl -s "${baseUrl}/api/monitoring/health" | jq '.'

# Test dashboard API
curl -s "${baseUrl}/api/dashboard/stats/overview" | jq '.'
\`\`\`

## 9. Monitor Setup Status
- Check all monitors are "Up" (green)
- Test webhook by pausing/resuming a monitor
- Verify email alerts are working
- Check webhook logs in RenOS

## 10. Advanced Configuration
- **SSL Certificate Monitoring**: Enable for HTTPS endpoints
- **Keyword Monitoring**: Add "RenOS" keyword check
- **Port Monitoring**: Monitor specific ports if needed
- **Custom HTTP Headers**: Add authentication headers if needed

## 📊 Expected Monitoring Results
- **Backend Health**: Should return {"status":"ok"}
- **Frontend**: Should return HTML page
- **Database Health**: Should return detailed health info
- **Dashboard API**: Should return JSON with stats

## 🚨 Alert Examples
- **Down Alert**: "RenOS Backend API is DOWN! (HTTP 500)"
- **Up Alert**: "RenOS Backend API is UP! (HTTP 200)"
- **Webhook**: JSON payload with monitor details

## 📈 Monitoring Benefits
- **99.9% Uptime Tracking**: Know when service is down
- **Performance Monitoring**: Track response times
- **Email Alerts**: Get notified immediately
- **Webhook Integration**: Automatic incident response
- **Historical Data**: Track uptime trends

## 🔧 Troubleshooting
- **Monitor Down**: Check if service is actually running
- **False Alerts**: Adjust timeout/interval settings
- **Webhook Not Working**: Check RenOS logs for errors
- **Email Not Received**: Check spam folder, verify email

---
**Status**: Ready for UptimeRobot setup
**Estimated Time**: 15 minutes
**Cost**: Free (up to 50 monitors)
    `);

    logger.info("UptimeRobot monitoring guide generated");

  } catch (error) {
    logger.error({ error }, "Failed to generate UptimeRobot guide");
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  setupUptimeMonitoring()
    .then(() => {
      logger.info("UptimeRobot monitoring guide completed");
      process.exit(0);
    })
    .catch((error) => {
      logger.error({ error }, "UptimeRobot monitoring guide failed");
      process.exit(1);
    });
}

export { setupUptimeMonitoring };