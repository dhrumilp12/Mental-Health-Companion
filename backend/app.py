"""
API entrypoint for backend API.
"""

from flask import Flask, request
from flask_cors import CORS

from models.ai_request import AIRequest
from classes.cosmic_works_ai_agent import CosmicWorksAIAgent

app = Flask(__name__)
CORS(app)

agent_pool = {}
@app.get("/")
def root():
    """
    Health probe endpoint.
    """    
    return {"status": "ready"}


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
    return { "message": agent_pool[session_id].run(prompt)}