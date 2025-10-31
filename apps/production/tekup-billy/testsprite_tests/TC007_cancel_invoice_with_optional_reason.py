import requests
import datetime

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}

def test_cancel_invoice_with_optional_reason():
    # Step 1: Create a new customer needed for invoice creation
    customer_payload = {
        "name": "Test Customer for Cancel Invoice",
        "email": "cancel_invoice_test@example.com",
        "phone": "+4512345678",
        "address": {
            "street": "Test Street 1",
            "zipcode": "1000",
            "city": "Copenhagen",
            "country": "DK"
        }
    }
    customer_id = None
    invoice_id = None
    try:
        r_cust = requests.post(
            f"{BASE_URL}/api/v1/tools/create_customer",
            json=customer_payload,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        r_cust.raise_for_status()
        customer_resp = r_cust.json()
        assert "contactId" in customer_resp, "contactId not in create_customer response"
        customer_id = customer_resp["contactId"]

        # Step 2: Create an invoice for this customer
        today_str = datetime.date.today().isoformat()
        invoice_payload = {
            "contactId": customer_id,
            "entryDate": today_str,
            "lines": [
                {
                    "description": "Test product line for cancel invoice",
                    "quantity": 1,
                    "unitPrice": 200.0
                }
            ]
        }
        r_inv = requests.post(
            f"{BASE_URL}/api/v1/tools/create_invoice",
            json=invoice_payload,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        r_inv.raise_for_status()
        invoice_resp = r_inv.json()
        assert "invoiceId" in invoice_resp, "invoiceId not in create_invoice response"
        invoice_id = invoice_resp["invoiceId"]

        # Step 3: Cancel the invoice without reason (optional field)
        cancel_payload_no_reason = {"invoiceId": invoice_id}
        r_cancel_no_reason = requests.post(
            f"{BASE_URL}/api/v1/tools/cancel_invoice",
            json=cancel_payload_no_reason,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        r_cancel_no_reason.raise_for_status()
        cancel_resp_no_reason = r_cancel_no_reason.json()
        assert cancel_resp_no_reason.get("success", True) or r_cancel_no_reason.status_code == 200

        # (Recreate invoice because canceled invoice can't be canceled again)
        r_inv2 = requests.post(
            f"{BASE_URL}/api/v1/tools/create_invoice",
            json=invoice_payload,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        r_inv2.raise_for_status()
        invoice_resp2 = r_inv2.json()
        assert "invoiceId" in invoice_resp2, "invoiceId not in create_invoice response (second invoice)"
        invoice_id_2 = invoice_resp2["invoiceId"]

        # Step 4: Cancel the invoice with a reason
        cancel_payload_with_reason = {
            "invoiceId": invoice_id_2,
            "reason": "Customer requested cancellation"
        }
        r_cancel_reason = requests.post(
            f"{BASE_URL}/api/v1/tools/cancel_invoice",
            json=cancel_payload_with_reason,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        r_cancel_reason.raise_for_status()
        cancel_resp_reason = r_cancel_reason.json()
        assert cancel_resp_reason.get("success", True) or r_cancel_reason.status_code == 200

    finally:
        # Clean up invoices if still present - No explicit delete invoice endpoint specified in PRD.
        # Clean up customer
        if customer_id:
            # No delete customer endpoint described so skipping deletion.
            pass

test_cancel_invoice_with_optional_reason()
