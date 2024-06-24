import pytest

import sys
sys.path.append(".")

from app import run_app
from services.azure_mongodb import MongoDBClient

@pytest.fixture
def app():
    app, _ = run_app()
    context = app.app_context()
    context.push()
    yield app
    context.pop()


@pytest.fixture
def db():
    db_client = MongoDBClient.get_client()
    db = db_client[MongoDBClient.get_db_name()]
    yield db
    db_client.close()