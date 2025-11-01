import requests
import uuid

BASE_URL = "http://localhost:3011"
TIMEOUT = 30

def test_generate_reply_api_should_produce_safe_reply_with_memory_enforcement():
    # Since no specific threadId provided, create a dummy thread first
    # NOTE: The PRD does not specify an endpoint to create threads,
    # so we simulate by generating a UUID as a dummy threadId to test input handling.
    thread_id = str(uuid.uuid4())

    url = f"{BASE_URL}/generate-reply"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "threadId": thread_id,
        "policy": {
            "searchBeforeSend": True
        }
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        # Check that response status code is 200
        assert response.status_code == 200, f"Expected status 200 but got {response.status_code}"
        
        resp_json = response.json()
        
        # Validate presence and types of keys
        assert "recommendation" in resp_json and isinstance(resp_json["recommendation"], str), \
            "Missing or invalid 'recommendation' in response"
        assert "warnings" in resp_json and isinstance(resp_json["warnings"], list), \
            "Missing or invalid 'warnings' in response"
        assert all(isinstance(w, str) for w in resp_json["warnings"]), "All warnings should be strings"
        assert "shouldSend" in resp_json and isinstance(resp_json["shouldSend"], bool), \
            "Missing or invalid 'shouldSend' in response"
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

test_generate_reply_api_should_produce_safe_reply_with_memory_enforcement()