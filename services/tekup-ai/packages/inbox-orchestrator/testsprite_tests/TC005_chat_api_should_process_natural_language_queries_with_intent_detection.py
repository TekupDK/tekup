import requests

BASE_URL = "http://localhost:3011/health"
TIMEOUT = 30

def test_chat_api_should_process_natural_language_queries_with_intent_detection():
    url = BASE_URL.rstrip("/health") + "/chat"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "message": "Hvad har vi fået af nye leads i dag?"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"HTTP request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate required fields presence
    assert "reply" in data, "Response JSON missing 'reply'"
    assert isinstance(data["reply"], str) and data["reply"], "'reply' should be a non-empty string"

    assert "actions" in data, "Response JSON missing 'actions'"
    assert isinstance(data["actions"], list), "'actions' should be a list of performed actions"
    for action in data["actions"]:
        assert isinstance(action, dict), "Each action should be an object"
        assert "name" in action and isinstance(action["name"], str), "Each action must have a 'name' string"
        assert "args" in action and isinstance(action["args"], dict), "Each action must have an 'args' object"

    assert "metrics" in data, "Response JSON missing 'metrics'"
    metrics = data["metrics"]
    assert isinstance(metrics, dict), "'metrics' should be an object"

    # Check intent
    assert "intent" in metrics, "'metrics' missing 'intent'"
    valid_intents = [
        "lead_processing",
        "booking",
        "quote_generation",
        "conflict_resolution",
        "follow_up",
        "calendar_query",
        "general",
        "unknown"
    ]
    assert metrics["intent"] in valid_intents, f"Intent '{metrics['intent']}' not in valid intents list"

    # Check tokens used
    assert "tokens" in metrics, "'metrics' missing 'tokens'"
    assert isinstance(metrics["tokens"], (int, float)), "'tokens' should be a number"
    assert metrics["tokens"] > 0, "'tokens' should be greater than 0"

    # Check latency format and value
    assert "latency" in metrics, "'metrics' missing 'latency'"
    latency = metrics["latency"]
    # latency should be a string representing milliseconds, e.g., "123ms" or a number string like "123"
    assert isinstance(latency, str), "'latency' should be a string"
    # Strip possible 'ms' suffix and convert to float
    latency_value_str = latency.lower().replace("ms", "").strip()
    try:
        latency_value = float(latency_value_str)
    except ValueError:
        assert False, "'latency' string does not represent a valid number"
    assert 0 <= latency_value < 5000, f"Latency {latency_value}ms is out of expected range (<5000ms)"

test_chat_api_should_process_natural_language_queries_with_intent_detection()