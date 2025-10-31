import requests
import datetime

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
HEADERS = {
    "Content-Type": "application/json",
}

def test_mark_invoice_as_paid_with_payment_details():
    # Create a new customer to use for invoice creation
    customer_payload = {
        "name": "Test Customer for Mark Paid",
        "email": "markpaid@test.com"
    }
    customer_id = None
    invoice_id = None

    try:
        # Create customer
        resp = requests.post(
            f"{BASE_URL}/api/v1/tools/create_customer",
            json=customer_payload,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        resp.raise_for_status()
        customer_data = resp.json()
        customer_id = customer_data.get("contactId") or customer_data.get("id")
        assert customer_id, "Customer ID not returned on creation"

        # Create invoice for this customer
        today = datetime.date.today().isoformat()
        invoice_payload = {
            "contactId": customer_id,
            "entryDate": today,
            "lines": [
                {
                    "description": "Test product line",
                    "quantity": 1,
                    "unitPrice": 100
                }
            ]
        }
        resp = requests.post(
            f"{BASE_URL}/api/v1/tools/create_invoice",
            json=invoice_payload,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        resp.raise_for_status()
        invoice_data = resp.json()
        invoice_id = invoice_data.get("invoiceId") or invoice_data.get("id")
        assert invoice_id, "Invoice ID not returned on creation"

        # Approve the invoice so it can be marked as paid
        approve_payload = {"invoiceId": invoice_id}
        resp = requests.post(
            f"{BASE_URL}/api/v1/tools/approve_invoice",
            json=approve_payload,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        resp.raise_for_status()
        approve_resp = resp.json()
        assert approve_resp.get("success", True) is not False, "Invoice approval failed"

        # Mark the invoice as paid with paymentDate and amount
        payment_date = today
        payment_amount = 100
        mark_paid_payload = {
            "invoiceId": invoice_id,
            "paymentDate": payment_date,
            "amount": payment_amount
        }
        resp = requests.post(
            f"{BASE_URL}/api/v1/tools/mark_invoice_paid",
            json=mark_paid_payload,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        resp.raise_for_status()
        mark_paid_resp = resp.json()
        # Assuming a success message or similar response key is returned
        assert mark_paid_resp.get("success", True) is not False, "Marking invoice as paid failed"

        # Optionally get the invoice and validate its state is paid
        get_invoice_payload = {"invoiceId": invoice_id}
        resp = requests.post(
            f"{BASE_URL}/api/v1/tools/get_invoice",
            json=get_invoice_payload,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        resp.raise_for_status()
        invoice_detail = resp.json()
        # The invoice detail should show paid state or payment info matching
        # Typical field could be 'state' or 'paymentStatus' or checking payment date/amount
        payment_info = invoice_detail.get("payment")
        paid_state = invoice_detail.get("state")
        assert paid_state == "paid" or (payment_info and payment_info.get("paymentDate") == payment_date and abs(payment_info.get("amount",0)-payment_amount)<0.01), \
            "Invoice is not marked as paid correctly"

    finally:
        # Clean up invoice
        if invoice_id:
            try:
                requests.post(
                    f"{BASE_URL}/api/v1/tools/cancel_invoice",
                    json={"invoiceId": invoice_id},
                    headers=HEADERS,
                    timeout=TIMEOUT
                )
            except Exception:
                pass

        # Clean up customer
        if customer_id:
            try:
                # No explicit delete customer endpoint known,
                # if exists replace here. Otherwise ignore cleanup.
                pass
            except Exception:
                pass

test_mark_invoice_as_paid_with_payment_details()