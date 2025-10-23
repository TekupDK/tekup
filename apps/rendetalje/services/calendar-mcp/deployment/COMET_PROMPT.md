# Comet/AI Browser Automation Prompt

Du er en deployment assistant der skal hjælpe med at hente credentials til RenOS Calendar MCP deployment.

## Mål

Automatisk hente alle nødvendige API keys og credentials fra forskellige dashboards og gemme dem i de korrekte secret filer.

## Task 1: Hent Google Calendar Service Account Key

**URL**: https://console.cloud.google.com/iam-admin/serviceaccounts?project=renos-465008

**Steps**:
1. Find service account: `renos-319@renos-465008.iam.gserviceaccount.com`
2. Klik på service account navnet
3. Gå til "Keys" tab
4. Hvis ingen keys findes: Klik "Add Key" → "Create new key" → JSON format
5. Download private key JSON
6. Extract `private_key` field fra JSON
7. Gem i: `deployment/.secrets/google-private-key.txt`

**Expected format**:
```
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCyeQeQ...
...
-----END PRIVATE KEY-----
```

## Task 2: Verificer Supabase Credentials

**URL**: https://supabase.com/dashboard/project/oaevagdgrasfppbrxbey/settings/api

**Steps**:
1. Scroll til "Project API keys" section
2. Find "anon public" key
3. Copy key value
4. Gem i: `deployment/.secrets/supabase-anon-key.txt`
5. Find "service_role" key (KLIK "Reveal" først!)
6. Copy key value  
7. Gem i: `deployment/.secrets/supabase-service-key.txt`

**Expected format**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJl...
```

## Task 3: Verificer Render Account

**URL**: https://dashboard.render.com/

**Steps**:
1. Verificer at du er logged in
2. Gå til "Environment" → "Environment Groups"
3. Check at "Tekup Database Environment" group eksisterer
4. Check indeholder: SUPABASE_URL, SUPABASE_SERVICE_KEY, ENCRYPTION_KEY, ENCRYPTION_SALT
5. Return status: "Render account verified"

**Notes**:
- Ingen credentials skal hentes herfra
- Bare verificer at groups eksisterer
- De vil blive linket automatisk via render.yaml

## Task 4: Get Twilio Credentials (Optional)

**URL**: https://console.twilio.com/

**Steps** (kun hvis voice alerts skal bruges):
1. Find "Account SID" på dashboard
2. Copy Account SID
3. Find "Auth Token" (klik "Show" hvis skjult)
4. Copy Auth Token
5. Gem Account SID i: `deployment/.secrets/twilio-account-sid.txt`
6. Gem Auth Token i: `deployment/.secrets/twilio-auth-token.txt`
7. Find dit Twilio phone number
8. Gem i: `deployment/.secrets/twilio-phone-number.txt`

**Format**:
```
Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Auth Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Phone: +4512345678
```

## Output Format

Efter alle tasks er færdige, return følgende JSON:

```json
{
  "google_service_account": "ready",
  "supabase_anon_key": "ready",
  "supabase_service_key": "ready",
  "render_account": "verified",
  "twilio_credentials": "optional - not set",
  "ready_for_deployment": true,
  "files_created": [
    "deployment/.secrets/google-private-key.txt",
    "deployment/.secrets/supabase-anon-key.txt",
    "deployment/.secrets/supabase-service-key.txt"
  ]
}
```

## Error Handling

Hvis en task fejler:
- Log fejlen med detaljer
- Continue til næste task hvis muligt
- Return `"ready_for_deployment": false` hvis kritiske credentials mangler
- Kritiske: Google, Supabase
- Optional: Twilio

## Security Notes

- Alle filer gemmes i `deployment/.secrets/` som er Git ignored
- ALDRIG commit eller log faktiske credential values
- Kun log "ready" / "not ready" status
- Credentials bliver læst af deployment scripts, ikke inkluderet i Git

## Next Steps

Efter credentials er hentet:
```powershell
cd renos-calendar-mcp
./scripts/deploy-all.ps1
```

Dette vil automatisk:
1. Bruge credentials fra .secrets/
2. Deploy Supabase schema
3. Guide gennem Render deployment
4. Verificere alt virker

