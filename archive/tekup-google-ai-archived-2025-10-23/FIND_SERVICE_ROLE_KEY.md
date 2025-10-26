# 🔑 FIND SUPABASE SERVICE_ROLE KEY

## Du er i Supabase Dashboard - find denne key nu

### Step-by-Step

1. **I Supabase Dashboard (du har den åben):**
   - Klik på **⚙️ Project Settings** (tandhjul ikon nederst i venstre sidebar)

2. **Klik på "API" tab:**
   - Det er den anden tab efter "General"

3. **Scroll ned til "Project API keys" sektion:**
   - Du vil se 2 keys:
     - `anon` `public` (den har du allerede)
     - `service_role` `secret` ⬅️ **DENNE HAR DU BRUG FOR!**

4. **Kopier service_role key:**
   - Klik på **"Reveal"** knappen ved siden af service_role key
   - Klik på **copy icon** for at kopiere hele token
   - Den starter med: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## ⚠️ VIGTIGT: Dette er SECRET KEY

**service_role** key giver fuld adgang til din database (bypasser Row Level Security).

**BRUG DEN KUN TIL:**
- Backend API environment variables (Render.com)
- ALDRIG i frontend/browser kode!

---

## 📋 NÆSTE SKRIDT EFTER DU HAR KOPIERET KEY

Når du har kopieret `service_role` key:

1. **Gem den midlertidigt i Notepad** (eller hold den i clipboard)

2. **Gå til Render.com:**
   - Åbn: <https://dashboard.render.com/>
   - Find din service: **tekup-renos**
   - Klik på **"Environment"** tab

3. **Tilføj alle 4 environment variables:**
   - `DATABASE_URL` (opdater eksisterende)
   - `SUPABASE_URL` (tilføj ny)
   - `SUPABASE_ANON_KEY` (tilføj ny)
   - `SUPABASE_SERVICE_KEY` (tilføj ny - DEN KEY DU LIGE KOPIEREDE!)

4. **Følg `RENDER_QUICK_SETUP.md` for præcise værdier!**

---

## 🚀 KLAR TIL AT FORTSÆTTE?

Fortæl mig når du har:
✅ Fundet og kopieret `service_role` key fra Supabase
✅ Åbnet Render.com dashboard

Så guider jeg dig gennem Environment Variables opdateringen! 💪
