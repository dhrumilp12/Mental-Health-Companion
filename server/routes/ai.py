import logging

from flask import jsonify
from flask import Blueprint, request
import json
from services.speech_service import speech_to_text
from agents.mental_health_agent import MentalHealthAIAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ai_routes = Blueprint("ai", __name__)

@ai_routes.post("/ai/mental_health/welcome/<user_id>")
def get_mental_health_agent_welcome(user_id):
    agent = MentalHealthAIAgent(tool_names=["location_search", "web_search_bing", "user_profile_retrieval", "agent_facts"])

    response = agent.get_initial_greeting(
                                    user_id=user_id
                                )
    
    if response is None:
        logger.error(f"No greeting found for user {user_id}")
        return jsonify({"error": "Greeting not found"}), 404
    
    return jsonify(response), 200


@ai_routes.post("/ai/mental_health/<user_id>/<chat_id>")
def run_mental_health_agent(user_id, chat_id):
    body = request.get_json()
    if not body:
        return jsonify({"error": "No data provided"}), 400
    
    prompt = body.get("prompt")
    turn_id = body.get("turn_id")

    agent = MentalHealthAIAgent(tool_names=["location_search", "web_search_bing", "user_profile_retrieval", "agent_facts"])

    try:
            
        response = agent.run(
                                message=prompt,
                                with_history=True,
                                user_id=user_id,
                                chat_id=int(chat_id),
                                turn_id=turn_id + 1, 
                            )

        return jsonify(response), 200
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error: {str(e)}")
        return jsonify({"error": "Invalid JSON format"}), 400
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": str(e)}), 500


@ai_routes.patch("/ai/mental_health/finalize/<user_id>/<chat_id>")
def set_mental_health_end_state(user_id, chat_id):
    try:
        logger.info(f"Finalizing chat {chat_id} for user {user_id}")
        agent = MentalHealthAIAgent(tool_names=["location_search", "web_search_bing", "user_profile_retrieval", "agent_facts"])

        agent.perform_final_processes(user_id, chat_id)

        # Potentially update the database or perform other cleanup operations
        # For now, let's assume it's a simple response:
        return jsonify({"message": "Chat session finalized successfully"}), 200

    except Exception as e:
        logger.error(f"Error during finalizing chat: {e}")
        return jsonify({"error": "Failed to finalize chat"}), 500
    

@ai_routes.post("/ai/mental_health/voice-to-text")
def handle_voice_input():
        # Check if the part 'audio' is present in files
        if 'audio' not in request.files:
            return jsonify({'error': 'Audio file is required'}), 400
        # Assume the voice data is sent as a file or binary data
        voice_data = request.files['audio']

        # Save the temporary audio file if needed or pass directly to the speech_to_text function
        text_output = speech_to_text(voice_data)
        
        if text_output:
            return jsonify({'message': text_output}), 200
        else:
            return jsonify({'error': 'Speech recognition failed'}), 400