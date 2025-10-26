# OAuth Setup Complete - Test Checklist

**Date:** October 7, 2025  
**Status:** 🧪 Testing Phase  
**URL:** <https://www.renos.dk>

## ✅ Setup Completed

### Google Cloud Console
- ✅ OAuth Client ID created: `58625498177-kna90kps6kbdcktim49c04hv2l21rn33.apps.googleusercontent.com`
- ✅ Client Secret generated: `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`
- ✅ Authorized redirect URI: `https://clerk.renos.dk/v1/oauth_callback`
- ✅ Authorized JavaScript origins: `https://clerk.renos.dk`, `https://renos.dk`

### Clerk Dashboard
- ✅ OAuth credentials entered (Client ID + Secret)
- ✅ Settings configured:
  - Enable for sign-up and sign-in: ON
  - Block email subaddresses: ON
  - Use custom credentials: ON
  - Always show account selector: ON
- ✅ Scopes verified: `openid`, `userinfo.email`, `userinfo.profile`

### OAuth Consent Screen
- ✅ App name: RenOS
- ✅ User support email: <info@rendetalje.dk>
- ✅ Developer contact: <info@rendetalje.dk>
- ✅ Status: Published (External)

### Render Environment
- ✅ Frontend: `VITE_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsucmVub3MuZGsk`
- ✅ Backend: `CLERK_SECRET_KEY` (synced from dashboard)
- ✅ Custom domain: <www.renos.dk> (SSL verified)

## 🧪 Test Procedures

### Test 1: Website Loading
**Action:** Open <https://www.renos.dk> in browser  
**Expected:**
- ✅ Page loads (not blank)
- ✅ RenOS branding visible
- ✅ Login page with "Continue with Google" button
- ✅ No console errors (check F12 → Console)

**Actual Result:** _________________________________________

---

### Test 2: Google OAuth Initiation
**Action:** Click "Continue with Google" button  
**Expected:**
- ✅ Redirects to Clerk authentication
- ✅ Redirects to Google account selector
- ✅ Shows list of Google accounts to choose from
- ✅ No "invalid client" errors

**Actual Result:** _________________________________________

---

### Test 3: Google Account Selection
**Action:** Select your Google account (<info@rendetalje.dk> or personal)  
**Expected:**
- ✅ Shows OAuth consent screen (if first time)
- ✅ Displays app name: "RenOS"
- ✅ Shows requested permissions: email, profile, openid
- ⚠️ May show "This app isn't verified" warning (expected for unverified apps)
  - If shown: Click "Advanced" → "Go to RenOS (unsafe)"

**Actual Result:** _________________________________________

---

### Test 4: OAuth Consent
**Action:** Click "Allow" on consent screen  
**Expected:**
- ✅ Redirects to clerk.renos.dk/v1/oauth_callback
- ✅ Processes authentication
- ✅ Creates/updates user account in Clerk
- ✅ Redirects back to <www.renos.dk>

**Actual Result:** _________________________________________

---

### Test 5: Dashboard Access
**Action:** Wait for redirect completion  
**Expected:**
- ✅ Lands on Dashboard page (/)
- ✅ User profile visible (name/email/avatar)
- ✅ Dashboard stats loading (may show 0 if no data)
- ✅ Navigation menu accessible
- ✅ No authentication errors in console

**Actual Result:** _________________________________________

---

### Test 6: API Integration
**Action:** Click on "Customers" or other menu item  
**Expected:**
- ✅ API request sent to backend (tekup-renos.onrender.com)
- ✅ Request includes Clerk JWT token in header
- ✅ Backend validates token successfully
- ✅ Data loads (or shows empty state if no data)
- ✅ No CORS errors
- ✅ No 401 Unauthorized errors

**Actual Result:** _________________________________________

---

### Test 7: Session Persistence
**Action:** Refresh page (F5 or Ctrl+R)  
**Expected:**
- ✅ Stays logged in (no redirect to login)
- ✅ Dashboard remains accessible
- ✅ User session persisted in cookie

**Actual Result:** _________________________________________

---

### Test 8: Logout Flow
**Action:** Click logout button (if available in UI)  
**Expected:**
- ✅ Clerk session cleared
- ✅ Redirects to login page
- ✅ "Continue with Google" button visible again
- ✅ Cannot access dashboard without re-authenticating

