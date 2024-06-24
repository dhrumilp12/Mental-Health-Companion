import sys
sys.path.append(".")

import warnings
# Ignore pkg_resources warning caused by the mongomock 3rd party library
warnings.filterwarnings("ignore", category=DeprecationWarning, message=".*pkg_resources.*")


def test_health_probe_endpoint(app):
    """
    Test to ensure server is starting up.
    """
    response = app.test_client().get("/")

    assert response.status_code == 200
    assert response.is_json
    response_data = response.get_json()
    assert response_data.get("status") == "ready"