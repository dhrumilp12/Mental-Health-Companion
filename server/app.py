"""
API entrypoint for backend API.
"""

import logging
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.exceptions import InternalServerError
from werkzeug.security import generate_password_hash
from models.user import User as UserModel
from tools.azure_mongodb import MongoDBClient
from models.ai_request import AIRequest
from classes.cosmic_works_ai_agent import CosmicWorksAIAgent

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

agent_pool = {}
@app.get("/")
def root():
    """
    Health probe endpoint.
    """    
    return {"status": "ready"}

@app.route('/signup', methods=['POST'])
def signup():
    try:
        user_data = request.get_json()
        user = UserModel(**user_data)
        hashed_password = generate_password_hash(user.password)
        user_data['password'] = hashed_password
        db_client = MongoDBClient.get_client(os.getenv('DB_CONNECTION_STRING'))
        db = db_client['cosmic_works']
        result = MongoDBClient.save_user(db, user_data)
        if result:
            return jsonify({"message": "User registered successfully"}), 201
        else:
            return jsonify({"error": "Failed to register user"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.post("/ai/cosmic_works")
def run_cosmic_works_ai_agent():
    """
    Run the Cosmic Works AI agent.
    """
    request_data:AIRequest = request.get_json()
    session_id = request_data.get("session_id")
    prompt = request_data.get("prompt")

    if session_id not in agent_pool:
        agent_pool[session_id] = CosmicWorksAIAgent(session_id)
    return {"message": agent_pool[session_id].run(prompt)}

@app.get("/query_openai/")
async def openai_query(prompt: str):
    try:
        response = AIRequest.query_ai(prompt)
        if response is None:
            raise InternalServerError(description="OpenAI query returned no response")
        return {"response": response}
    except Exception as e:
        logger.error(f"OpenAI query failed: {str(e)}")
        raise InternalServerError(description=f"OpenAI query failed: {str(e)}")