# Getting Started - Tekup Gmail Services

**Quick start guide til at komme i gang med Tekup Gmail Services**

---

## 📋 Prerequisites

### Required Software
- ✅ Python 3.8+ ([Download](https://www.python.org/downloads/))
- ✅ Node.js 18+ ([Download](https://nodejs.org/))
- ✅ Git ([Download](https://git-scm.com/))
- ✅ Docker & Docker Compose ([Download](https://www.docker.com/))

### Google Cloud Setup
- ✅ Google Cloud Project created
- ✅ Gmail API enabled
- ✅ Google Calendar API enabled (for RenOS services)
- ✅ Google Photos API enabled (for receipt processing)
- ✅ OAuth 2.0 credentials created

### API Keys (Optional - based on services you use)
- OpenAI API key (for AI email generation)
- Gemini API key (for AI email generation)
- Economic API key (for invoice integration)
- Supabase project (for RenOS services)

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Clone Repository
```bash
cd C:\Users\empir
cd tekup-gmail-services
```

### Step 2: Configure Environment
```bash
# Copy environment template
cp env.example .env

# Edit with your credentials
notepad .env
```

**Minimum required:**
```env
GMAIL_CLIENT_ID=your-client-id
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_PROJECT_ID=your-project-id
GMAIL_USER_EMAIL=your-email@gmail.com
```

### Step 3: Start with Docker
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

**Access Points:**
- MCP Server: http://localhost:3010
- RenOS Services: http://localhost:3011

---

## 📦 Service-Specific Setup

### A. Python Gmail Automation

#### 1. Install Dependencies
```bash
cd apps/gmail-automation
pip install -e .
```

#### 2. Configure
Add to `.env`:
```env
ECONOMIC_RECEIPT_EMAIL=receipts@e-conomic.com
ECONOMIC_API_KEY=your-economic-key
PROCESSED_LABEL=Videresendt_econ
DAYS_BACK=180
```

#### 3. Test
```bash
python -m src.core.gmail_forwarder
```

#### 4. Schedule (Optional)
```bash
# Run scheduler
python -m src.core.scheduler
```

---

### B. Gmail MCP Server

#### 1. Install Dependencies
```bash
cd apps/gmail-mcp-server
npm install
```

#### 2. Configure
MCP server uses Gmail credentials from root `.env`

#### 3. Test
```bash
npm start
```

#### 4. Verify
```bash
curl http://localhost:3010/health
```

---

### C. RenOS Gmail Services

#### 1. Install Dependencies
```bash
cd apps/renos-gmail-services
npm install
```

#### 2. Configure
Add to `.env`:
```env
OPENAI_API_KEY=sk-your-key
GEMINI_KEY=your-gemini-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### 3. Build
```bash
npm run build
```

#### 4. Test
```bash
npm run dev
```

#### 5. Verify
```bash
curl http://localhost:3011/health
```

---

## 🔐 Google Cloud Setup

### Step 1: Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Select **Desktop app** as application type
6. Download JSON file
7. Place in `config/google-credentials/`

### Step 2: Enable APIs

Enable these APIs in your Google Cloud project:
- Gmail API
- Google Calendar API
- Google Photos API (if using receipt processing)

### Step 3: Configure Domain-Wide Delegation (Optional)

For service account authentication:

1. Create a service account
2. Download service account JSON
3. Enable domain-wide delegation
4. Add required scopes in Google Workspace Admin:
   ```
   https://www.googleapis.com/auth/gmail.modify
   https://www.googleapis.com/auth/calendar.events
   https://www.googleapis.com/auth/photoslibrary.readonly
   ```

---

## 🧪 Testing Your Setup

### Test 1: Python Service
```bash
cd apps/gmail-automation
python -c "from src.core.gmail_forwarder import GmailPDFForwarder; print('✅ Import successful')"
```

### Test 2: MCP Server
```bash
cd apps/gmail-mcp-server
npm test
```

### Test 3: RenOS Services
```bash
cd apps/renos-gmail-services
npm run typecheck
```

### Test 4: Docker Compose
```bash
docker-compose up -d
docker-compose ps
# All services should show "Up"
```

---

## 📊 Verify Services Are Running

### Python Automation
```bash
# Check logs
tail -f apps/gmail-automation/logs/gmail_forwarder.log
```

### MCP Server
```bash
curl http://localhost:3010/health
# Expected: {"status": "ok"}
```

### RenOS Services
```bash
curl http://localhost:3011/health
# Expected: {"status": "healthy"}
```

---

## 🐛 Troubleshooting

### Issue: "Gmail API not enabled"
**Solution:** Enable Gmail API in Google Cloud Console

### Issue: "Invalid credentials"
**Solution:** 
1. Check `.env` file has correct credentials
2. Verify JSON file is in `config/google-credentials/`
3. Ensure file permissions are correct

### Issue: "Port already in use"
**Solution:** 
1. Check what's using the port: `netstat -ano | findstr :3010`
2. Kill the process or change port in `.env`

### Issue: "Module not found"
**Solution:**
```bash
# Python
cd apps/gmail-automation
pip install -e .

# Node.js
cd apps/gmail-mcp-server
npm install
```

### Issue: Docker build fails
**Solution:**
```bash
# Clean and rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

## 🎯 Next Steps

### Immediate
1. ✅ Services running
2. ✅ Environment configured
3. ⏭️ Read service-specific docs:
   - [Gmail Automation](GMAIL_AUTOMATION.md)
   - [MCP Server](MCP_SERVER.md)
   - [AI Email Generation](AI_EMAIL_GENERATION.md)

### Short Term (This Week)
4. ⏭️ Configure scheduled automation
5. ⏭️ Test email sending in dry-run mode
6. ⏭️ Setup monitoring and logging
7. ⏭️ Deploy to production

### Medium Term (This Month)
8. ⏭️ Optimize performance
9. ⏭️ Add custom integrations
10. ⏭️ Setup CI/CD pipeline
11. ⏭️ Implement additional features

---

## 📚 Additional Resources

### Documentation
- [Architecture Overview](ARCHITECTURE.md)
- [Deployment Guide](DEPLOYMENT.md)
- [API Documentation](API_DOCUMENTATION.md)

### Configuration
- [Environment Variables](../env.example)
- [Docker Compose](../docker-compose.yml)

### Support
- GitHub Issues (when published)
- Email: info@tekup.dk

---

## ✅ Quick Checklist

Setup checklist to verify everything is ready:

- [ ] Python 3.8+ installed
- [ ] Node.js 18+ installed
- [ ] Docker & Docker Compose installed
- [ ] Google Cloud project created
- [ ] Gmail API enabled
- [ ] OAuth credentials configured
- [ ] `.env` file created and configured
- [ ] Python dependencies installed
- [ ] Node.js dependencies installed (both services)
- [ ] Docker Compose tested
- [ ] All services accessible
- [ ] Logs show no errors

---

**Ready to Go!** 🚀

You're now ready to use Tekup Gmail Services. Check out the specific service documentation for detailed usage instructions.

---

**Last Updated:** 22. Oktober 2025  
**Version:** 1.0.0




