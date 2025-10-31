import requests
import datetime
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def create_customer():
    url = f"{BASE_URL}/api/v1/tools/create_customer"
    customer_name = f"Test Customer {uuid.uuid4()}"
    payload = {
        "name": customer_name,
        "email": "test.customer@example.com",
        "phone": "1234567890",
        "address": {
            "street": "123 Test St",
            "zipcode": "1000",
            "city": "Testville",
            "country": "DK"
        }
    }
    response = requests.post(url, json=payload, timeout=TIMEOUT)
    response.raise_for_status()
    data = response.json()
    contact_id = data.get("contactId") or data.get("id")
    assert contact_id is not None, "Failed to create customer or missing contactId"
    return contact_id

def delete_invoice(invoice_id):
    url = f"{BASE_URL}/api/v1/tools/cancel_invoice"
    payload = {"invoiceId": invoice_id, "reason": "Test cleanup"}
    try:
        response = requests.post(url, json=payload, timeout=TIMEOUT)
        response.raise_for_status()
    except Exception:
        pass  # Ignore errors on cleanup

def create_invoice_with_multiple_line_items_and_payment_terms():
    contact_id = None
    invoice_id = None
    try:
        # Create a customer to use in invoice
        contact_id = create_customer()

        url = f"{BASE_URL}/api/v1/tools/create_invoice"
        entry_date = datetime.date.today().isoformat()
        payload = {
            "contactId": contact_id,
            "entryDate": entry_date,
            "paymentTermsDays": 45,
            "lines": [
                {
                    "description": "Product A",
                    "quantity": 2,
                    "unitPrice": 100.0
                },
                {
                    "description": "Product B",
                    "quantity": 1,
                    "unitPrice": 250.5
                }
            ]
        }

        response = requests.post(url, json=payload, timeout=TIMEOUT)
        response.raise_for_status()
        data = response.json()

        # Validate response contains invoice ID and expected fields
        invoice_id = data.get("invoiceId") or data.get("id")
        assert invoice_id is not None, "Response missing invoice ID"
        assert data.get("contactId") == contact_id, "ContactId in response does not match request"
        assert data.get("entryDate") == entry_date, "EntryDate in response does not match request"
        assert data.get("paymentTermsDays") == 45, "Payment terms not correctly set"
        lines = data.get("lines")
        assert isinstance(lines, list) and len(lines) == 2, "Lines missing or incorrect count in response"
        for i, line in enumerate(payload["lines"]):
            resp_line = lines[i]
            assert resp_line.get("description") == line["description"], f"Line {i} description mismatch"
            assert resp_line.get("quantity") == line["quantity"], f"Line {i} quantity mismatch"
            assert abs(resp_line.get("unitPrice") - line["unitPrice"]) < 0.01, f"Line {i} unitPrice mismatch"

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    finally:
        if invoice_id:
            delete_invoice(invoice_id)

create_invoice_with_multiple_line_items_and_payment_terms()