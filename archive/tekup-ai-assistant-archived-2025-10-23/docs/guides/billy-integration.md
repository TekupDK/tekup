# Billy.dk Integration Guide - Open WebUI

## Overview

Integrer Billy.dk directly in Open WebUI for invoice creation via chat.

**Scenario:**
```
You: "Create invoice for Michael Roach - 4 hours moving clean"
AI: ✅ Invoice created successfully (Invoice #2024-0156)
```

---

## How It Works

### Architecture

```
Open WebUI (Browser)
       ↓
       ├─→ Ollama (Local AI Models)
       │   - Qwen, Llama, Mistral
       │
       └─→ Billy.dk Integration
           - REST API calls
           - Invoice creation
           - Customer lookup
           - Status tracking
```

### Integration Methods

We'll use **Open WebUI's Web Scraper integration** which is already available via MCP:

1. **Method A:** Direct API calls from chat prompts
2. **Method B:** OpenAI-compatible endpoints (if available)
3. **Method C:** Webhooks/External integrations

---

## Setup Instructions

### Step 1: Verify Billy API is Accessible

```powershell
# Test Billy health endpoint
curl https://tekup-billy.onrender.com/health

# Should return:
# {"status": "ok", "timestamp": "...", "version": "..."}
```

### Step 2: Configure API Endpoint in Open WebUI

Since Open WebUI doesn't have built-in Billy.dk support, we'll use a workaround:

**Option A: Use Web Functions in Prompt** (Simplest)

Simply include in your Open WebUI chat:

```
Create an invoice using this API:

API Endpoint: https://tekup-billy.onrender.com/billy/invoices
Method: POST
Headers: Content-Type: application/json

Customer: Michael Roach
Hours: 4
Service: moving_clean
Description: Flytterengøring

Make the API call and report the result.
```

The AI will:
1. Understand your request
2. Format the API call correctly
3. Provide you the curl command
4. Explain what to run

**Option B: Custom Python Script Integration**

Create a Python script that Open WebUI can call:

### Step 3: Create Billy Integration Script

Create file: `scripts/billy-integration.py`

```python
#!/usr/bin/env python3
"""
Billy.dk Integration Script for TekUp AI Assistant
Handles invoice creation and customer lookups
"""

import requests
import json
import sys
from typing import Dict, Any

BILLY_BASE_URL = "https://tekup-billy.onrender.com"
BILLY_API_KEY = os.getenv("BILLY_API_KEY", "")

class BillyIntegration:
    def __init__(self):
        self.base_url = BILLY_BASE_URL
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {BILLY_API_KEY}" if BILLY_API_KEY else ""
        }

    def search_customers(self, query: str) -> Dict[str, Any]:
        """Search for customers by name"""
        try:
            url = f"{self.base_url}/billy/customers?search={query}"
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"error": str(e)}

    def create_invoice(self, customer_id: str, hours: float, 
                      service_type: str, description: str) -> Dict[str, Any]:
        """Create new invoice"""
        try:
            payload = {
                "customer_id": customer_id,
                "hours": hours,
                "service_type": service_type,
                "description": description,
                "date": datetime.now().strftime("%Y-%m-%d")
            }
            
            url = f"{self.base_url}/billy/invoices"
            response = requests.post(url, json=payload, headers=self.headers, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"error": str(e)}

    def get_invoice(self, invoice_id: str) -> Dict[str, Any]:
        """Get invoice details"""
        try:
            url = f"{self.base_url}/billy/invoices/{invoice_id}"
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"error": str(e)}


def main():
    """CLI interface for Billy integration"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Command required: search_customers, create_invoice, get_invoice"}))
        sys.exit(1)

    billy = BillyIntegration()
    command = sys.argv[1]

    if command == "search_customers":
        query = sys.argv[2] if len(sys.argv) > 2 else ""
        result = billy.search_customers(query)
        print(json.dumps(result))

    elif command == "create_invoice":
        # Create invoice: python script create_invoice <customer_id> <hours> <service_type> <description>
        customer_id = sys.argv[2]
        hours = float(sys.argv[3])
        service_type = sys.argv[4]
        description = " ".join(sys.argv[5:]) if len(sys.argv) > 5 else ""
        result = billy.create_invoice(customer_id, hours, service_type, description)
        print(json.dumps(result))

    elif command == "get_invoice":
        invoice_id = sys.argv[2]
        result = billy.get_invoice(invoice_id)
        print(json.dumps(result))

    else:
        print(json.dumps({"error": f"Unknown command: {command}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
```

### Step 4: Create Prompt Template for AI

Create file: `docs/prompts/billy-invoice-template.md`

### Step 5: Manual Testing

Test the API directly:

```powershell
# 1. Search for customers
curl "https://tekup-billy.onrender.com/billy/customers?search=Michael"

# 2. Create invoice
$payload = @{
    customer_id = "c123"
    hours = 4
    service_type = "moving_clean"
    description = "Flytterengøring"
    date = "2025-01-15"
} | ConvertTo-Json

curl -X POST `
  -H "Content-Type: application/json" `
  -d $payload `
  "https://tekup-billy.onrender.com/billy/invoices"

