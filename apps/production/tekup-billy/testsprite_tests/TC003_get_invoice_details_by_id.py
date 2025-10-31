import requests
import datetime

BASE_URL = "http://localhost:3000"
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30


def test_get_invoice_details_by_id():
    # Step 1: Create customer to get valid contactId
    customer_payload = {
        "name": "Test Customer for Invoice",
        "email": "testcustomer@example.com",
        "phone": "1234567890",
        "address": {
            "street": "123 Test St",
            "zipcode": "12345",
            "city": "Testville",
            "country": "DK"
        }
    }
    customer_id = None
    invoice_id = None

    try:
        resp_customer = requests.post(
            f"{BASE_URL}/api/v1/tools/create_customer",
            headers=HEADERS,
            json=customer_payload,
            timeout=TIMEOUT
        )
        resp_customer.raise_for_status()
        customer_data = resp_customer.json()
        # Expecting contactId in response
        customer_id = customer_data.get("contactId") or customer_data.get("id") or customer_data.get("contactID")
        assert customer_id, "No contactId returned from create_customer"

        # Step 2: Create an invoice for that customer
        today_str = datetime.date.today().isoformat()
        invoice_payload = {
            "contactId": customer_id,
            "entryDate": today_str,
            "paymentTermsDays": 30,
            "lines": [
                {
                    "description": "Test line item",
                    "quantity": 1,
                    "unitPrice": 100.0
                }
            ]
        }
        resp_invoice = requests.post(
            f"{BASE_URL}/api/v1/tools/create_invoice",
            headers=HEADERS,
            json=invoice_payload,
            timeout=TIMEOUT
        )
        resp_invoice.raise_for_status()
        invoice_data = resp_invoice.json()
        # Extract invoiceId from creation response
        invoice_id = (
            invoice_data.get("invoiceId")
            or invoice_data.get("id")
            or invoice_data.get("invoiceID")
            or (invoice_data.get("data") and invoice_data["data"].get("invoiceId"))
        )
        assert invoice_id, "No invoiceId returned from create_invoice"

        # Step 3: Retrieve invoice details by invoiceId
        get_invoice_payload = {"invoiceId": invoice_id}
        resp_get_invoice = requests.post(
            f"{BASE_URL}/api/v1/tools/get_invoice",
            headers=HEADERS,
            json=get_invoice_payload,
            timeout=TIMEOUT
        )
        resp_get_invoice.raise_for_status()
        invoice_details = resp_get_invoice.json()

        # Validate response contains expected keys and data
        assert isinstance(invoice_details, dict), "Invoice details response is not a dictionary"
        # Check invoiceId in response matches the requested one
        resp_invoice_id = (
            invoice_details.get("invoiceId")
            or invoice_details.get("id")
            or invoice_details.get("invoiceID")
        )
        assert resp_invoice_id == invoice_id, "Returned invoiceId does not match requested invoiceId"
        # Basic checks for keys expected in an invoice detail
        required_keys = ["contactId", "entryDate", "lines"]
        for key in required_keys:
            assert key in invoice_details, f"Key '{key}' missing in invoice details"
        # lines must be a non-empty list
        assert isinstance(invoice_details["lines"], list) and len(invoice_details["lines"]) > 0, "Invoice lines missing or empty"

    finally:
        # Cleanup: Delete the created invoice if possible - no delete invoice endpoint described
        # Cleanup: Delete created customer to keep system clean if possible
        # Since DELETE endpoints are not described, best effort to cancel invoice and delete customer

        if invoice_id:
            try:
                # Try to cancel the invoice to clean up
                cancel_payload = {"invoiceId": invoice_id, "reason": "Clean up after test"}
                cancel_resp = requests.post(
                    f"{BASE_URL}/api/v1/tools/cancel_invoice",
                    headers=HEADERS,
                    json=cancel_payload,
                    timeout=TIMEOUT
                )
                cancel_resp.raise_for_status()
            except Exception:
                pass

        if customer_id:
            try:
                # No delete customer endpoint described; skipping deletion
                pass
            except Exception:
                pass


test_get_invoice_details_by_id()
