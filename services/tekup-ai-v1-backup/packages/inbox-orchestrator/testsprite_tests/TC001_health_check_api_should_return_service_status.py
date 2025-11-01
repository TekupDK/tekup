import requests

def test_health_check_api_should_return_service_status():
    url = "http://localhost:3011/health"
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"
    assert isinstance(data, dict), "Response JSON is not an object"
    assert "ok" in data, "Response JSON does not contain 'ok' key"
    assert data["ok"] is True, "Response 'ok' key value is not True"

test_health_check_api_should_return_service_status()