**Actual Result:** _________________________________________

---

## 🚨 Common Issues & Fixes

### Issue: "Clerk publishable key is missing"
**Symptom:** Error in browser console  
**Fix:**
```bash
1. Go to Render Dashboard → tekup-renos-frontend → Environment
2. Add: VITE_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsucmVub3MuZGsk
3. Redeploy frontend
```

### Issue: "Redirect URI mismatch"
**Symptom:** Google OAuth error page  
**Fix:**
```bash
1. Verify in Google Console: https://console.cloud.google.com/apis/credentials
2. Check redirect URI is exactly: https://clerk.renos.dk/v1/oauth_callback
3. Verify in Clerk Dashboard → Social Connections → Google
```

### Issue: "This app isn't verified" warning
**Symptom:** Google shows security warning  
**Status:** ⚠️ Expected for new apps (not an error)  
**Workaround:**
```bash
1. Click "Advanced" at bottom of warning
2. Click "Go to RenOS (unsafe)"
3. Continue with authentication
```
**Permanent Fix:**
```bash
1. Create privacy policy at https://renos.dk/privacy
2. Create terms of service at https://renos.dk/terms
3. Submit app for Google verification (takes 3-7 days)
```

### Issue: Failed to fetch / CORS error
**Symptom:** API calls fail with CORS error  
**Fix:**
```bash
1. Check backend CORS configuration in src/server.ts
2. Verify CORS allows origin: https://www.renos.dk
3. Check backend logs for CORS rejections
```

### Issue: 401 Unauthorized on API calls
**Symptom:** Backend rejects authenticated requests  
**Fix:**
```bash
1. Verify CLERK_SECRET_KEY is set in backend environment
2. Check Clerk middleware configuration in src/middleware/clerkMiddleware.ts
3. Verify JWT token is being sent in Authorization header
```

### Issue: Session lost on page refresh
**Symptom:** Redirects to login after F5  
**Fix:**
```bash
1. Check __session cookie exists (F12 → Application → Cookies)
2. Verify cookie is HttpOnly, Secure, SameSite=Lax
3. Check Clerk session duration settings (default: 7 days)
```

## 📊 Success Criteria

Authentication system is fully functional when ALL of these pass:

- [x] OAuth credentials configured in Clerk
- [x] OAuth consent screen published
- [x] Frontend deployed with Clerk key
- [ ] User can click "Continue with Google"
- [ ] User can select Google account
- [ ] User can approve OAuth consent
- [ ] User redirects to Dashboard after login
- [ ] Dashboard loads with user profile
- [ ] API calls succeed with authentication
- [ ] Session persists after page refresh
- [ ] User can logout successfully

## 📝 Test Results Log

**Tester:** _________________________________________  
**Date/Time:** October 7, 2025 at _____________________  
**Browser:** _________________________________________  
**Google Account Used:** _________________________________________

### Overall Result
- [ ] ✅ All tests passed - OAuth fully functional
- [ ] ⚠️ Partial success - minor issues (list below)
- [ ] ❌ Failed - critical issues preventing login (list below)

### Issues Found
```
1. ___________________________________________
2. ___________________________________________
3. ___________________________________________
```

### Additional Notes
```
___________________________________________
___________________________________________
___________________________________________
```

## 🎯 Next Steps After Successful Test

1. **Document Success**
   - Update `docs/AUTHENTICATION.md` with verified status
   - Create deployment success report

2. **Monitor Production**
   - Check Clerk Dashboard for user activity
   - Monitor backend logs for authentication errors
   - Watch for failed login attempts

3. **Optional Enhancements**
   - Submit app for Google verification (remove "unverified" warning)
   - Create privacy policy page
   - Create terms of service page
   - Add 2FA support (Clerk feature)
   - Configure session duration settings
   - Add email/password backup authentication

4. **User Onboarding**
   - Test with multiple Google accounts
   - Verify user data syncs correctly
   - Test role-based access (if implemented)
   - Verify customer data isolation per user

---

**Test Status:** 🧪 In Progress  
**Expected Completion:** October 7, 2025  
**Documentation:** `docs/AUTHENTICATION.md`, `docs/deployment/FRONTEND_LIVE_OCT_7_2025.md`
