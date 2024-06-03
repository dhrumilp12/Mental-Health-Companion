import sys
sys.path.append(".")

from app import app

def test_health_probe_endpoint():
    """
    Test to ensure server is starting up.
    """
    response = app.test_client().get("/")

    assert response.status_code == 200
    assert response.is_json
    response_data = response.get_json()
    assert response_data.get("status") == "ready"