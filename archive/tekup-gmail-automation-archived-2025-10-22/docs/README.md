# 🚀 Gmail PDF Forwarder til e-conomic

**Integreret med dine eksisterende Gmail OAuth credentials**

Automatisk videresendelse af PDF-vedhæftninger fra Gmail til e-conomic bilagsmail.

## ⚡ Hurtig Start

### 1. **Rediger .env fil**
```bash
# Rediger dit e-conomic nummer
ECONOMIC_RECEIPT_EMAIL=DIT_NUMMER@e-conomic.dk
```

### 2. **Installer & Test**
```bash
pip install -r requirements.txt
python test_system.py
```

### 3. **Kør Forwarder**
```bash
# Én gang
python gmail_forwarder.py

# Automatisk dagligt
python scheduler.py

# Windows (double-click)
run.bat
```

## 📋 Funktioner

- ✅ **Bruger dine eksisterende Gmail OAuth credentials**
- ✅ **Automatisk søgning** efter PDF-vedhæftninger i Gmail
- ✅ **Smart filtrering** med søgeord (faktura, kvittering, bilag, etc.)
- ✅ **Videresender til e-conomic** bilagsmail automatisk
- ✅ **Duplikat-prevention** via Gmail labels
- ✅ **Detaljeret logging** og rapportering
- ✅ **Scheduler** til daglig kørsel
- ✅ **Miljøvariabler** fra .env fil

## 🔧 Konfiguration

### .env Fil
```bash
# Gmail OAuth2 (allerede konfigureret fra din eksisterende setup)
GMAIL_CLIENT_ID=58625498177-h56dmhkijn8rh4s5qhhii98b5teil52r.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=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
GMAIL_PROJECT_ID=renos-465008
GMAIL_USER_EMAIL=info@rendetalje.dk

# e-conomic - REDIGER DETTE!
ECONOMIC_RECEIPT_EMAIL=1714566@e-conomic.dk

# Tilpasning (valgfrit)
DAYS_BACK=180
MAX_EMAILS=100
SEARCH_KEYWORDS=faktura,invoice,kvittering,receipt,bilag,moms
ALLOWED_SENDERS=
```

### Avanceret Tilpasning

**Kun specifikke afsendere:**
```bash
ALLOWED_SENDERS=faktura@firma.dk,billing@stripe.com,noreply@paypal.com
```

**Kortere søgeperiode:**
```bash
DAYS_BACK=30  # Kun sidste måned
```

**Flere søgeord:**
```bash
SEARCH_KEYWORDS=faktura,invoice,kvittering,receipt,bilag,moms,ordre,refund
```

## 📊 Eksempel Output

```
🚀 Gmail PDF Forwarder startet
⏰ Tid: 2025-10-14 15:25:30

📋 KONFIGURATION:
----------------------------------------
🎯 e-conomic email: 1714566@e-conomic.dk
📧 Gmail konto: info@rendetalje.dk
📅 Søgeperiode: 180 dage
📊 Max emails: 100
🔍 Søgeord: faktura, invoice, kvittering, receipt, bilag, moms
✉️  Tilladte afsendere: Alle
🏷️  Label: Videresendt_econ

✅ .env fil indlæst
💾 Token gemt
✅ Gmail API forbindelse oprettet
📂 Label fundet: Videresendt_econ
🔍 Søgequery: has:attachment filename:pdf after:2025/04/18 (faktura OR invoice OR kvittering OR receipt OR bilag OR moms) -label:Videresendt_econ
📧 Fundet 3 emails til behandling

📧 Behandler email: abc123xyz
📎 PDF fundet: Faktura_2025_001.pdf (45,632 bytes)
✅ Email sendt: ID def456abc
✅ Videresendt: Faktura_2025_001.pdf
🏷️  Email markeret som behandlet: abc123xyz

============================================================
📊 BEHANDLINGS RAPPORT
============================================================
📧 Emails behandlet:    3
📎 PDFs videresendt:    5
⏭️  Emails sprunget over: 0
❌ Fejl:                0
============================================================
✅ Success rate: 100.0%

🎉 Proces gennemført succesfuldt!
```

## 🕒 Automatisk Kørsel

### Scheduler (anbefalet)
```bash
python scheduler.py
```
- Kører dagligt kl. 09:00
- Første kørsel ved start
- CTRL+C for at stoppe

### Windows Task Scheduler
1. Åbn Task Scheduler
2. Create Basic Task
3. Daily trigger at 09:00
4. Action: Start program
5. Program: `python`
6. Arguments: `C:\sti\til\gmail_forwarder.py`
7. Start in: `C:\sti\til\gmail-pdf-auto`

### Linux Cron
```bash
# Dagligt kl. 09:00
0 9 * * * cd /sti/til/gmail-pdf-auto && python3 gmail_forwarder.py
```

## 🧪 Test & Fejlfinding

### Kør Test Suite
```bash
python test_system.py
```

**Tjekker:**
- ✅ Miljøvariabler fra .env
- ✅ Python biblioteker
- ✅ Konfiguration indlæsning
- ✅ Gmail API forbindelse

### Almindelige Problemer

| Problem | Løsning |
|---------|---------|
| "Manglende miljøvariabler" | Tjek .env fil eksisterer og har korrekte værdier |
| "python-dotenv mangler" | `pip install python-dotenv` |
| "Gmail API fejl" | Tjek internet, credentials, OAuth2 setup |
| "Ingen emails fundet" | Tjek DAYS_BACK, SEARCH_KEYWORDS |

## 📁 Filstruktur

```
gmail-pdf-auto/
├── .env                    # Miljøvariabler (REDIGER DETTE!)
├── gmail_forwarder.py      # Hovedscript
├── scheduler.py            # Automatisk scheduler
├── test_system.py          # Test suite
├── run.bat                 # Windows start script
├── requirements.txt        # Python dependencies
├── README.md               # Denne fil
├── credentials.json        # Auto-genereret fra .env
├── token.pickle            # OAuth2 token (genereres ved første kørsel)
└── gmail_forwarder.log     # Log fil
```

## 🔒 Sikkerhed

- ✅ **OAuth2** sikker autentificering
- ✅ **Lokale credentials** (ingen cloud storage)
- ✅ **Mindste privilegier** - kun Gmail læse/sende
- ✅ **Duplikat prevention** via Gmail labels
- ✅ **.env fil** ikke committet til Git

## 🆘 Support

1. **Kør test først:** `python test_system.py`
2. **Tjek log fil:** `gmail_forwarder.log`
3. **Verificer .env fil** har korrekte værdier
4. **Tjek e-conomic nummer** er rigtigt

---

**🎯 Integration med dit eksisterende system:**
Dette projekt bruger de samme Gmail OAuth2 credentials som dit Renos system, så der er ingen konflikt eller behov for nye API setup.

**💡 Tip:** Kør først som test med `python gmail_forwarder.py`, og når du er tilfreds, start automatisk kørsel med `python scheduler.py`.

