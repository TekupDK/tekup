# ⏰ UptimeRobot Setup Guide - RenOS

## Quick Setup (15 minutter)

### Step 1: Create Account (3 min)
1. Go to: https://uptimerobot.com/signUp
2. Sign up med email eller Google account
3. Vælg **Free Plan**:
   - ✅ 50 monitors
   - ✅ 5-minute intervals
   - ✅ Email alerts
   - ✅ SMS alerts (limited)

### Step 2: Create Health Check Monitor (5 min)

#### Add Monitor:
1. Dashboard → Click **"+ Add New Monitor"**
2. Fill in:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** `RenOS Backend Health`
   - **URL:** `https://tekup-renos.onrender.com/health`
   - **Monitoring Interval:** 5 minutes (free tier)
   - **Monitor Timeout:** 30 seconds

3. **Advanced Settings:**
   - **Check Type:** GET request
   - **Keyword Check:** `"status":"ok"` (optional - checks response content)
   - **HTTP Method:** GET
   - **Post Value:** Leave empty

4. Click **"Create Monitor"**

### Step 3: Add Frontend Monitor (2 min)
Repeat process for frontend:
- **Friendly Name:** `RenOS Frontend`
- **URL:** `https://tekup-renos-1.onrender.com`
- **Monitoring Interval:** 5 minutes

### Step 4: Configure Alerts (5 min)

#### Email Alerts (Default):
1. Dashboard → "My Settings" → "Alert Contacts"
2. Verify your email is already added (auto-added on signup)
3. Test alert: Click "Test" button

#### Add SMS Alerts (Optional - paid feature):
1. Click "+ Add New Alert Contact"
2. Select "SMS"
3. Enter phone number: `+45 [your number]`
4. Verify SMS code
5. **Note:** Free plan allows limited SMS alerts

#### Alert Settings:
1. Go to each monitor
2. Click "Edit"
3. Scroll to "Alert Contacts To Notify"
4. Select contact methods:
   - ✅ Email (always on)
   - ✅ SMS (if configured)
5. Save

---

## 🔔 Alert Configuration Best Practices

### Alert When:
```
✅ Monitor goes DOWN (service unreachable)
✅ Monitor times out (>30 seconds)
✅ Status code is not 200/201/204
⚠️ Optional: Keyword not found (if using keyword check)
```

### Alert Frequency:
```
Free Plan: Every 5 minutes
Paid Plan: Every 1 minute (upgrade for faster detection)
```

### Don't Alert When:
```
❌ Maintenance mode (pause monitors during deployment)
❌ Expected downtime (set maintenance windows)
```

---

## 📊 UptimeRobot Dashboard Overview

### Key Metrics:
- **Uptime %:** Overall uptime percentage (aim for 99.9%)
- **Response Time:** Average response time (aim for <500ms)
- **Downtime Events:** Number of outages
- **Logs:** Detailed event history

### Useful Features:
- **Public Status Page:** Share uptime with customers (paid feature)
- **Response Time Charts:** Track performance over time
- **Downtime Alerts:** Get notified immediately
- **Maintenance Windows:** Schedule maintenance without alerts

---

## 🚨 What to Monitor

### Already Configured:
- ✅ Backend Health Check (`/health`)
- ✅ Frontend Availability

### Additional Monitors (Optional):
1. **API Endpoints:**
   - `/api/dashboard/customers` (check if API works)
   - `/api/dashboard/leads` (check lead system)

2. **Database Connectivity:**
   - Keyword check for database: `"status":"ok","database":"connected"`

3. **Email Service:**
   - Add custom endpoint: `/api/health/email`
   - Returns: `{"email":"working"}`

4. **Calendar Integration:**
   - Add custom endpoint: `/api/health/calendar`
   - Returns: `{"calendar":"working"}`

---

## 📧 Alert Example

### Email Alert Format:
```
Subject: [UptimeRobot] RenOS Backend Health is DOWN

Your monitor "RenOS Backend Health" is currently DOWN.
Monitor URL: https://tekup-renos.onrender.com/health
Reason: HTTP 503 - Service Unavailable
Time: 2025-10-06 17:00:00

This alert was created at 2025-10-06 17:00:05
```

### SMS Alert Format:
```
[UptimeRobot] RenOS Backend Health is DOWN
URL: tekup-renos.onrender.com/health
Reason: Timeout after 30s
```

---

## 🔧 Troubleshooting Common Issues

### False Positives:
**Problem:** Alert triggered but site is up  
**Solution:**
- Increase timeout from 30s to 60s
- Check if Render service is cold-starting (first request slow)
- Verify keyword check is not too strict

### Render Cold Start:
**Problem:** First request after inactivity takes >30s  
**Solution:**
- Upgrade Render plan to keep service always warm
- Or: Accept occasional false positives during cold starts
- Or: Increase timeout to 60s

### Too Many Alerts:
**Problem:** Getting alerts for every 5-minute check  
**Solution:**
- Alert only after 2 consecutive failures
- Set up "Alert When Down For" setting (e.g., 10 minutes)

---

## 💡 Pro Tips

### 1. Maintenance Mode:
Before deployment:
```
1. UptimeRobot → Select monitor
2. Click "Pause Monitoring"
3. Deploy to Render
4. Test manually
5. Resume monitoring
```

### 2. Render-Specific Settings:
```
Monitor Interval: 5 minutes (keeps Render warm on free plan)
Timeout: 60 seconds (Render cold start can be slow)
Keyword Check: Optional (use for extra validation)
```

### 3. Multiple Monitors:
```
✅ /health (overall health)
✅ / (frontend loads)
✅ /api/health (API works)
⚠️ Don't monitor too many - stay within 50 monitor limit
```

---

## 📈 Upgrade to Paid Plan?

### Free Plan Limitations:
- ✅ 50 monitors (more than enough for RenOS)
- ✅ 5-minute intervals (acceptable)
- ✅ Email alerts (unlimited)
- ⚠️ SMS alerts (very limited)
- ❌ 1-minute intervals
- ❌ Public status page

### When to Upgrade:
- Need faster detection (<5 minutes)
- Need unlimited SMS alerts
- Want public status page for customers
- Need advanced features (webhooks, integrations)

**Cost:** $7/month (Pro plan)

---

## ✅ Success Checklist

- [ ] UptimeRobot account created
- [ ] Backend health monitor configured
- [ ] Frontend availability monitor configured
- [ ] Email alerts verified
- [ ] SMS alerts configured (optional)
- [ ] Test alert received successfully
- [ ] Monitors showing "UP" status
- [ ] Response times looking good (<1s)

**Estimated time:** 15 minutter  
**Cost:** FREE (50 monitors, 5-min intervals)

---

## 🔗 Useful Links

- UptimeRobot Dashboard: https://uptimerobot.com/dashboard
- Documentation: https://blog.uptimerobot.com/
- Status API: https://uptimerobot.com/api/
- Pricing: https://uptimerobot.com/pricing/

---

## 🎯 Expected Results

### After Setup:
```
✅ 2 monitors active (backend + frontend)
✅ Email alerts configured
✅ 5-minute health checks running
✅ Dashboard showing uptime %
✅ Response time graphs visible
```

### Alert Flow:
```
1. Service goes down
2. UptimeRobot detects within 5 minutes
3. Email sent immediately
4. Dashboard shows "DOWN" status
5. Service comes back up
6. Email sent: "Service is UP"
7. Dashboard shows "UP" status
```

---

**Ready to start?** → https://uptimerobot.com/signUp 🚀
