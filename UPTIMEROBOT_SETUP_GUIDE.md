# 🔔 UptimeRobot Setup Guide

**Date:** October 24, 2025  
**Purpose:** Configure uptime monitoring for all Tekup production services  
**Time Required:** 10-15 minutes

---

## 📋 Services to Monitor

### 1. Tekup Billy MCP Server

- **URL:** `https://tekup-billy.onrender.com/health`
- **Expected Response:** 200 OK with JSON health status
- **Critical:** Yes - MCP integration for Billy.dk

### 2. TekupVault API

- **URL:** `https://tekupvault.onrender.com/health`
- **Expected Response:** 200 OK
- **Critical:** Yes - Knowledge base for all projects

### 3. Rendetalje Backend

- **URL:** `https://renos-backend.onrender.com/health`
- **Expected Response:** 200 OK with services status
- **Critical:** Yes - Main RenOS API

---

**Note:** Calendar MCP and other services are not yet deployed to production.

---

## 🚀 Setup Steps

### Step 1: Create UptimeRobot Account

1. Go to: https://uptimerobot.com/signUp
2. Sign up with: `jonas@tekup.dk` (or your email)
3. Verify email
4. Login

### Step 2: Add Monitors

For each service above:

1. **Click "Add New Monitor"**

2. **Configure:**

   - Monitor Type: `HTTP(s)`
   - Friendly Name: `Tekup Billy MCP` (or service name)
   - URL: `https://tekup-billy.onrender.com/health`
   - Monitoring Interval: `5 minutes`
   - Monitor Timeout: `30 seconds`

3. **Alert Contacts:**

   - Add your email
   - Alert When: `Down`
   - Alert After: `1 minute` (1 failed check)

4. **Advanced Settings:**

   - HTTP Method: `GET`
   - Expected Status Code: `200`
   - Keyword (optional): `"status":"ok"` or `"healthy":`

5. **Click "Create Monitor"**

6. **Repeat for all services**

---

## 📊 Expected Configuration

```text
Monitor 1: Tekup Billy MCP
├─ URL: https://tekup-billy.onrender.com/health
├─ Interval: 5 minutes
├─ Timeout: 30 seconds
└─ Alert: Email after 1 failure

Monitor 2: TekupVault API
├─ URL: https://tekupvault.onrender.com/health
├─ Interval: 5 minutes
├─ Timeout: 30 seconds
└─ Alert: Email after 1 failure

Monitor 3: Rendetalje Backend
├─ URL: https://renos-backend.onrender.com/health
├─ Interval: 5 minutes
├─ Timeout: 30 seconds
└─ Alert: Email after 1 failure
```
├─ Interval: 5 minutes
├─ Timeout: 30 seconds
└─ Alert: Email after 1 failure
```

---

## ✅ Verification

After setup, you should see:

1. **Dashboard:** All monitors showing "Up" (green)
2. **Response Times:** < 1000ms for all services
3. **Uptime:** 100% (if services are healthy)

**Test Alert:**

- Pause one monitor
- Wait 6 minutes
- You should receive email alert
- Resume monitor

---

## 🔗 Dashboard Access

**URL:** https://uptimerobot.com/dashboard  
**Account:** jonas@tekup.dk (or your email)

**Mobile App:** Available for iOS/Android

- Get push notifications
- Quick status checks
- Pause/resume monitors

---

## 📈 Benefits

✅ **Proactive Alerts** - Know about downtime before users do  
✅ **Response Time Tracking** - Monitor API performance  
✅ **Uptime Statistics** - 30-day, 60-day, yearly reports  
✅ **Status Page** - Public status page (optional)  
✅ **Free Tier** - Up to 50 monitors, 5-minute intervals

---

## 🛠️ Troubleshooting

### Monitor shows "Down" but service is up:

- Check URL is correct (include `/health`)
- Verify timeout isn't too short (increase to 60 seconds)
- Check expected status code (should be 200)

### Not receiving alerts:

- Verify email in Alert Contacts
- Check spam folder
- Test alert by pausing a monitor

### False positives:

- Increase "Alert After" to 2-3 failed checks
- Increase monitoring interval to 10 minutes

---

## 📝 Maintenance

**Weekly:**

- Check all monitors are green
- Review response time trends

**Monthly:**

- Review downtime incidents
- Adjust alert thresholds if needed

**Quarterly:**

- Add new services as deployed
- Remove retired services

---

**Status:** Ready to implement  
**Free Tier:** ✅ Sufficient for all Tekup services  
**Setup Time:** ~10 minutes for 4 monitors
