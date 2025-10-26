# 🚀 RenOS Go-Live Guide\n\n\n\n**Last Updated**: 30. September 2025

---
\n\n## 📋 Pre-Launch Checklist\n\n\n\n### Phase 1: Environment Setup ⚙️\n\n\n\n#### 1.1 Update Environment Variables\n\n\n\n```bash\n\n# Edit .env file:\n\nRUN_MODE=production  # ← Change from dry-run!\n\n\n\n# Verify critical variables exist:\n\nDATABASE_URL=postgresql://...\n\nGOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_IMPERSONATED_USER=info@rendetalje.dk
GEMINI_API_KEY=...\n\n```
\n\n#### 1.2 Verify Google Permissions\n\n\n\n```bash\n\nnpm run verify:google\n\n```

**Expected Output:**
\n\n```
✅ Gmail API: Working
✅ Calendar API: Working
✅ Domain-wide delegation: Active
✅ Impersonation: info@rendetalje.dk\n\n```
\n\n#### 1.3 Test Database Connection\n\n\n\n```bash\n\nnpm run db:migrate\n\n```

**Should show:**
\n\n```
✅ All migrations applied
✅ Database schema up to date\n\n```

---
\n\n### Phase 2: Controlled Testing 🧪\n\n\n\n#### 2.1 Test Lead Detection (LIVE Mode)\n\n\n\n```bash\n\nnpm run leads:check\n\n```

**What happens:**
\n\n- ✅ System reads REAL Gmail inbox\n\n- ✅ Detects Leadmail.no emails\n\n- ✅ Stores leads in database\n\n- ⚠️ NO emails sent yet (manual approval required)\n\n\n\n#### 2.2 Generate Test Email Response\n\n\n\n```bash\n\nnpm run email:test\n\n```

**What happens:**
\n\n- ✅ AI generates email response\n\n- ✅ Includes 3 booking time slots\n\n- ✅ Creates Gmail DRAFT (not sent!)\n\n- 💡 Shows you the email for review\n\n\n\n#### 2.3 Review Generated Email\n\n\n\nCheck Gmail web interface:
\n\n1. Go to <https://mail.google.com>\n\n2. Open "Drafts" folder\n\n3. Review the AI-generated email\n\n4. **Verify:**
   - ✅ Correct customer name\n\n   - ✅ Correct email address\n\n   - ✅ Accurate task description\n\n   - ✅ Reasonable pricing\n\n   - ✅ Valid booking times\n\n   - ✅ Professional tone\n\n\n\n#### 2.4 Send First LIVE Email (CAREFUL!)\n\n\n\n```bash\n\n# Only after reviewing draft!\n\nnpm run email:approve <leadId>\n\n```\n\n
**What happens:**
\n\n- ⚠️ Email is SENT to real customer\n\n- ✅ Logged in database\n\n- ✅ Draft removed from Gmail\n\n
---
\n\n### Phase 3: Monitoring Mode 📊\n\n\n\n#### 3.1 Start Continuous Monitoring\n\n\n\n```bash\n\n# Start monitoring (runs forever, checks every 5 minutes)\n\nnpm run leads:monitor\n\n```\n\n
**What this does:**
\n\n```
Every 5 minutes:
├── Check Gmail for new Leadmail.no emails
├── Parse lead details
├── Store in database
├── Generate email response (as DRAFT)
└── Wait for manual approval\n\n```

**Terminal output:**
\n\n```
🔍 Checking for new leads...
✅ Found 1 new lead: Nanna Henten
📧 Email draft created: lead-1999b22fa6f030d9
⏰ Next check in 5 minutes...\n\n```
\n\n#### 3.2 Monitor System Health\n\n\n\n**Open 3 terminals:**

**Terminal 1: Lead Monitoring**
\n\n```bash
npm run leads:monitor\n\n```

**Terminal 2: Email Stats**
\n\n```bash
watch -n 30 "npm run email:stats"\n\n```

**Terminal 3: Backend Server**
\n\n```bash
npm run dev\n\n```
\n\n#### 3.3 Check Dashboard\n\n\n\nOpen browser:
\n\n```
http://localhost:5173\n\n```

