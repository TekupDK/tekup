# 📊 Monitoring Setup Guide

## 🎯 Formål

Sæt op omfattende monitoring for RenOS production environment med UptimeRobot, Sentry, og interne health checks.

---

## 📋 Prerequisites

- RenOS deployed til production
- UptimeRobot account (gratis)
- Sentry account (optional)
- Redis service (optional)

---

## 🚀 Step 1: UptimeRobot Setup

### 1.1 Opret Account

1. Gå til: <https://uptimerobot.com>
2. Sign up for gratis account
3. Verify email address

### 1.2 Tilføj Monitors

#### Backend Health Monitor

- **Type:** HTTP(s)
- **Friendly Name:** RenOS Backend API
- **URL:** `https://tekup-renos.onrender.com/health`
- **Interval:** 5 minutes
- **Timeout:** 30 seconds

#### Frontend Monitor  

- **Type:** HTTP(s)
- **Friendly Name:** RenOS Frontend
- **URL:** `https://tekup-renos-1.onrender.com`
- **Interval:** 5 minutes
- **Timeout:** 30 seconds

#### Database Health Monitor

- **Type:** HTTP(s)
- **Friendly Name:** RenOS Database Health
- **URL:** `https://tekup-renos.onrender.com/api/monitoring/health`
- **Interval:** 5 minutes
- **Timeout:** 30 seconds

### 1.3 Setup Webhook

1. Gå til **Alert Contacts** → **Add Alert Contact**
2. Vælg **Webhook**
3. **Webhook URL:** `https://tekup-renos.onrender.com/api/uptime/webhook`
4. **Method:** POST
5. **Content Type:** application/json

---

## 🔧 Step 2: Sentry Error Tracking (Optional)

### 2.1 Opret Sentry Project

1. Gå til: <https://sentry.io>
2. Opret nyt project for Node.js
3. Kopiér DSN fra project settings

### 2.2 Konfigurer i Render

1. Gå til Render dashboard
2. Find **Environment** tab
3. Tilføj: `SENTRY_DSN=https://...`

---

## ⚡ Step 3: Redis Caching (Optional)

### 3.1 Opret Redis Service

1. Gå til Render dashboard
2. **New** → **Redis**
3. Vælg **Free** plan
4. Kopiér **Internal Redis URL**

### 3.2 Konfigurer i Backend

1. Gå til backend service environment
2. Tilføj: `REDIS_URL=redis://...`

---

## 🧪 Step 4: Test Monitoring

### 4.1 Test Health Endpoints

```bash
# Backend health
curl https://tekup-renos.onrender.com/health

# Database health  
curl https://tekup-renos.onrender.com/api/monitoring/health

# Metrics
curl https://tekup-renos.onrender.com/api/monitoring/metrics
```

### 4.2 Test UptimeRobot

1. Pause en monitor midlertidigt
2. Check at webhook modtages i RenOS logs
3. Resume monitor
4. Verify "Up" alert

### 4.3 Test Performance

```bash
# Run performance optimization
npm run optimize:performance

# Test caching
npm run test:frontend-integration
```

---

## 📊 Step 5: Monitoring Dashboard

### 5.1 UptimeRobot Dashboard

- **URL:** <https://uptimerobot.com/dashboard>
- **Features:** Uptime stats, response times, alerts
- **Alerts:** Email + webhook notifications

### 5.2 RenOS Health Dashboard

- **URL:** <https://tekup-renos.onrender.com/api/monitoring/health>
- **Features:** System health, database status, memory usage
- **Metrics:** Response times, error rates, uptime

### 5.3 Sentry Dashboard (Optional)

- **URL:** <https://sentry.io>
- **Features:** Error tracking, performance monitoring
- **Alerts:** Real-time error notifications

---

## 🚨 Alert Configuration

### Email Alerts

- **Down Alert:** Immediate (0 minutes)
- **Up Alert:** Immediate (0 minutes)  
- **Pause Alert:** 1 hour
- **Start Alert:** Immediate

### Webhook Alerts

- **Payload:** JSON med monitor details
- **Endpoint:** `/api/uptime/webhook`
- **Logging:** Automatisk logging i RenOS

---

## 📈 Expected Results

### Uptime Tracking

- **Target:** 99.9% uptime
- **Monitoring:** 24/7 automatic checks
- **Alerts:** Immediate notification ved issues

### Performance Monitoring

- **Response Times:** < 2 seconds
- **Database Queries:** < 500ms
- **Error Rate:** < 1%

### Error Tracking

- **Real-time:** Immediate error detection
- **Stack Traces:** Full error context
- **Performance:** Slow query detection

---

## 🔧 Troubleshooting

### Monitor Down Issues

1. **Check Service:** Verify RenOS is actually running
2. **Check URL:** Ensure correct endpoint URLs
3. **Check Timeout:** Increase timeout if needed
4. **Check Logs:** Review RenOS logs for errors

### Webhook Not Working

1. **Check Endpoint:** Verify webhook URL is correct
2. **Check Logs:** Look for webhook errors in RenOS
3. **Test Manually:** Send test webhook request
4. **Check CORS:** Ensure webhook endpoint accepts POST

### Performance Issues

1. **Check Redis:** Verify Redis connection
2. **Check Database:** Run performance optimization
3. **Check Memory:** Monitor memory usage
4. **Check Logs:** Review performance logs

---

## 📚 Related Documentation

- [Performance Optimization Status](../status/current/PERFORMANCE_OPTIMIZATION_STATUS.md)
- [Production Checklist](../deployment/status/PRODUCTION_CHECKLIST.md)
- [Health Check Endpoints](../features/integration/HEALTH_CHECK_ENDPOINTS.md)

---

**Status:** ✅ **READY FOR SETUP**  
**Estimated Time:** 30 minutes  
**Difficulty:** 🟢 Easy  
**Cost:** Free (up to 50 monitors)
