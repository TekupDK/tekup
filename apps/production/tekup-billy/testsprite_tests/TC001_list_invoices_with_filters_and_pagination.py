import requests
import datetime

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
HEADERS = {
    "Content-Type": "application/json",
}

def test_list_invoices_with_filters_and_pagination():
    """
    Test the /api/v1/tools/list_invoices endpoint to verify it correctly lists invoices with various filters
    such as date range, state, and contactId, and supports pagination with limit and offset parameters.
    """
    url = f"{BASE_URL}/api/v1/tools/list_invoices"

    # Prepare a range of test payloads to test filters and pagination
    today = datetime.date.today()
    seven_days_ago = today - datetime.timedelta(days=7)
    fourteen_days_ago = today - datetime.timedelta(days=14)

    test_payloads = [
        # Filter by date range only
        {
            "startDate": fourteen_days_ago.isoformat(),
            "endDate": today.isoformat()
        },
        # Filter by state
        {
            "state": "draft"
        },
        {
            "state": "approved"
        },
        {
            "state": "voided"
        },
        # Pagination parameters
        {
            "limit": 5,
            "offset": 0
        },
        {
            "limit": 5,
            "offset": 5
        },
        # Combined filters
        {
            "startDate": seven_days_ago.isoformat(),
            "endDate": today.isoformat(),
            "state": "approved",
            "limit": 10,
            "offset": 0
        },
    ]

    # First, retrieve list of invoices to get a valid contactId if possible
    # We'll try to get contactId from one of the invoices to test contactId filter
    contact_id = None
    try:
        response_all = requests.post(url, json={}, headers=HEADERS, timeout=TIMEOUT)
        response_all.raise_for_status()
        invoices_all = response_all.json()
        # attempt to fetch contactId from the first invoice if available
        if invoices_all and isinstance(invoices_all, dict):
            invoices_list = invoices_all.get("invoices") or invoices_all.get("data") or []
            if isinstance(invoices_list, list) and len(invoices_list) > 0:
                first_invoice = invoices_list[0]
                contact_id = first_invoice.get("contactId") or first_invoice.get("contactID") or first_invoice.get("customerId")
    except Exception:
        # fallback no contact id
        contact_id = None

    if contact_id:
        test_payloads.append({"contactId": contact_id})

    for payload in test_payloads:
        try:
            response = requests.post(url, json=payload, headers=HEADERS, timeout=TIMEOUT)
        except requests.RequestException as e:
            assert False, f"Request failed for payload {payload}: {e}"

        assert response.status_code == 200, f"Expected 200 OK, got {response.status_code} for payload {payload}"

        try:
            data = response.json()
        except ValueError:
            assert False, f"Response is not valid JSON for payload {payload}"

        # Validate response structure
        # We expect some pagination metadata and a list of invoices or similar
        assert isinstance(data, dict), f"Response body should be a JSON object, got {type(data)} for payload {payload}"

        # Check at least keys containing invoices and pagination
        # The exact keys are not specified, but typical keys might be "invoices", "data", "pagination" etc.
        invoices = data.get("invoices") or data.get("data")
        assert invoices is not None, f"Response missing 'invoices' or 'data' key for payload {payload}"
        assert isinstance(invoices, list), f"'invoices' or 'data' key should be a list for payload {payload}"

        # Optionally check pagination metadata if available
        pagination = data.get("pagination") or data.get("meta")
        if pagination is not None:
            assert isinstance(pagination, dict), f"Pagination/meta should be an object if present for payload {payload}"
            # If limit and offset included in response metadata, verify consistency
            limit = payload.get("limit")
            if limit is not None:
                returned_limit = pagination.get("limit") or pagination.get("pageSize")
                if returned_limit is not None:
                    assert returned_limit <= 100, f"Returned limit exceeds maximum 100 for payload {payload}"
            offset = payload.get("offset")
            if offset is not None:
                returned_offset = pagination.get("offset") or pagination.get("page")
                if returned_offset is not None:
                    assert isinstance(returned_offset, int), f"Returned offset/page should be an integer for payload {payload}"

        # Validate filtering matches roughly expected when possible:
        # For state filter, verify invoices match requested state (at least non-empty and no invoices with different states)
        if "state" in payload and invoices:
            expected_state = payload["state"]
            valid_states = {"draft", "approved", "voided"}
            for inv in invoices:
                state = inv.get("state")
                assert state in valid_states, f"Invoice state '{state}' invalid for payload {payload}"
                assert state == expected_state, f"Invoice state '{state}' does not match filter '{expected_state}' for payload {payload}"

        # For contactId filter, verify invoices belong to the contactId
        if "contactId" in payload and invoices:
            expected_cid = payload["contactId"]
            for inv in invoices:
                inv_cid = inv.get("contactId") or inv.get("customerId")
                assert inv_cid == expected_cid, f"Invoice contactId '{inv_cid}' does not match filter '{expected_cid}' for payload {payload}"

def run():
    test_list_invoices_with_filters_and_pagination()

run()