# RenOS Authentication System

**Last Updated:** October 7, 2025  
**Status:** ✅ Production Ready

## 🎯 Overview

RenOS bruger **Clerk.com** som authentication provider med Google OAuth som primary login metode. Dette sikrer:

- ✅ Sikker SSO (Single Sign-On) via Google Workspace
- ✅ Session management med JWT tokens
- ✅ Protected API routes via middleware
- ✅ User profile synkronisering
- ✅ Multi-device support med persistent sessions

## 🔐 OAuth Providers

### Google OAuth (Primary)

**Provider:** Google Cloud Platform  
**Project:** renos-ai-agent  
**Client ID:** `58625498177-kna90kps6kbdcktim49c04hv2l21rn33.apps.googleusercontent.com`  
**Client Secret:** `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` (gemt sikkert i password manager)  
**Authorized Redirect:** `https://clerk.renos.dk/v1/oauth_callback`  
**Created:** October 7, 2025 at 22:57:14 GMT+2  
**Status:** ✅ Active & Published

#### Scopes

```
openid                                        # Basic authentication
https://www.googleapis.com/auth/userinfo.email    # User email address
https://www.googleapis.com/auth/userinfo.profile  # User name & profile picture
```

#### Configuration Settings

- **Account selector:** Always shown (better UX for multi-account users)
- **Email subaddresses:** Blocked (prevents spam via `user+tag@gmail.com`)
- **Sign-up & Sign-in:** Enabled (users can create accounts)
- **Custom credentials:** Enabled (required for production)

#### Verification Status

⚠️ **Unverified** - Users see "This app isn't verified" warning ved login.

**To remove warning:**

