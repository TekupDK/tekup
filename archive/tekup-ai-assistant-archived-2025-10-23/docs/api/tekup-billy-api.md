# 💰 Tekup-Billy API Documentation

API documentation for Tekup-Billy integration with Billy.dk.

## 🌐 Base URL

**Production:** `https://tekup-billy.onrender.com`  
**Repository:** `tekup-billy` (separate repo)

## 🔐 Authentication

**Type:** Bearer Token (Optional for public endpoints)

```http
Authorization: Bearer YOUR_API_KEY_HERE
```

**Environment Variable:** `BILLY_API_KEY`

---

## 📋 Endpoints

### GET /health

**Description:** Health check endpoint

**Request:**
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00Z",
  "version": "1.2.0"
}
```

---

### GET /billy/customers

**Description:** List all customers from Billy.dk

**Request:**
```http
GET /billy/customers?search=Michael
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| search | string | No | Filter customers by name |
| limit | number | No | Max results (default: 100) |
| offset | number | No | Pagination offset |

**Response:**
```json
{
  "customers": [
    {
      "id": "c123",
      "name": "Michael Roach",
      "email": "michael@example.com",
      "phone": "+45 12 34 56 78",
      "address": "Sødalvej 4, 8000 Aarhus C",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 1,
  "hasMore": false
}
```

**Example (PowerShell):**
```powershell
curl "https://tekup-billy.onrender.com/billy/customers?search=Michael"
```

---

### POST /billy/invoices

**Description:** Create new invoice in Billy.dk

