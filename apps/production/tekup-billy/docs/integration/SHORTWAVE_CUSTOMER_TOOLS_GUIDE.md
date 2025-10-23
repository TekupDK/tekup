# 📝 Guide til Shortwave AI & Billy Integration

## ✅ Customer Tools Er Tilgængelige

Shortwave AI assistant sagde customer tools manglede, men det er IKKE sandt! Billy MCP serveren HAR customer tools:

### Tilgængelige Customer Functions

1. **`list_customers`** - Søg og list kunder
2. **`create_customer`** - Opret ny kunde  
3. **`get_customer`** - Hent specifik kunde
4. **`update_customer`** - Opdater kunde

---

## 🎯 Sådan Opretter Du Michael Roach i Billy

### Trin 1: Brug Shortwave AI Directly

I Shortwave AI, send denne besked:

```
Create a new customer in Billy with these details:
- Name: Michael Roach
- Email: mroach@mroach.com
- Phone: 53646007
- Address: Telefonsmøgen 24B 2.4, 8000 Aarhus C, Denmark
```

### Trin 2: Verificer Customer Er Oprettet

```
Search for customer "Michael Roach" in Billy
```

### Trin 3: Opret Fakturaen

```
Create an invoice in Billy for Michael Roach with:
- Date: 2025-10-11
- Payment terms: 0 days (due immediately)
- Line item: Flytterengøring – 10 timer à 349 kr = 3.490 kr
- Description: Flytterengøring – 75 m² lejlighed med 2 soveværelser, bad og stue – udført 11.10.2025. 2 personer × 5 timer = 10 timer. Miljøvenlige, svanemærkede produkter.
```

---

## 💻 Alternativ: Direkte API Calls via PowerShell

### Opret Customer

```powershell
$body = @{
    jsonrpc = "2.0"
    id = 1
    method = "tools/call"
    params = @{
        name = "create_customer"
        arguments = @{
            name = "Michael Roach"
            email = "mroach@mroach.com"
            phone = "53646007"
            address = @{
                street = "Telefonsmøgen 24B 2.4"
                city = "Aarhus C"
                zipcode = "8000"
                country = "DK"
            }
        }
    }
} | ConvertTo-Json -Depth 6

$result = Invoke-RestMethod -Uri "https://tekup-billy.onrender.com/mcp" `
    -Method POST -Body $body -ContentType "application/json"

# Extract contact ID
$customer = ($result.result.content[0].text | ConvertFrom-Json)
$contactId = $customer.customer.id
Write-Host "Contact ID: $contactId"
```

### Opret Invoice

```powershell
$body = @{
    jsonrpc = "2.0"
    id = 2
    method = "tools/call"
    params = @{
        name = "create_invoice"
        arguments = @{
            contactId = $contactId  # Fra forrige step
            entryDate = "2025-10-11"
            paymentTermsDays = 0
            lines = @(
                @{
                    description = "Flytterengøring – 75 m² lejlighed med 2 soveværelser, bad og stue – udført 11.10.2025. 2 personer × 5 timer = 10 timer. Miljøvenlige, svanemærkede produkter."
                    quantity = 10
                    unitPrice = 349
                }
            )
        }
    }
} | ConvertTo-Json -Depth 6

$result = Invoke-RestMethod -Uri "https://tekup-billy.onrender.com/mcp" `
    -Method POST -Body $body -ContentType "application/json"

# Extract invoice details
$invoice = ($result.result.content[0].text | ConvertFrom-Json)
Write-Host "Invoice created: $($invoice.invoice.invoiceNo)"
Write-Host "Amount: $($invoice.invoice.totalAmount) DKK"
```

---

## 🔍 Hvorfor Shortwave Ikke Fandt Tools

Shortwave AI's assistent gjorde ikke en ordentlig søgning i Billy:
- ❌ Sagde "jeg har ikke adgang til search_contact eller create_contact"
- ✅ Men toolsne hedder faktisk `list_customers` og `create_customer`
- ✅ Alle 19 Billy tools er tilgængelige i Shortwave

**Løsning:** Giv mere specifikke instruktioner til Shortwave AI om præcis hvilke tool names den skal bruge.

---

## 📋 Alle Tilgængelige Billy Tools i Shortwave

### Invoices (8 tools)

- `list_invoices`, `create_invoice`, `get_invoice`, `send_invoice`
- `update_invoice`, `approve_invoice`, `cancel_invoice`, `mark_invoice_paid`

### Customers (4 tools)  

- `list_customers`, `create_customer`, `get_customer`, `update_customer`

### Products (3 tools)

- `list_products`, `create_product`, `update_product`

### Other (4 tools)

- `get_revenue`, `list_test_scenarios`, `run_test_scenario`, `generate_test_data`

---

## ✅ Next Steps

1. **Brug Shortwave direkte** med de rigtige tool names
2. **Eller brug PowerShell** scriptet ovenfor til direkte API calls
3. **Verificer** at Michael Roach bliver oprettet først
4. **Opret derefter** fakturaen med hans contactId

**Tip:** Shortwave AI virker bedst når du giver den præcise instructions med tool names!
