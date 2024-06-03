"""
API entrypoint for backend API.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.exceptions import InternalServerError
from werkzeug.security import generate_password_hash
from models.user import User as UserModel
from classes.cosmic_works_ai_agent import CosmicWorksAIAgent
from routes.user import user_routes
from routes.ai import ai_routes

app = Flask(__name__)
CORS(app)

app.register_blueprint(user_routes)
app.register_blueprint(ai_routes)

@app.get("/")
def root():
    """
    Health probe endpoint.
    """    
    return {"status": "ready"}