**Request:**
```http
POST /billy/invoices
Content-Type: application/json

{
  "customer_id": "c123",
  "hours": 4,
  "service_type": "moving_clean",
  "description": "Flytterengøring",
  "date": "2025-01-14"
}
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| customer_id | string | Yes | Billy.dk customer ID |
| hours | number | Yes | Number of hours worked |
| service_type | string | No | "basic", "deep", "moving_clean" |
| description | string | No | Custom description |
| date | string | No | Invoice date (ISO 8601, default: today) |

**Response:**
```json
{
  "success": true,
  "invoice": {
    "id": "INV-2025-042",
    "customer": "Michael Roach",
    "amount": 1396,
    "currency": "DKK",
    "date": "2025-01-14",
    "dueDate": "2025-02-13",
    "status": "sent",
    "url": "https://billy.dk/invoices/INV-2025-042"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Customer not found",
  "code": "CUSTOMER_NOT_FOUND"
}
```

**Example (PowerShell):**
```powershell
$body = @{
    customer_id = "c123"
    hours = 4
    service_type = "moving_clean"
} | ConvertTo-Json

curl -X POST "https://tekup-billy.onrender.com/billy/invoices" `
     -H "Content-Type: application/json" `
     -d $body
```

---

### GET /billy/products

**Description:** List service types and pricing

**Request:**
```http
GET /billy/products
```

**Response:**
```json
{
  "products": [
    {
      "id": "prod_basic",
      "name": "Basic Cleaning",
      "description": "Standard rengøring",
      "price": 299,
      "unit": "hour",
      "currency": "DKK",
      "vat": 25
    },
    {
      "id": "prod_deep",
      "name": "Deep Cleaning",
      "description": "Hovedrengøring",
      "price": 349,
      "unit": "hour",
      "currency": "DKK",
      "vat": 25
    },
    {
      "id": "prod_moving",
      "name": "Moving Clean",
      "description": "Flytterengøring",
      "price": 349,
      "unit": "hour",
      "currency": "DKK",
      "vat": 25
    }
  ]
}
```

---

### GET /billy/revenue

**Description:** Get revenue statistics

**Request:**
```http
GET /billy/revenue?period=month&year=2025&month=1
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| period | string | Yes | "day", "week", "month", "year" |
| year | number | Yes | Year (e.g., 2025) |
| month | number | No | Month (1-12, required if period=month) |
| week | number | No | Week number (1-53, required if period=week) |

**Response:**
```json
{
  "period": "month",
  "year": 2025,
  "month": 1,
  "revenue": {
    "total": 45680,
    "invoiced": 42340,
    "paid": 38900,
    "outstanding": 6780,
    "overdue": 3440
  },
  "invoices": {
    "total": 34,
    "sent": 32,
    "paid": 29,
    "overdue": 3
  },
  "currency": "DKK"
}
```

---

### GET /billy/invoices/:id

**Description:** Get specific invoice details

**Request:**
```http
GET /billy/invoices/INV-2025-042
```

**Response:**
```json
{
  "invoice": {
    "id": "INV-2025-042",
    "customer": {
      "id": "c123",
      "name": "Michael Roach",
      "email": "michael@example.com"
    },
    "lines": [
      {
        "description": "Flytterengøring",
        "quantity": 4,
        "unit": "timer",
        "unitPrice": 349,
        "total": 1396
      }
    ],
    "subtotal": 1396,
    "vat": 349,
    "total": 1745,
    "currency": "DKK",
    "date": "2025-01-14",
    "dueDate": "2025-02-13",
    "status": "sent",
    "paidDate": null
  }
}
```

---

## 🔢 Pricing Logic

### Standard Rates (2025)

| Service Type | Rate (DKK/hour) | VAT | Total |
|--------------|-----------------|-----|-------|
| Basic Clean | 299 | 25% | 374 |
| Deep Clean | 349 | 25% | 436 |
| Moving Clean | 349 | 25% | 436 |

### Calculation Example

**Scenario:** 4 hours moving clean
```
Base: 4 × 349 DKK = 1.396 DKK
VAT (25%): 1.396 × 0.25 = 349 DKK
Total: 1.745 DKK
```

**Note:** Billy.dk handles VAT calculation automatically

---

## 🚨 Error Codes

| Code | HTTP | Description | Solution |
|------|------|-------------|----------|
| CUSTOMER_NOT_FOUND | 404 | Customer ID doesn't exist | Check customer list |
| INVALID_HOURS | 400 | Hours must be >0 | Provide valid hours |
| BILLY_API_ERROR | 500 | Billy.dk API error | Check Billy.dk status |
| AUTH_FAILED | 401 | Invalid API key | Check BILLY_API_KEY env |
| RATE_LIMIT | 429 | Too many requests | Wait and retry |

---

## ⚡ Rate Limits

- **Free tier:** 100 requests/hour
- **Burst:** 10 requests/second
- **Daily limit:** 1000 requests/day

**Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704546000
```

---

## 🧪 Testing

### Test Customers

```json
{
  "id": "test_customer_1",
  "name": "Test Kunde",
  "email": "test@example.com"
}
```

### Test Invoice Creation

```powershell
# Create test invoice
$body = @{
    customer_id = "test_customer_1"
    hours = 2
    service_type = "basic"
    description = "Test faktura"
} | ConvertTo-Json

curl -X POST "https://tekup-billy.onrender.com/billy/invoices" `
     -H "Content-Type: application/json" `
     -d $body
```

---

## 📊 MCP Integration

### Tool Definition

```json
{
  "name": "create_invoice",
  "description": "Create invoice in Billy.dk for cleaning services",
  "inputSchema": {
    "type": "object",
    "properties": {
      "customer_id": {
        "type": "string",
        "description": "Billy.dk customer ID"
      },
      "hours": {
        "type": "number",
        "description": "Number of hours worked",
        "minimum": 0.5
      },
      "service_type": {
        "type": "string",
        "enum": ["basic", "deep", "moving_clean"],
        "description": "Type of cleaning service"
      },
      "description": {
        "type": "string",
        "description": "Optional custom description"
      }
    },
    "required": ["customer_id", "hours"]
  }
}
```

### Example MCP Call

```json
{
  "method": "tools/call",
  "params": {
    "name": "create_invoice",
    "arguments": {
      "customer_id": "c123",
      "hours": 4,
      "service_type": "moving_clean"
    }
  }
}
```

---

## 🔄 Webhooks (Future)

**Planned endpoints:**
- `POST /webhooks/billy/invoice.paid` - Invoice paid
- `POST /webhooks/billy/invoice.overdue` - Invoice overdue
- `POST /webhooks/billy/customer.created` - New customer

---

## 📝 Changelog

### v1.2.0 (2025-01-15)
- Added revenue endpoint
- Improved error messages
- Added rate limiting

### v1.1.0 (2024-12-01)
- Added search to customers endpoint
- Fixed VAT calculation
- Added pagination support

### v1.0.0 (2024-10-01)
- Initial release
- Basic invoice creation
- Customer listing

---

**Version:** 1.2.0  
**Last Updated:** 2025-01-15  
**Maintained by:** TekUp Team