**Verify:**
\n\n- ✅ Dashboard shows real data\n\n- ✅ Lead count updates\n\n- ✅ Chat interface responds\n\n- ✅ No console errors\n\n
---
\n\n### Phase 4: Gradual Automation 🤖\n\n\n\n#### Option A: Manual Approval (Safest)\n\n\n\n```bash\n\n# Every time you see a new lead draft:\n\nnpm run email:pending           # See pending responses\n\nnpm run email:approve <leadId>  # Send specific email\n\n```\n\n
**Pros:**
\n\n- ✅ Full control over every email\n\n- ✅ Review pricing/booking times\n\n- ✅ Catch any AI mistakes\n\n
**Cons:**
\n\n- ⚠️ Requires manual intervention\n\n- ⚠️ Slower response time\n\n\n\n#### Option B: Auto-Approval (Advanced)\n\n\n\n```bash\n\n# Enable auto-approval for specific lead sources\n\nnpm run email:config --auto-approve=true --sources=Rengøring.nu\n\n```\n\n
**Pros:**
\n\n- ✅ Instant response to leads\n\n- ✅ No manual work\n\n
**Cons:**
\n\n- ⚠️ Less control\n\n- ⚠️ AI could make mistakes\n\n
**Recommendation:** Start with Option A for first 10-20 leads, then switch to Option B after you trust the system.\n\n
---
\n\n### Phase 5: Full Production 🚀\n\n\n\n#### 5.1 Deploy Backend to Render\n\n\n\n```bash\n\n# Your backend is already deployed!\n\n# URL: https://tekup-renos-backend.onrender.com\n\n\n\n# To redeploy:\n\ngit push origin main\n\n# Render auto-deploys from Git\n\n```\n\n\n\n#### 5.2 Deploy Frontend to Render\n\n\n\n```bash\n\ncd client
npm run build

git add .
git commit -m "Production build"
git push origin main
\n\n# Render auto-deploys frontend\n\n# URL: https://tekup-renos.onrender.com\n\n```\n\n\n\n#### 5.3 Setup Monitoring & Alerts\n\n\n\n**Option 1: Sentry (Error Tracking)**
\n\n1. Sign up: <https://sentry.io> (free tier)\n\n2. Create new project: "RenOS"\n\n3. Get DSN key\n\n4. Add to .env:

   ```
   SENTRY_DSN=https://...@sentry.io/...
   ```
\n\n5. Restart server

**Option 2: UptimeRobot (Uptime Monitoring)**
\n\n1. Sign up: <https://uptimerobot.com> (free)\n\n2. Add monitor: <https://tekup-renos-backend.onrender.com/api/dashboard>\n\n3. Set check interval: 5 minutes\n\n4. Add alert email: <din@email.dk>

**Option 3: Render Built-in Metrics**
\n\n1. Go to Render dashboard\n\n2. Click on your service\n\n3. View "Metrics" tab\n\n4. See CPU, memory, response times