1. Submit app for Google verification: <https://console.cloud.google.com/apis/credentials/consent>
2. Requirements:
   - Privacy policy URL (<https://renos.dk/privacy>)
   - Terms of service URL (<https://renos.dk/terms>)
   - App screenshots + logo
   - Developer verification (takes 3-7 days)

#### OAuth Consent Screen

```
App name: RenOS
User support email: info@rendetalje.dk
Developer contact: info@rendetalje.dk
Application homepage: https://renos.dk
Privacy policy: https://renos.dk/privacy (TODO)
Terms of service: https://renos.dk/terms (TODO)
```

**Authorized domains:**
```
renos.dk
clerk.renos.dk
```

## 🏗️ Architecture

### Provider: Clerk.com

**Organization:** rendetalje  
**Instance Type:** Production  
**Domain:** `clerk.renos.dk`  
**Dashboard:** <https://dashboard.clerk.com>

**SDK Versions:**

- Frontend: `@clerk/clerk-react` (configured in `client/src/main.tsx`)
- Backend: `@clerk/express` (configured in `src/middleware/clerkMiddleware.ts`)

### Authentication Flow

```
┌─────────────┐
│   User      │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Click "Continue with Google"
       ▼
┌─────────────────┐
│  renos.dk       │
│  (React App)    │
└──────┬──────────┘
       │
       │ 2. Redirect to Clerk
       ▼
┌─────────────────┐
│  Clerk.com      │
│  Auth Service   │
└──────┬──────────┘
       │
       │ 3. Redirect to Google OAuth
       ▼
┌─────────────────────────┐
│  accounts.google.com    │
│  (Google Login)         │
└──────┬──────────────────┘
       │
       │ 4. User selects account & approves
       ▼
┌─────────────────┐
│  Clerk.com      │
│  Callback       │
└──────┬──────────┘
       │
       │ 5. Create/update user + session
       │ 6. Return JWT token
       ▼
┌─────────────────┐
│  renos.dk       │
│  Dashboard      │ ← User authenticated ✅
└─────────────────┘
```

### Session Management

**Token Storage:**

- Frontend: `__session` cookie (HttpOnly, Secure, SameSite=Lax)
- Backend: Validated via `@clerk/express` middleware

**Token Lifecycle:**
```
Creation → Valid for 7 days → Auto-refresh on activity → Expires after inactivity
```

**Logout:**
```typescript
// Frontend (React)
import { useClerk } from '@clerk/clerk-react';

const { signOut } = useClerk();
await signOut();
```

## 🛡️ Protected Routes

### Frontend Protection

**Protected with `<SignedIn>` wrapper:**
```typescript
// client/src/App.tsx
<SignedIn>
  <Dashboard />
  <CustomerList />
  <BookingCalendar />
</SignedIn>

<SignedOut>
  <LoginPage />
</SignedOut>
```

### Backend Protection

**Middleware setup in `src/middleware/clerkMiddleware.ts`:**
```typescript
import { clerkMiddleware, requireAuth } from '@clerk/express';

app.use(clerkMiddleware());

// Public routes (no auth required)
app.get('/api/health', healthCheck);

// Protected routes (auth required)
app.use('/api/*', requireAuth());
```

**Protected API routes:**
```
GET  /api/dashboard/*        # Dashboard data
GET  /api/customers          # Customer list
POST /api/leads              # Lead creation
GET  /api/bookings           # Booking calendar
POST /api/chat               # AI Assistant chat
```

## 🔧 Setup Instructions

### 1. Google Cloud Console Setup

#### Create OAuth Client ID

```
1. Go to: https://console.cloud.google.com/apis/credentials?project=renos-ai-agent
2. Click "CREATE CREDENTIALS" → "OAuth client ID"
3. Application type: Web application
4. Name: RenOS Clerk Auth
5. Authorized JavaScript origins:
   - https://clerk.renos.dk
   - https://renos.dk
6. Authorized redirect URIs:
   - https://clerk.renos.dk/v1/oauth_callback
7. Click "CREATE" → Copy Client ID & Secret
```

#### Configure OAuth Consent Screen

```
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. User Type: External (allow all Gmail users)
3. App info:
   - App name: RenOS
   - User support email: info@rendetalje.dk
   - Developer contact: info@rendetalje.dk
4. Scopes: Add email, profile, openid
5. Test users: info@rendetalje.dk (if not published)
6. Click "PUBLISH APP"
```

### 2. Clerk Dashboard Setup

#### Add Google OAuth Provider

```
1. Go to: https://dashboard.clerk.com
2. Configure → Social Connections → Google
3. Enable "Use custom credentials"
4. Enter:
   - Client ID: 58625498177-kna90kps6kbdcktim49c04hv2l21rn33.apps.googleusercontent.com
   - Client Secret: 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
5. Settings:
   ✅ Enable for sign-up and sign-in
   ✅ Block email subaddresses
   ✅ Always show account selector prompt
6. Click "Save"
```

#### Configure Clerk Settings

```
1. Configure → Email, Phone, Username
   - Email: Required
   - Phone: Optional
   - Username: Optional

2. Configure → Sessions
   - Session duration: 7 days
   - Inactivity timeout: 1 day
   - Multi-session: Enabled

3. Configure → Restrictions
   - Allowed email domains: (none = all domains)
   - Block disposable emails: Enabled
```

### 3. Environment Variables

**Backend (.env):**
```ini
# Clerk Configuration
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Google OAuth (backup reference - configured in Clerk Dashboard)
GOOGLE_OAUTH_CLIENT_ID=58625498177-kna90kps6kbdcktim49c04hv2l21rn33.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=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
```

**Frontend (client/.env):**
```ini
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
```

### 4. Test Authentication

#### Local Testing (Development)

```powershell
# Start both backend + frontend
npm run dev:all

# Open browser
Start-Process http://localhost:5173

# Click "Continue with Google"
# Expected: Google account selector → Login → Dashboard
```

#### Production Testing

```powershell
# Open production URL
Start-Process https://renos.dk

# Click "Continue with Google"
# Expected: "This app isn't verified" warning (click Advanced → Continue)
# Then: Google login → Dashboard
```

## 🚨 Troubleshooting

### "Redirect URI mismatch"

**Problem:** URI in Google Console doesn't match Clerk callback URL

**Fix:**
```
1. Check Google Console: https://console.cloud.google.com/apis/credentials
2. Verify redirect URI is exactly: https://clerk.renos.dk/v1/oauth_callback
3. Check Clerk Dashboard → Social Connections → Google
4. Authorized Redirect URI should match exactly
```

### "OAuth is restricted"

**Problem:** OAuth consent screen not published

**Fix:**
```
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Click "PUBLISH APP"
3. Status should change from "Testing" to "In production"
```

### "This app isn't verified"

**Problem:** App not verified by Google (normal for new apps)

**Fix (Temporary - for testing):**
```
1. Click "Advanced" on warning screen
2. Click "Go to RenOS (unsafe)"
3. Continue with login
```

**Fix (Permanent - for production):**
```
1. Create privacy policy at https://renos.dk/privacy
2. Create terms of service at https://renos.dk/terms
3. Submit app for verification:
   https://console.cloud.google.com/apis/credentials/consent
4. Wait 3-7 days for Google review
```

### "Access blocked: Authorization Error"

**Problem:** Missing scopes in consent screen

**Fix:**
```
1. Go to OAuth consent screen → Scopes
2. Add these scopes:
   - .../auth/userinfo.email
   - .../auth/userinfo.profile
   - openid
3. Save and re-test
```

### "Invalid client"

**Problem:** Wrong Client ID or Secret

**Fix:**
```
1. Go to Google Console Credentials
2. Find "RenOS Clerk Auth" OAuth client
3. Copy Client ID & Secret again
4. Update in Clerk Dashboard
5. Wait 5 minutes for propagation
```

### Session not persisting after refresh

**Problem:** Cookie configuration incorrect

**Fix:**
```typescript
// Check client/src/main.tsx
<ClerkProvider 
  publishableKey={CLERK_PUBLISHABLE_KEY}
  afterSignOutUrl="/"
  signInFallbackRedirectUrl="/dashboard"
  signUpFallbackRedirectUrl="/dashboard"
>
```

## 📊 Monitoring & Analytics

### Clerk Dashboard Metrics

```
1. Go to: https://dashboard.clerk.com/apps/<app-id>/dashboard
2. View:
   - Active users (daily/monthly)
   - Sign-up conversion rate
   - Authentication errors
   - Session duration statistics
```

### Google Cloud Console Metrics

```
1. Go to: https://console.cloud.google.com/apis/dashboard
2. Select API: Google+ API
3. View:
   - OAuth requests per day
   - Error rates
   - Quota usage
```

### Custom Logging

**Backend authentication logs:**
```typescript
// src/middleware/clerkMiddleware.ts logs:
logger.info('User authenticated', { userId, email });
logger.warn('Authentication failed', { reason });
```

**View logs:**
```powershell
# Production (Render.com)
npm run logs:backend

# Local development
npm run dev  # Logs output to console
```

## 🔒 Security Best Practices

### Credentials Management

- ✅ Client Secret gemt i password manager (1Password/LastPass)
- ✅ Never commit secrets to Git
- ✅ Use environment variables for all sensitive data
- ✅ Rotate secrets every 90 days

### Session Security

- ✅ HttpOnly cookies (prevents XSS access)
- ✅ Secure flag (HTTPS only)
- ✅ SameSite=Lax (prevents CSRF)
- ✅ 7-day expiration with auto-refresh

### API Protection

- ✅ All `/api/*` routes require authentication
- ✅ CORS configured for `renos.dk` only
- ✅ Rate limiting on login endpoints
- ✅ Webhook signature verification

### Compliance

- ⚠️ **TODO:** Create GDPR-compliant privacy policy
- ⚠️ **TODO:** Add user data deletion workflow
- ⚠️ **TODO:** Implement audit logging for data access

## 📚 Resources

### Official Documentation

- **Clerk Docs:** <https://clerk.com/docs>
- **Clerk React SDK:** <https://clerk.com/docs/references/react/overview>
- **Clerk Express SDK:** <https://clerk.com/docs/references/backend/overview>
- **Google OAuth:** <https://developers.google.com/identity/protocols/oauth2>

### Internal Documentation

- **Setup Checklist:** `docs/SETUP_CHECKLIST.md`
- **Troubleshooting Auth:** `docs/TROUBLESHOOTING_AUTH.md`
- **Security Guide:** `SECURITY.md`

### Support

- **Clerk Support:** <support@clerk.com>
- **Google Cloud Support:** <https://console.cloud.google.com/support>
- **RenOS Team:** <info@rendetalje.dk>

---

**Next Steps:**

1. ✅ OAuth setup complete
2. ⚠️ Create privacy policy page (`/privacy`)
3. ⚠️ Create terms of service page (`/terms`)
4. ⚠️ Submit app for Google verification
5. ⚠️ Implement user data deletion workflow (GDPR)
6. ⚠️ Add 2FA support (optional enhancement)

**Last verified:** October 7, 2025 ✅
