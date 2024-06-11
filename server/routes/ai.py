import os
from datetime import datetime
import logging
from flask import jsonify
from flask import Blueprint, request
import json

from models.ai_request import AIRequest
from agents.mental_health_agent import MentalHealthAIAgent, ChatHistoryScope
from utils.consts import SYSTEM_MESSAGE

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ai_routes = Blueprint("ai", __name__)


@ai_routes.post("/ai/mental_health/welcome/<user_id>")
def get_mental_health_agent_welcome(user_id):
    # Here, it gets the initial state of the app
    ENV = os.environ.get("FLASK_ENV")
    timestamp = datetime.now().isoformat()

    agent = MentalHealthAIAgent(session_id=0, 
                        system_message=SYSTEM_MESSAGE, 
                        db_name=f"mental-health-{ENV}", 
                        schema=[])

    response = agent.get_initial_greeting(db_name=f"mental-health-{ENV}", 
                                collection_name="chatbot_logs", 
                                user_id=user_id, 
                                system_message=SYSTEM_MESSAGE, 
                                timestamp=timestamp)
    
    return response


@ai_routes.post("/ai/mental_health/<user_id>/<chat_id>")
def run_mental_health_agent(user_id, chat_id):
    ENV = os.environ.get("FLASK_ENV")
    body = request.get_json()
    if not body:
        return jsonify({"error": "No data provided"}), 400
    
    prompt = body.get("prompt")
    turn_id = body.get("turn_id")

    agent = MentalHealthAIAgent(session_id=0, 
                            system_message=SYSTEM_MESSAGE, 
                            db_name=f"mental-health-{ENV}", 
                            schema=[])

    timestamp = datetime.now().isoformat()
    try:
            
        response = agent.get_agent_response(f"mental-health-{ENV}", 
                                                        "chatbot_logs", 
                                                        SYSTEM_MESSAGE, 
                                                        prompt, 
                                                        user_id,
                                                        int(chat_id),
                                                        turn_id + 1, 
                                                        timestamp,
                                                        ChatHistoryScope.ALL)

        return jsonify(response), 200
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error: {str(e)}")
        return jsonify({"error": "Invalid JSON format"}), 400
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": str(e)}), 500


@ai_routes.post("/ai/mental_health/finalize/<user_id>/<chat_id>")
def set_mental_health_end_state(user_id, chat_id):
    # Simulate some logic to handle the end state
    try:
        # Your logic here, for example:
        logger.info(f"Finalizing chat {chat_id} for user {user_id}")

        # Potentially update the database or perform other cleanup operations
        # For now, let's assume it's a simple response:
        return jsonify({"message": "Chat session finalized successfully"}), 200

    except Exception as e:
        logger.error(f"Error during finalizing chat: {e}")
        return jsonify({"error": "Failed to finalize chat"}), 500