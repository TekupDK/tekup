# Quick Deploy Checklist

Hurtig tjekliste for deployment af RenOS Calendar MCP.

## Pre-Deployment (One-time Setup)

- [ ] **Install CLI tools**
  ```powershell
  cd renos-calendar-mcp
  ./scripts/install-cli-tools.ps1
  ```

- [ ] **Login to CLIs**
  ```powershell
  ./scripts/login-cli-tools.ps1
  ```

- [ ] **Setup secrets**
  - [ ] Copy `deployment/.secrets.example/*` to `deployment/.secrets/`
  - [ ] Fill in `google-private-key.txt`
  - [ ] Fill in `supabase-anon-key.txt`
  - [ ] Fill in `supabase-service-key.txt`
  - [ ] (Optional) Fill in Twilio credentials

## Deployment Steps

- [ ] **Build TypeScript**
  ```powershell
  npm run build
  ```
  Expected: `dist/` folder created, no errors

- [ ] **Deploy Supabase schema**
  ```powershell
  ./scripts/deploy-supabase.ps1
  ```
  Expected: 5 tables created (customer_preferences, booking_validations, overtime_logs, undo_actions, customer_satisfaction)

- [ ] **Commit to Git**
  ```bash
  git add .
  git commit -m "Add RenOS Calendar MCP deployment config"
  git push origin main
  ```

- [ ] **Deploy to Render** (Choose one method)

  **Method A: Blueprint (Recommended)**
  1. Go to <https://dashboard.render.com/>
  2. New → Blueprint
  3. Connect GitHub repo: Tekup-Cloud
  4. Render detects `render.yaml`
  5. Configure environment groups (see below)
  6. Deploy!

  **Method B: Manual**
  1. Follow instructions from: `./scripts/deploy-render.ps1`
  2. Create web service manually
  3. Create static site manually

## Environment Groups Setup (Render)

- [ ] **Create "RenOS Calendar MCP" group**
  - Go to Render → Settings → Environment Groups → New
  - Name: `RenOS Calendar MCP`
  - Add variables from `deployment/ENV_GROUP_1_CALENDAR.txt`
  - Save

- [ ] **Link "Tekup Database Environment" group**
  - In service settings → Environment
  - Click "Link Environment Group"
  - Select "Tekup Database Environment"
  - Save

## Post-Deployment Verification

- [ ] **Backend health check**
  ```powershell
  Invoke-RestMethod https://renos-calendar-mcp.onrender.com/health
  ```
  Expected: `{ "status": "ok", ... }`

- [ ] **Tools endpoint**
  ```powershell
  Invoke-RestMethod https://renos-calendar-mcp.onrender.com/tools
  ```
  Expected: 5 tools listed

- [ ] **Dashboard loads**
  ```powershell
  Invoke-WebRequest https://renos-calendar-dashboard.onrender.com
  ```
  Expected: HTTP 200

- [ ] **Full verification**
  ```powershell
  ./scripts/verify-deployment.ps1
  ```
  Expected: All tests PASS

## URLs

After successful deployment:

- **Backend**: <https://renos-calendar-mcp.onrender.com>
- **Dashboard**: <https://renos-calendar-dashboard.onrender.com>
- **Health**: <https://renos-calendar-mcp.onrender.com/health>
- **API Docs**: <https://renos-calendar-mcp.onrender.com/tools>

## Troubleshooting

### Build fails

- Check TypeScript errors: `npm run build`
- Fix linting: `npm run lint` (if configured)

### Supabase migration fails

- **Fallback**: Manual migration
  1. Go to <https://supabase.com/dashboard/project/oaevagdgrasfppbrxbey/editor>
  2. Run `docs/SUPABASE_SCHEMA.sql` manually

### Render deployment fails

- Check logs: `render logs --service renos-calendar-mcp --tail`
- Verify environment variables are set
- Check Dockerfile builds locally: `docker build -t test .`

### Health check fails

- Wait 2-3 minutes for service to start
- Check Render dashboard for errors
- Verify PORT=3001 is set

## Time Estimates

- One-time setup: 15 minutes
- Subsequent deploys: 5 minutes
- Total first deployment: ~20 minutes

## Next Steps

After successful deployment:

1. Test all 5 MCP tools
2. Verify Google Calendar sync
3. Test Supabase connection
4. Monitor Render logs for errors
5. Update custom domain (optional)

## Support

- Render issues: <https://render.com/docs>
- Supabase issues: <https://supabase.com/docs>
- Project docs: See `../README.md` and `../docs/`
