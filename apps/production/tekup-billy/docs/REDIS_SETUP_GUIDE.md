# 🔴 Redis Cloud Setup Guide

**Purpose:** Setup Redis infrastructure for Bull queue system (polling sync, bulk operations)  
**Date:** October 14, 2025  
**Status:** PENDING USER ACTION  

---

## 📋 **QUICK SETUP (5 minutes)**

### **Step 1: Create Redis Cloud Account**

1. Go to: **<https://redis.com/try-free/>**
2. Click "Get started free"
3. Sign up with Google/GitHub OR create account
4. **Plan:** Select **FREE** plan (30MB, perfect for our needs)
5. **Region:** Choose closest to your location
   - Europe: Frankfurt (eu-central-1)
   - US: Virginia (us-east-1)
   - Asia: Singapore (ap-southeast-1)

### **Step 2: Create Database**

1. After signup, click "Create database"
2. **Name:** `tekup-billy-queue`
3. **Cloud:** Select your cloud provider (AWS recommended)
4. **Region:** Same as above
5. **Modules:** None needed (just core Redis)
6. Click "Create database"

### **Step 3: Get Connection String**

1. Click on your new database
2. Find **"Public endpoint"** section
3. Copy the connection string (format: `redis://default:PASSWORD@HOST:PORT`)
4. Should look like: `redis://default:abc123def456@redis-12345.c1.us-east-1.redisenterprise.cloud:12345`

### **Step 4: Add to .env File**

Open `.env` file and add:

```env
# Redis Configuration (for Bull queue system)
REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_HOST:YOUR_PORT
```

**Example:**

```env
REDIS_URL=redis://default:abc123def456@redis-12345.c1.us-east-1.redisenterprise.cloud:12345
```

### **Step 5: Test Connection Locally**

Run this command in PowerShell:

```powershell
# Install redis-cli if not already installed
# Option 1: Using Chocolatey
choco install redis-cli

# Option 2: Using Scoop
scoop install redis-cli

# Option 3: Download from Redis website
# https://github.com/microsoftarchive/redis/releases

# Test connection
redis-cli -u $env:REDIS_URL ping
# Expected output: PONG
```

If you get `PONG`, Redis is ready! ✅

---

## 🧪 **ALTERNATIVE: Local Redis (Development Only)**

If you prefer local Redis for development:

### **Windows:**

```powershell
# Install Redis using Chocolatey
choco install redis-64

# Start Redis server
redis-server

# In .env file, use:
REDIS_URL=redis://localhost:6379
```

### **Docker:**

```powershell
# Run Redis in Docker
docker run -d -p 6379:6379 --name tekup-redis redis:alpine

# In .env file, use:
REDIS_URL=redis://localhost:6379
```

---

## ✅ **VERIFICATION CHECKLIST**

After setup, verify:

- [ ] Redis Cloud account created
- [ ] Database created and running
- [ ] Connection string copied
- [ ] REDIS_URL added to .env file
- [ ] Connection tested successfully (PONG response)
- [ ] Can connect from Node.js:

```javascript
// Test in Node.js (run this in project):
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

redis.ping().then(result => {
  console.log('Redis connected:', result); // Should print "PONG"
  redis.quit();
});
```

---

## 🔐 **SECURITY NOTES**

- ✅ Never commit REDIS_URL to Git (already in .gitignore)
- ✅ Use environment variables only
- ✅ Redis Cloud free tier has built-in TLS encryption
- ✅ Connection string includes authentication password
- ⚠️ Don't share your REDIS_URL publicly

---

## 📊 **REDIS USAGE IN v1.3.0**

Redis will be used for:

1. **Bull Queue System:**
   - Polling sync jobs (every 15 minutes)
   - Bulk import/export jobs (CSV processing)
   - Failed job retry logic

2. **Queue Names:**
   - `billy:sync-queue` - Polling sync jobs
   - `billy:bulk-queue` - CSV import/export jobs

3. **Expected Load:**
   - Sync jobs: 96 jobs/day (every 15 min)
   - Bulk jobs: ~10-20 jobs/day (user-triggered)
   - Memory usage: <10MB (well within 30MB free limit)

---

## 🚀 **NEXT STEPS**

After Redis is setup:

1. ✅ Update schema to add `billy_sync_status` table
2. ✅ Deploy updated schema to Supabase
3. ✅ Implement polling sync tool (Week 1 Day 1)
4. ✅ Test Bull queue with Redis connection

---

## 🆘 **TROUBLESHOOTING**

### **"Connection refused"**

- Check if REDIS_URL is correct
- Verify Redis Cloud database is running
- Check firewall/network settings

### **"Authentication failed"**

- Verify password in connection string
- Re-copy connection string from Redis Cloud dashboard

### **"Cannot find redis-cli"**

- Install redis-cli using Chocolatey or Scoop
- Or test connection directly in Node.js (see verification section)

---

**Status:** ⏸️ WAITING FOR USER TO COMPLETE SETUP  
**Time Required:** ~5 minutes  
**Blocker:** Need REDIS_URL before continuing to Week 1 implementation
