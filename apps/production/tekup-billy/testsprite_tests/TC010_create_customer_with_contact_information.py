import requests

BASE_URL = "http://localhost:3000"
CREATE_CUSTOMER_ENDPOINT = "/api/v1/tools/create_customer"
DELETE_CUSTOMER_ENDPOINT = "/api/v1/tools/update_customer"  # No explicit delete endpoint, so this may be a logical choice if API supports deletion via update with a flag, else skip deletion


def test_create_customer_with_contact_information():
    url = BASE_URL + CREATE_CUSTOMER_ENDPOINT
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "name": "Test Customer TC010",
        "email": "tc010@example.com",
        "phone": "+4512345678",
        "address": {
            "street": "123 Test St",
            "zipcode": "8000",
            "city": "Aarhus",
            "country": "DK"
        }
    }

    created_contact_id = None

    try:
        # Create customer
        resp = requests.post(url, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()

        # Validate response contains contactId or equivalent identifier
        assert isinstance(data, dict), "Response is not a JSON object"
        # We expect an ID or similar unique identifier in response e.g. "contactId" or "id"
        # The PRD does not specify exact response schema, so check for common keys
        contact_id = data.get("contactId") or data.get("id")
        assert contact_id, "Response does not contain contact ID"
        created_contact_id = contact_id

        # Validate returned data includes the provided details (at least name)
        assert data.get("name") == payload["name"], "Name in response does not match request"
        # Optional fields - if present in response validate
        if "email" in data:
            assert data["email"] == payload["email"], "Email in response does not match request"
        if "phone" in data:
            assert data["phone"] == payload["phone"], "Phone in response does not match request"
        if "address" in data:
            addr = data["address"]
            assert addr.get("street") == payload["address"]["street"], "Street in response does not match request"
            assert addr.get("zipcode") == payload["address"]["zipcode"], "Zipcode in response does not match request"
            assert addr.get("city") == payload["address"]["city"], "City in response does not match request"
            assert addr.get("country", "DK") == payload["address"]["country"], "Country in response does not match request"

    finally:
        # Attempt to delete the created customer if possible
        if created_contact_id:
            # If delete API is not specified, attempt to delete via update with an empty name or skip
            # Here, we try to delete by sending a request to update_customer with contactId and a delete flag if API supported.
            # Since PRD does not specify delete method, we will skip deletion.
            pass


test_create_customer_with_contact_information()