import os
from datetime import datetime
import logging

from flask import Blueprint, request
from werkzeug.exceptions import InternalServerError

from models.ai_request import AIRequest
from classes.cosmic_works_ai_agent import CosmicWorksAIAgent

from tools.langchain import get_langchain_agent_response

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ai_routes = Blueprint("ai", __name__)

agent_pool = {}
@ai_routes.post("/ai/cosmic_works")
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
    

@ai_routes.post("/ai/mental_health/<user_id>")
def run_mental_health_agent(user_id):
    ENV = os.environ.get("FLASK_ENV")
    body = request.get_json()

    prompt = body.get("prompt")

    system_message = """
    Your name is Aria, a therapy companion.

    You are a patient, empathetic virtual therapist. Your purpose is not to replace human therapists, but to help bridge the gap when human therapists are not available.
    
    Your job is to gently guide the user, your patient, through their mental healing journey.

    You will speak in a natural, concise, and casual tone. Do not be verbose. Your role is not to ramble about theory, but to support and listen to your patient. 
    If you do not know the answer of a question, do not give a `I am a virtual assistant` disclaimer. Just say "I don't know".

    To begin, politely introduce yourself to your patient and explain your purpose.
    """

    timestamp = datetime.now().isoformat()

    response_message = get_langchain_agent_response(f"mental-health-{ENV}", "chatbot_logs", system_message, prompt, user_id, timestamp)

    return {"message": response_message}
