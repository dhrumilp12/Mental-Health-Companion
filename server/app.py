"""
API entrypoint for backend API.
"""

from flask import Flask
from flask_cors import CORS

from routes.user import user_routes
from routes.ai import ai_routes


# Set up the app
app = Flask(__name__)
CORS(app)

# Register routes
app.register_blueprint(user_routes)
app.register_blueprint(ai_routes)

# Base endpoint
@app.get("/")
def root():
    """
    Health probe endpoint.
    """    
    return {"status": "ready"}
