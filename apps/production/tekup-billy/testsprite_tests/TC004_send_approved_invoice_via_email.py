import requests
from datetime import date, timedelta
import random
import string

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}

def random_string(length=8):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def create_customer():
    url = f"{BASE_URL}/api/v1/tools/create_customer"
    payload = {
        "name": f"Test Customer {random_string()}",
        "email": f"test{random_string()}@example.com",
        "phone": "+4512345678",
        "address": {
            "street": "Test Street 1",
            "zipcode": "1000",
            "city": "Copenhagen",
            "country": "DK"
        }
    }
    resp = requests.post(url, json=payload, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json().get("contactId") or resp.json().get("id") or resp.json().get("contactID")

def create_product():
    url = f"{BASE_URL}/api/v1/tools/create_product"
    payload = {
        "name": f"Test Product {random_string()}",
        "description": "Test product description",
        "prices": [
            {
                "currencyId": "DKK",
                "unitPrice": 100.0
            }
        ]
    }
    resp = requests.post(url, json=payload, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json().get("productId") or resp.json().get("id") or resp.json().get("productID")

def create_invoice(contact_id, product_id):
    url = f"{BASE_URL}/api/v1/tools/create_invoice"
    today_str = date.today().isoformat()
    payload = {
        "contactId": contact_id,
        "entryDate": today_str,
        "lines": [
            {
                "description": "Test invoice line",
                "quantity": 1,
                "unitPrice": 100.0,
                "productId": product_id
            }
        ],
        "paymentTermsDays": 30
    }
    resp = requests.post(url, json=payload, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    json_resp = resp.json()
    invoice_id = json_resp.get("invoiceId") or json_resp.get("id") or json_resp.get("invoiceID")
    assert invoice_id, "Invoice ID not returned on creation"
    return invoice_id

def approve_invoice(invoice_id):
    url = f"{BASE_URL}/api/v1/tools/approve_invoice"
    payload = {"invoiceId": invoice_id}
    resp = requests.post(url, json=payload, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    # Response can be success confirmation, validate status code
    return resp

def get_invoice(invoice_id):
    url = f"{BASE_URL}/api/v1/tools/get_invoice"
    payload = {"invoiceId": invoice_id}
    resp = requests.post(url, json=payload, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()

def send_invoice(invoice_id):
    url = f"{BASE_URL}/api/v1/tools/send_invoice"
    payload = {"invoiceId": invoice_id}
    resp = requests.post(url, json=payload, headers=HEADERS, timeout=TIMEOUT)
    return resp

def cancel_invoice(invoice_id):
    url = f"{BASE_URL}/api/v1/tools/cancel_invoice"
    payload = {"invoiceId": invoice_id}
    resp = requests.post(url, json=payload, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()

def test_send_approved_invoice_via_email():
    contact_id = None
    product_id = None
    invoice_id = None
    try:
        # Create customer
        contact_id = create_customer()
        assert contact_id, "Failed to create customer"

        # Create product
        product_id = create_product()
        assert product_id, "Failed to create product"

        # Create invoice (draft by default)
        invoice_id = create_invoice(contact_id, product_id)
        assert invoice_id, "Failed to create invoice"

        # Attempt to send invoice without approval - expect error
        response = send_invoice(invoice_id)
        assert response.status_code != 200, "Sending unapproved invoice should not succeed"
        json_resp = response.json()
        # Expect error message indicating invoice not approved
        assert ("not approved" in str(json_resp).lower()) or (response.status_code >= 400), \
            "Expected error about unapproved invoice"

        # Approve the invoice
        approve_invoice(invoice_id)

        # Confirm invoice state is approved
        invoice_details = get_invoice(invoice_id)
        state = invoice_details.get("state") or invoice_details.get("invoiceState") or invoice_details.get("status")
        assert state == "approved", f"Invoice state expected to be 'approved', got '{state}'"

        # Now send the approved invoice
        response = send_invoice(invoice_id)
        assert response.status_code == 200, f"Failed to send approved invoice, status code {response.status_code}"
        send_resp_json = response.json()
        # Assume success response contains a message or status
        assert ("success" in str(send_resp_json).lower()) or ("sent" in str(send_resp_json).lower()), \
            "Expected success confirmation for sending invoice"

    finally:
        # Cleanup: cancel or delete invoice if possible
        if invoice_id:
            try:
                cancel_invoice(invoice_id)
            except Exception:
                pass
        # Note: Deleting customer or product cleanup not defined in PRD

test_send_approved_invoice_via_email()