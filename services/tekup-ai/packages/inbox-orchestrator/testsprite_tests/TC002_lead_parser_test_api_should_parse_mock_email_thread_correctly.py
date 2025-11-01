import requests

def test_lead_parser_api_should_parse_mock_email_thread_correctly():
    base_url = "http://localhost:3011"
    url = f"{base_url}/test/parser"
    headers = {
        "Accept": "application/json"
    }
    timeout = 30

    try:
        response = requests.get(url, headers=headers, timeout=timeout)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request to {url} failed: {e}"

    json_data = response.json()

    # Validate response status code
    assert response.status_code == 200, f"Expected status 200 but got {response.status_code}"
    # Validate success flag
    assert isinstance(json_data.get("success"), bool), "Missing or invalid 'success' flag in response"
    assert json_data["success"] is True, "'success' flag is not True"
    # Validate parsed object
    parsed = json_data.get("parsed")
    assert isinstance(parsed, dict), "Missing or invalid 'parsed' object in response"

    # Validate required fields in parsed
    expected_fields = ["name", "type", "source", "contact", "bolig", "address", "status"]
    for field in expected_fields:
        assert field in parsed, f"Missing '{field}' in parsed data"

    # Validate types of fields
    assert isinstance(parsed["name"], str), "'name' field is not a string"
    assert isinstance(parsed["type"], str), "'type' field is not a string"
    assert isinstance(parsed["source"], str), "'source' field is not a string"
    assert isinstance(parsed["address"], str), "'address' field is not a string"
    assert isinstance(parsed["status"], str), "'status' field is not a string"

    # Validate contact object
    contact = parsed["contact"]
    assert isinstance(contact, dict), "'contact' is not an object"
    assert "email" in contact and isinstance(contact["email"], str), "'contact.email' missing or not string"
    assert "phone" in contact and isinstance(contact["phone"], str), "'contact.phone' missing or not string"

    # Validate bolig object
    bolig = parsed["bolig"]
    assert isinstance(bolig, dict), "'bolig' is not an object"
    assert "sqm" in bolig and (isinstance(bolig["sqm"], int) or isinstance(bolig["sqm"], float)), "'bolig.sqm' missing or not a number"
    assert "type" in bolig and isinstance(bolig["type"], str), "'bolig.type' missing or not string"

test_lead_parser_api_should_parse_mock_email_thread_correctly()
