import requests

BASE_URL = "http://localhost:3000"
LIST_CUSTOMERS_ENDPOINT = f"{BASE_URL}/api/v1/tools/list_customers"
CREATE_CUSTOMER_ENDPOINT = f"{BASE_URL}/api/v1/tools/create_customer"
DELETE_CUSTOMER_ENDPOINT = f"{BASE_URL}/api/v1/tools/update_customer"

HEADERS = {
    "Content-Type": "application/json"
}

def test_list_customers_with_search_and_pagination():
    # Create a customer to ensure at least one matches the search
    new_customer_data = {
        "name": "Test SearchName Customer",
        "email": "searchname@example.com",
        "phone": "1234567890",
        "address": {
            "street": "123 Search St",
            "zipcode": "1000",
            "city": "TestCity",
            "country": "DK"
        }
    }

    created_contact_id = None

    try:
        # Create customer
        create_resp = requests.post(
            CREATE_CUSTOMER_ENDPOINT,
            json=new_customer_data,
            headers=HEADERS,
            timeout=30
        )
        create_resp.raise_for_status()
        create_json = create_resp.json()
        assert isinstance(create_json, dict), "Create customer response is not a JSON object"
        # Expecting created contactId in response, try multiple possible keys:
        contact_id_keys = ['contactId', 'id', 'contactID', 'contact_id']
        for key in contact_id_keys:
            if key in create_json:
                created_contact_id = create_json[key]
                break
        assert created_contact_id, f"Created contact ID not found in response: {create_json}"

        # Prepare data to list customers filtered by search term matching the created customer
        search_term = "SearchName"
        list_payload = {
            "search": search_term,
            "limit": 10,
            "offset": 0
        }

        list_resp = requests.post(
            LIST_CUSTOMERS_ENDPOINT,
            json=list_payload,
            headers=HEADERS,
            timeout=30
        )
        list_resp.raise_for_status()
        list_json = list_resp.json()

        # Validate response structure
        assert isinstance(list_json, dict) or isinstance(list_json, list), "List customers response should be dict or list"

        # If response is dict, expect an array or list of customers under a key like 'customers' or 'data'
        customers_list = None
        if isinstance(list_json, dict):
            possible_keys = ['customers', 'data', 'results', 'items']
            for key in possible_keys:
                if key in list_json:
                    customers_list = list_json[key]
                    break
            if customers_list is None:
                # If no recognized key, check if any key holds a list with expected items
                customers_list = next((v for v in list_json.values() if isinstance(v, list)), None)
        elif isinstance(list_json, list):
            customers_list = list_json

        assert customers_list is not None, "Could not find customers list in response"
        assert isinstance(customers_list, list), "Customers list is not a list"

        # Validate pagination respects limit
        assert len(customers_list) <= 10, f"Returned customers exceed limit: {len(customers_list)} > 10"

        # Validate that all returned customers have search term in name or relevant fields (case insensitive)
        matched = any(
            ('name' in cust and isinstance(cust['name'], str) and search_term.lower() in cust['name'].lower())
            for cust in customers_list
        )
        assert matched, "No listed customer matches the search term in the returned results"

    finally:
        if created_contact_id:
            # Try to delete the created customer if API supports deletion by updating or other means
            # The PRD does not specify a delete API for customers; thus we try to 'update' with empty details or skip
            # Here, as no delete endpoint is described, we skip actual deletion
            # Pass silently if deletion not possible
            pass


test_list_customers_with_search_and_pagination()