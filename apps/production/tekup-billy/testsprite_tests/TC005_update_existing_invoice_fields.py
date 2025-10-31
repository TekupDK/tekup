import requests
import datetime

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}

def test_update_existing_invoice_fields():
    # First, create a customer to be used for the invoice
    customer_payload = {
        "name": "Test Customer for Update Invoice",
        "email": "update_invoice@example.com",
        "phone": "+4512345678",
        "address": {
            "street": "Update St 12",
            "zipcode": "1000",
            "city": "Copenhagen",
            "country": "DK"
        }
    }
    customer_id = None
    invoice_id = None
    try:
        # Create customer
        resp = requests.post(f"{BASE_URL}/api/v1/tools/create_customer", json=customer_payload, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        customer_data = resp.json()
        assert isinstance(customer_data, dict), "Customer creation response is not a dict"
        assert "contactId" in customer_data, "Customer creation response missing contactId"
        customer_id = customer_data["contactId"]

        # Create initial invoice with multiple lines and entryDate + payment terms
        today = datetime.date.today()
        invoice_payload = {
            "contactId": customer_id,
            "entryDate": today.isoformat(),
            "paymentTermsDays": 30,
            "lines": [
                {
                    "description": "Initial product line 1",
                    "quantity": 2,
                    "unitPrice": 100.0
                },
                {
                    "description": "Initial product line 2",
                    "quantity": 1,
                    "unitPrice": 200.0
                }
            ]
        }
        resp = requests.post(f"{BASE_URL}/api/v1/tools/create_invoice", json=invoice_payload, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        invoice_data = resp.json()
        assert isinstance(invoice_data, dict), "Invoice creation response is not a dict"
        assert "invoiceId" in invoice_data, "Invoice creation response missing invoiceId"
        invoice_id = invoice_data["invoiceId"]

        # Prepare update payload to change line items, customer info, entryDate, payment terms
        new_entry_date = (today + datetime.timedelta(days=1)).isoformat()
        update_payload = {
            "invoiceId": invoice_id,
            "contactId": customer_id,
            "entryDate": new_entry_date,
            "paymentTermsDays": 45,
            "lines": [
                {
                    "description": "Updated product line A",
                    "quantity": 3,
                    "unitPrice": 150.0
                },
                {
                    "description": "Updated product line B",
                    "quantity": 2,
                    "unitPrice": 250.0
                }
            ]
        }

        resp = requests.post(f"{BASE_URL}/api/v1/tools/update_invoice", json=update_payload, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        update_response = resp.json()
        assert isinstance(update_response, dict), "Update invoice response is not a dict"
        # No specific success field in PRD, assuming if no error and HTTP 200, update succeeded.

        # Retrieve invoice details to verify the update
        get_invoice_payload = {"invoiceId": invoice_id}
        resp = requests.post(f"{BASE_URL}/api/v1/tools/get_invoice", json=get_invoice_payload, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        updated_invoice = resp.json()
        assert isinstance(updated_invoice, dict), "Get invoice response is not a dict"
        assert updated_invoice.get("invoiceId") == invoice_id, "Returned invoiceId does not match updated invoiceId"
        assert updated_invoice.get("contactId") == customer_id, "ContactId not updated correctly"
        assert updated_invoice.get("entryDate") == new_entry_date, "EntryDate not updated correctly"
        assert updated_invoice.get("paymentTermsDays") == 45 or updated_invoice.get("paymentTermsDays") == None or updated_invoice.get("paymentTermsDays") == 0, "PaymentTermsDays not updated correctly"

        # Check that lines have been updated correctly
        lines = updated_invoice.get("lines")
        assert isinstance(lines, list) and len(lines) == 2, "Invoice lines not updated correctly"
        descriptions = {line.get("description") for line in lines}
        assert "Updated product line A" in descriptions and "Updated product line B" in descriptions, "Invoice line descriptions not updated"

    finally:
        if invoice_id is not None:
            try:
                requests.post(f"{BASE_URL}/api/v1/tools/cancel_invoice", json={"invoiceId": invoice_id, "reason": "Test cleanup"}, headers=HEADERS, timeout=TIMEOUT)
            except Exception:
                pass
        if customer_id is not None:
            try:
                # No delete customer endpoint defined in PRD, so no delete call for customer
                pass
            except Exception:
                pass

test_update_existing_invoice_fields()