---
\n\n## 🎯 Recommended Launch Strategy\n\n\n\n### **Week 1: Monitoring Mode** 📊\n\n\n\n```bash\n\n# Run this 24/7:\n\nnpm run leads:monitor\n\n\n\n# Manually approve each email:\n\nnpm run email:pending    # Check every 2-3 hours\n\nnpm run email:approve <leadId>\n\n```\n\n
**Goal:** Review 10-20 emails, build confidence in AI quality\n\n\n\n### **Week 2: Semi-Automatic** ⚡\n\n\n\n```bash\n\n# Auto-approve specific sources:\n\nnpm run email:config --auto-approve=true --sources=Rengøring.nu\n\n\n\n# Still manually review others\n\n```\n\n
**Goal:** 50% automation, faster response times\n\n\n\n### **Week 3: Full Automation** 🤖\n\n\n\n```bash\n\n# Auto-approve all quality leads:\n\nnpm run email:enable\n\n\n\n# System now runs fully autonomous!\n\n```\n\n
**Goal:** 95%+ automation, only review edge cases\n\n
---
\n\n## 📊 Success Metrics to Track\n\n\n\n### Week 1 Metrics\n\n\n\n- ✅ Leads detected: Target 10+\n\n- ✅ Emails sent: Target 10+\n\n- ✅ Response rate: Target 30%+\n\n- ✅ Booking conversion: Target 5%+\n\n- ✅ AI quality score: Target 8/10+\n\n\n\n### Month 1 Metrics\n\n\n\n- 📧 Total leads: 50+\n\n- 💰 Revenue from leads: 10,000 kr+\n\n- ⭐ Customer satisfaction: 4+/5\n\n- 🤖 System uptime: 99%+\n\n
---
\n\n## 🚨 Troubleshooting\n\n\n\n### Problem: No Leads Detected\n\n\n\n```bash\n\n# Check Gmail connection:\n\nnpm run verify:google\n\n\n\n# Check lead query:\n\nnpm run data:gmail\n\n\n\n# Verify RUN_MODE:\n\necho $RUN_MODE  # Should be "production"\n\n```\n\n\n\n### Problem: Emails Not Sending\n\n\n\n```bash\n\n# Check drafts were created:\n\n# Go to Gmail → Drafts folder\n\n\n\n# Verify email:approve command:\n\nnpm run email:approve <correct-leadId>\n\n\n\n# Check logs:\n\nnpm run dev  # Watch terminal for errors\n\n```\n\n\n\n### Problem: Poor AI Email Quality\n\n\n\n```bash\n\n# Review generated emails:\n\nnpm run email:pending\n\n\n\n# Adjust prompts in:\n\nsrc/services/geminiService.ts\n\n\n\n# Test improvements:\n\nnpm run email:test-mock\n\n```\n\n\n\n### Problem: System Slow/Crashes\n\n\n\n```bash\n\n# Check cache:\n\nnpm run cache:stats\n\nnpm run cache:cleanup
\n\n# Check database:\n\nnpm run db:migrate\n\n\n\n# Check memory:\n\n# Render dashboard → Metrics\n\n```\n\n
---
\n\n## 🎓 Training Your Team\n\n\n\n### For Customer Service (Non-Technical)\n\n\n\n1. **How to check new leads:**
   - Open: <http://localhost:5173>\n\n   - Click "Dashboard" tab\n\n   - See "Leads" count\n\n\n\n2. **How to review pending emails:**
   - Click "Chat" tab\n\n   - Type: "Vis pending emails"\n\n   - Review AI responses\n\n\n\n3. **How to manually respond:**
   - Go to Gmail: <info@rendetalje.dk>\n\n   - Open "Drafts"\n\n   - Review & send manually\n\n\n\n### For Admin (Technical)\n\n\n\n1. **How to start system:**

   ```bash
   cd "C:\Users\empir\Tekup Google AI"
   npm run leads:monitor
   ```
\n\n2. **How to approve emails:**

   ```bash
   npm run email:pending
   npm run email:approve <leadId>
   ```
\n\n3. **How to check system health:**

   ```bash
   npm run cache:stats
   npm run email:stats
   npm run booking:stats
   ```

---
\n\n## 📞 Emergency Contacts\n\n\n\n### System Down?\n\n\n\n1. Check Render dashboard: <https://dashboard.render.com>\n\n2. View logs: Click service → "Logs" tab\n\n3. Restart: Click "Manual Deploy" → "Clear build cache & deploy"
\n\n### Google API Issues?\n\n\n\n1. Check console: <https://console.cloud.google.com>\n\n2. Verify quotas: APIs & Services → Quotas\n\n3. Check credentials: APIs & Services → Credentials
\n\n### Database Issues?\n\n\n\n1. Check Neon dashboard: <https://console.neon.tech>\n\n2. View connection: Click project → "Connection string"\n\n3. Check usage: Monitor → Usage

---
\n\n## ✅ Post-Launch Checklist\n\n\n\n### Day 1\n\n\n\n- [ ] Leads monitoring active\n\n- [ ] First email sent successfully\n\n- [ ] No system errors\n\n- [ ] Dashboard accessible\n\n\n\n### Week 1\n\n\n\n- [ ] 10+ emails sent\n\n- [ ] AI quality verified (8/10+)\n\n- [ ] Team trained on system\n\n- [ ] Monitoring alerts setup\n\n\n\n### Month 1\n\n\n\n- [ ] 50+ leads processed\n\n- [ ] 5+ bookings from leads\n\n- [ ] System uptime 99%+\n\n- [ ] Customer feedback positive\n\n
---
\n\n## 🎉 You're Ready\n\n\n\nRenOS is **production-ready** with a score of **9.2/10**.\n\n
**Start with:**
\n\n1. ✅ Switch RUN_MODE to production\n\n2. ✅ Run `npm run leads:monitor`\n\n3. ✅ Manually approve first 10 emails\n\n4. ✅ Gradually increase automation

**Good luck!** 🚀\n\n
---

**Need Help?**
\n\n- 📧 Check logs: `npm run dev`\n\n- 📊 View reports: `SYSTEM_HEALTH_REPORT.md`\n\n- 🎨 Frontend docs: `FRONTEND_ANALYSIS.md`\n\n- 📝 Next steps: `NEXT_STEPS.md`
