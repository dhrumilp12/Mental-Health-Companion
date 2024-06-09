import os
from datetime import datetime
import logging

from flask import Blueprint, request
from werkzeug.exceptions import InternalServerError

from models.ai_request import AIRequest
from classes.cosmic_works_ai_agent import CosmicWorksAIAgent

from tools.langchain import get_initial_greeting, get_langchain_agent_response, ChatHistoryScope

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
    

@ai_routes.post("/ai/mental_health/welcome/<user_id>")
def get_mental_health_agent_welcome(user_id):
    # Here, it gets the initial state of the app
    ENV = os.environ.get("FLASK_ENV")
    timestamp = datetime.now().isoformat()

    system_message = """
    Your name is Aria, you are a therapy companion.

    You are a patient, empathetic virtual therapist. Your purpose is not to replace human therapists, but to lend aid when human therapists are not available.
    
    Your job is to gently guide the user, your patient, through their mental healing journey.

    You will speak in a natural, concise, and casual tone. Do not be verbose. Your role is not to ramble about psychology theory, but to support and listen to your patient. 
    If you do not know the answer of a question, do not give a `I am a virtual assistant` disclaimer, instead, honestly state that you don't know the answer.
    """

    response_message = get_initial_greeting(db_name=f"mental-health-{ENV}", 
                                collection_name="chatbot_logs", 
                                user_id=user_id, 
                                system_message=system_message, 
                                timestamp=timestamp)
    
    
    return {"message": response_message}


@ai_routes.post("/ai/mental_health/<user_id>/<chat_id>")
def run_mental_health_agent(user_id, chat_id):
    ENV = os.environ.get("FLASK_ENV")
    body = request.get_json()

    prompt = body.get("prompt")
    turn_id = body.get("turn_id")

    system_message = """
    You are a therapy companion.

    You are a patient, empathetic virtual therapist. Your purpose is not to replace human therapists, but to lend aid when human therapists are not available.
    
    Your job is to gently guide the user, your patient, through their mental healing journey. You must be proactive and ask questions that will motivate the patient to engage.

    You will speak in a natural, concise, and casual tone. Do not be verbose. Your role is not to ramble about psychology theory, but to support and listen to your patient. 
    If you do not know the answer of a question, honestly state that you don't know the answer. Do not make up an answer.
    """

    timestamp = datetime.now().isoformat()

    response_message = get_langchain_agent_response(f"mental-health-{ENV}", 
                                                    "chatbot_logs", 
                                                    system_message, 
                                                    prompt, 
                                                    user_id,
                                                    int(chat_id),
                                                    turn_id + 1, 
                                                    timestamp,
                                                    ChatHistoryScope.ALL)

    return {"message": response_message}


@ai_routes.post("/ai/mental_health/finalize/<user_id>/<chat_id>")
def set_mental_health_end_state(user_id):
    # Here, it gets the initial state of the app
    pass