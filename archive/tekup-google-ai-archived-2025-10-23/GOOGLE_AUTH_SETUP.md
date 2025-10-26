# ✅ Google Auth Setup - Completed Steps

**Date:** 5. Oktober 2025 18:15  
**Status:** Waiting for propagation (5-10 min)

---

## Service Account Details

- **Email:** `renos-319@renos-465008.iam.gserviceaccount.com`
- **Client ID:** `113277186090139582531`
- **Project:** `renos-465008`
- **Impersonated User:** `info@rendetalje.dk`

---

## Domain-Wide Delegation Configuration

### Scopes Configured
```
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/gmail.modify
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/calendar.events
```

### Status
- [x] Service account created
- [x] Client ID identified: `113277186090139582531`
- [ ] Domain-wide delegation authorized (in progress)
- [ ] Wait 5-10 minutes for propagation
- [ ] Verify in Render logs

---

## Next Steps

### 1. Wait for Propagation (5-10 min)
⏰ Current time: ~18:15  
⏰ Check again at: ~18:25

### 2. Monitor Render Logs

Check: <https://dashboard.render.com/web/YOUR_SERVICE_ID/logs>

**Look for:**
✅ Logs should show "Google auth client impersonating workspace user"  
✅ NO "unauthorized_client" errors

**Bad signs:**
❌ "unauthorized_client: Client is unauthorized..."  
❌ "Invalid grant"

### 3. Test Locally (Optional)

```bash
npm run verify:google
```

Expected output:
```
✅ Google Cloud auth initialized successfully
✅ Impersonating user: info@rendetalje.dk
✅ Gmail API access verified
✅ Calendar API access verified
```

---

## Troubleshooting

### If still getting "unauthorized_client" after 10 minutes

1. **Verify Client ID is correct:**
   - Must be: `113277186090139582531`
   - Copy-paste to avoid typos

2. **Verify scopes are exact:**
   - No spaces between scopes
   - Comma-separated on one line
   - All 5 scopes included

3. **Verify you're Super Admin:**
   - Regular users can't configure delegation
   - Must be Workspace Admin

4. **Try removing and re-adding:**
   - Go back to Domain-wide delegation
   - Remove the entry
   - Add it again with same details
   - Wait another 5-10 min

5. **Clear cache:**
   - Some users report cache issues
   - Restart Render service (Suspend → Resume)

---

## Expected Timeline

| Time | Action |
|------|--------|
| 18:15 | Domain-wide delegation configured |
| 18:25 | Check Render logs for first time |
| 18:30 | If still errors, wait 5 more min |
| 18:35 | If still errors, troubleshoot (see above) |

---

## Verification Commands

### Check Render Logs
```bash
# Via dashboard
https://dashboard.render.com/web/YOUR_SERVICE_ID/logs

# Or via curl (health check)
curl https://tekup-renos.onrender.com/health
```

### Test Dashboard
```bash
# Frontend
https://tekup-renos-frontend.onrender.com

# Backend API
curl https://tekup-renos.onrender.com/api/dashboard/environment/status
```

---

## Success Criteria

✅ **Auth is working when:**
1. No "unauthorized_client" errors in logs
2. Logs show "Google auth client impersonating workspace user"
3. Dashboard loads without errors
4. System Safety Status widget shows environment info

❌ **Auth is NOT working if:**
1. "unauthorized_client" errors persist after 15 minutes
2. "Invalid grant" errors
3. Dashboard widgets show "Failed to load data"

---

## Support

If auth still fails after 20 minutes:
1. Review `docs/PRODUCTION_TROUBLESHOOTING.md` (comprehensive guide)
2. Check `docs/TROUBLESHOOTING_AUTH.md` (additional debugging)
3. Verify environment variables in Render (GOOGLE_PRIVATE_KEY, GOOGLE_CLIENT_EMAIL)

---

**Status:** ⏰ Waiting for Google propagation  
**Next check:** 18:25 (in ~10 minutes)  
**Expected result:** ✅ Auth working, no errors
