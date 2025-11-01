# ✅ TestSprite Setup Checklist

## Pre-Flight Checklist

Følg denne checklist før TestSprite testing:

---

## 📋 Pre-Test Setup

### 1. Dependencies

- [ ] `npm install` kørt (alle packages installeret)
- [ ] Node.js version 20+ verificeret
- [ ] Ingen package errors

### 2. Server Configuration

- [ ] Port 3011 er ledig
- [ ] Environment variables sat (optional)
- [ ] Server kan starte uden fejl

### 3. TestSprite Files

- [x] ✅ `testsprite_tests/tmp/code_summary.json` oprettet
- [x] ✅ `testsprite_tests/tmp/prd_files/FRIDAY_AI_PRD.md` oprettet
- [x] ✅ `testsprite_tests/testsprite_backend_test_plan.json` genereret
- [x] ✅ `FRIDAY_AI_PRD.md` hovedfil oprettet

### 4. Documentation

- [x] ✅ `TESTSprite_README.md` - Komplet guide
- [x] ✅ `TESTSprite_CONFIG.md` - Quick config
- [x] ✅ `TEST_SPRITE_CHECKLIST.md` - Denne fil

---

## 🚀 Start Server

### Option 1: PowerShell Script

```powershell
.\START_SERVER.ps1
```

### Option 2: Batch File

```cmd
START_SERVER.bat
```

### Option 3: Manual

```bash
npm run dev
```

### Verify Server

```bash
curl http://localhost:3011/health
```

**Expected:** `{"ok":true}`

---

## 🎯 TestSprite Dashboard Setup

### Step 1: Basic Configuration

- [ ] Mode: **Backend** ✅
- [ ] Scope: **Codebase** ✅
- [ ] Authentication: **None** ✅

### Step 2: Server Connection

- [ ] Port: **3011** ✅
- [ ] Path: **/** ✅
- [ ] Full URL: `http://localhost:3011` ✅

### Step 3: Documentation

- [ ] Upload: `FRIDAY_AI_PRD.md` ✅
- [ ] OR upload: `r.plan.md` (fra rendetalje folder) ✅

### Step 4: Start Testing

- [ ] Click "Continue" i TestSprite
- [ ] Wait for test execution
- [ ] Review test report

---

## ✅ Post-Test Verification

### Expected Test Cases (5)

- [ ] TC001: Health Check API
- [ ] TC002: Lead Parser Test API
- [ ] TC003: Generate Reply API
- [ ] TC004: Approve and Send API
- [ ] TC005: Chat API

### Expected Files Generated

- [ ] `testsprite_tests/testsprite-mcp-test-report.md` (test rapport)
- [ ] `testsprite_tests/tmp/raw_report.md` (raw data)

---

## 🔧 Troubleshooting

### Server won't start?

1. Check port 3011: `netstat -ano | findstr :3011`
2. Check Node version: `node --version`
3. Reinstall: `rm -rf node_modules && npm install`

### TestSprite can't connect?

1. Verify server running: `curl http://localhost:3011/health`
2. Check firewall settings
3. Verify port 3011 is correct

### Tests failing?

1. Check server logs
2. Verify endpoints are accessible
3. Check TestSprite error messages

---

## 📊 Success Indicators

✅ Server starter uden fejl  
✅ `/health` responder korrekt  
✅ TestSprite kan connecte  
✅ Alle 5 tests kører  
✅ Test rapport genereres  
✅ Recommendations vises

---

## 🎉 Ready to Test!

Alt er nu klar. Start serveren og konfigurer TestSprite med indstillingerne ovenfor!

**Status:** ✅ **ALL SET FOR TESTSprite TESTING**
