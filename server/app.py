"""
API entrypoint for backend API.
"""
import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from routes.user import user_routes 
from routes.ai import ai_routes

from agents.mental_health_agent import MentalHealthAIAgent

# Set up the app
app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.environ.get("JWT_SECRET_KEY")
jwt = JWTManager(app)
CORS(app)

# Register routes
app.register_blueprint(user_routes)
app.register_blueprint(ai_routes)

# DB pre-load
MentalHealthAIAgent.load_agent_facts_to_db()

# Base endpoint
@app.get("/")
def root():
    """
    Health probe endpoint.
    """    
    return {"status": "ready"}
