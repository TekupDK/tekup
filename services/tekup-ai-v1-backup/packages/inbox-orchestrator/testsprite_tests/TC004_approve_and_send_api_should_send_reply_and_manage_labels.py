import requests

BASE_URL = "http://localhost:3011"
TIMEOUT = 30

def test_approve_and_send_api_should_send_reply_and_manage_labels():
    # First, create a mock threadId by simulating a generate-reply request or use a placeholder if not available.
    # Since no resource ID is provided, we create a new resource by generating a reply to get a threadId.
    try:
        # Step 1: Generate a reply to get a valid threadId and a sample reply body
        generate_reply_resp = requests.post(
            f"{BASE_URL}/generate-reply",
            json={"threadId": "test-thread-for-approve-send"},
            timeout=TIMEOUT,
        )
        assert generate_reply_resp.status_code == 200, f"Expected 200, got {generate_reply_resp.status_code}"
        gen_reply_json = generate_reply_resp.json()
        assert "recommendation" in gen_reply_json, "No recommendation found in generate-reply response"
        reply_body = gen_reply_json["recommendation"]
        thread_id = "test-thread-for-approve-send"

        # Step 2: Prepare payload with body and some labels to add/remove
        payload = {
            "threadId": thread_id,
            "body": reply_body,
            "labels": {
                "add": ["Approved", "Sent"],
                "remove": ["Pending"]
            }
        }

        # Step 3: Call the approve-and-send POST endpoint
        approve_send_resp = requests.post(
            f"{BASE_URL}/approve-and-send",
            json=payload,
            timeout=TIMEOUT,
        )
        # Step 4: Validate the response status and content
        assert approve_send_resp.status_code == 200, f"Expected 200, got {approve_send_resp.status_code}"
        resp_json = approve_send_resp.json()
        assert isinstance(resp_json, dict), "Response is not a JSON object"
        assert resp_json.get("ok") is True, "Response 'ok' flag is not True"
        assert "data" in resp_json and isinstance(resp_json["data"], dict), "Response 'data' object missing or invalid"

    except AssertionError as e:
        raise
    except Exception as ex:
        raise RuntimeError(f"Test failed due to exception: {ex}")

test_approve_and_send_api_should_send_reply_and_manage_labels()