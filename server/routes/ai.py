import logging

from flask import jsonify
from flask import Blueprint, request
import json

from agents.mental_health_agent import MentalHealthAIAgent, ChatHistoryScope
from utils.consts import SYSTEM_MESSAGE

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ai_routes = Blueprint("ai", __name__)


@ai_routes.post("/ai/mental_health/welcome/<user_id>")
def get_mental_health_agent_welcome(user_id):
    agent = MentalHealthAIAgent()

    response = agent.get_initial_greeting(
                                    user_id=user_id
                                )
    
    return response


@ai_routes.post("/ai/mental_health/<user_id>/<chat_id>")
def run_mental_health_agent(user_id, chat_id):
    body = request.get_json()
    if not body:
        return jsonify({"error": "No data provided"}), 400
    
    prompt = body.get("prompt")
    turn_id = body.get("turn_id")

    agent = MentalHealthAIAgent()

    try:
            
        response = agent.run(
                                message=prompt,
                                with_history=True,
                                user_id=user_id,
                                chat_id=int(chat_id),
                                turn_id=turn_id + 1, 
                                history_scope=ChatHistoryScope.ALL
                            )

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