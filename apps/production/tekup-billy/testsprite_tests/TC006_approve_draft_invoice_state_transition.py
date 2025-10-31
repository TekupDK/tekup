import requests
import datetime
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
HEADERS = {
    "Content-Type": "application/json"
}

def test_approve_draft_invoice_state_transition():
    # Helper function to create a customer
    def create_customer():
        payload = {
            "name": f"Test Customer {uuid.uuid4()}",
            "email": "testcustomer@example.com",
            "phone": "1234567890",
            "address": {
                "street": "123 Test St",
                "zipcode": "1000",
                "city": "Testville",
                "country": "DK"
            }
        }
        resp = requests.post(f"{BASE_URL}/api/v1/tools/create_customer", json=payload, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        contact_id = data.get("contactId") or data.get("id")
        assert contact_id is not None, "Failed to get contactId from create_customer response"
        return contact_id

    # Helper function to delete a customer (if such endpoint existed; skipping here per instructions as no delete customer)
    # Not specified in PRD, so we won't delete customer.

    # Helper function to create an invoice
    def create_invoice(contact_id):
        today = datetime.date.today().isoformat()
        payload = {
            "contactId": contact_id,
            "entryDate": today,
            "paymentTermsDays": 30,
            "lines": [
                {
                    "description": "Test product line",
                    "quantity": 1,
                    "unitPrice": 100.0
                }
            ]
        }
        resp = requests.post(f"{BASE_URL}/api/v1/tools/create_invoice", json=payload, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        invoice_id = data.get("invoiceId") or data.get("id")
        assert invoice_id is not None, "Failed to get invoiceId from create_invoice response"
        return invoice_id

    # Helper function to get invoice details
    def get_invoice(invoice_id):
        payload = {"invoiceId": invoice_id}
        resp = requests.post(f"{BASE_URL}/api/v1/tools/get_invoice", json=payload, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json()

    # Helper function to approve invoice
    def approve_invoice(invoice_id):
        payload = {"invoiceId": invoice_id}
        resp = requests.post(f"{BASE_URL}/api/v1/tools/approve_invoice", json=payload, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json()

    # Helper function to cancel invoice (cleanup)
    def cancel_invoice(invoice_id):
        payload = {"invoiceId": invoice_id, "reason": "Test cleanup"}
        resp = requests.post(f"{BASE_URL}/api/v1/tools/cancel_invoice", json=payload, headers=HEADERS, timeout=TIMEOUT)
        if resp.status_code not in (200, 204):
            # We tolerate failure on cleanup
            pass

    invoice_id = None
    contact_id = None
    try:
        # Create customer
        contact_id = create_customer()

        # Create invoice in draft state
        invoice_id = create_invoice(contact_id)

        # Verify initial state is draft
        invoice_before = get_invoice(invoice_id)
        state_before = invoice_before.get("state") or invoice_before.get("status")
        assert state_before == "draft", f"Expected invoice state 'draft' but got '{state_before}' before approval"

        # Approve the invoice
        approve_resp = approve_invoice(invoice_id)
        # Possible that approve_resp contains some data, no specification given, so just check HTTP Success (done above)

        # Verify invoice state changed to approved
        invoice_after = get_invoice(invoice_id)
        state_after = invoice_after.get("state") or invoice_after.get("status")
        assert state_after == "approved", f"Expected invoice state 'approved' but got '{state_after}' after approval"

    finally:
        # Cleanup: cancel the invoice if created
        if invoice_id:
            cancel_invoice(invoice_id)

test_approve_draft_invoice_state_transition()