# 3. Get invoice details
curl "https://tekup-billy.onrender.com/billy/invoices/inv-123"
```

---

## Using in Open WebUI Chat

### Method 1: Direct Chat Prompts

**Example 1: Create Invoice**
```
I need to create an invoice in Billy.dk for Michael Roach.
- Duration: 4 hours
- Service: Moving and cleaning
- Date: Today

Can you help me format the API request?
```

**AI Response:**
```
I'll help you create an invoice. First, I need to search for Michael Roach to get his customer ID.

API Request:
GET https://tekup-billy.onrender.com/billy/customers?search=Michael

Once I have the customer ID, I'll create the invoice:
POST https://tekup-billy.onrender.com/billy/invoices
{
  "customer_id": "c123",
  "hours": 4,
  "service_type": "moving_clean",
  "description": "Moving and cleaning",
  "date": "2025-01-15"
}
```

**Example 2: Look Up Customer**
```
Search for all customers named Michael in Billy.dk
```

**AI Response:**
```
Query: GET https://tekup-billy.onrender.com/billy/customers?search=Michael

Results:
- Michael Roach (c123)
- Michael Smith (c456)

Would you like to create an invoice for one of them?
```

### Method 2: System Prompt Enhancement

Add to Open WebUI System Prompt (if available):

```
You have access to a Billy.dk invoice system. 

When users ask to create invoices or look up customers, use these API endpoints:

1. Search customers: 
   GET https://tekup-billy.onrender.com/billy/customers?search={name}

2. Create invoice:
   POST https://tekup-billy.onrender.com/billy/invoices
   Body: {customer_id, hours, service_type, description, date}

Always provide the exact API request format that should be executed.
```

---

## API Reference

### Search Customers

```bash
curl "https://tekup-billy.onrender.com/billy/customers?search=Michael"
```

Response:
```json
{
  "customers": [
    {
      "id": "c123",
      "name": "Michael Roach",
      "email": "michael@example.com",
      "phone": "+45 12 34 56 78"
    }
  ],
  "total": 1,
  "hasMore": false
}
```

### Create Invoice

```bash
curl -X POST https://tekup-billy.onrender.com/billy/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "c123",
    "hours": 4,
    "service_type": "moving_clean",
    "description": "Flytterengøring",
    "date": "2025-01-15"
  }'
```

Response:
```json
{
  "id": "inv-456",
  "invoice_number": "2024-0156",
  "customer_id": "c123",
  "amount_dkk": 2200,
  "status": "created",
  "created_at": "2025-01-15T10:30:00Z"
}
```

### Get Invoice Status

```bash
curl "https://tekup-billy.onrender.com/billy/invoices/inv-456"
```

Response:
```json
{
  "id": "inv-456",
  "invoice_number": "2024-0156",
  "status": "created",
  "paid": false,
  "amount_dkk": 2200,
  "due_date": "2025-02-15"
}
```

---

## Testing Workflow

### Full Example: Create Invoice via Chat

**You (in Open WebUI):**
```
Create invoice for Michael Roach, 4 hours moving clean
```

**AI (Qwen Model):**
```
I'll help you create that invoice. Let me break this down:

1. First, I'll search for Michael Roach:
   GET https://tekup-billy.onrender.com/billy/customers?search=Michael

2. Then create the invoice with his customer ID:
   POST https://tekup-billy.onrender.com/billy/invoices
   {
     "customer_id": "c123",
     "hours": 4,
     "service_type": "moving_clean",
     "description": "Cleaning service",
     "date": "2025-01-15"
   }

Expected result:
- Invoice number: ~2024-0156
- Amount: ~2,200 DKK (4 hours × 550 DKK/hour)
- Status: Created

Would you like me to show you the full API documentation?
```

---

## Troubleshooting

### API Not Responding

```powershell
# Check Billy health
curl https://tekup-billy.onrender.com/health

# Should return: {"status": "ok", ...}
```

### Customer Not Found

```powershell
# Verify exact customer name
curl "https://tekup-billy.onrender.com/billy/customers"

# List all customers to find correct spelling
```

### Invoice Creation Failed

Check:
1. Customer ID exists
2. Hours is a number (e.g., 4, not "4")
3. Service type is valid (e.g., "moving_clean", "deep_clean", "basic_clean")
4. Date format is YYYY-MM-DD

---

## Next Steps

1. ✅ Test API endpoints manually
2. ✅ Try invoice creation in Open WebUI chat
3. ⏳ Set up automated integration (Python script)
4. ⏳ Add system prompt enhancement
5. ⏳ Create templates for common tasks

---

## Full Tekup-Billy API Docs

See: [Tekup-Billy API](../api/tekup-billy-api.md)
