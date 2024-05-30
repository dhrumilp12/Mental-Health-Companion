"""
API entrypoint for backend API.
"""

import uvicorn

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models.ai_request import AIRequest
from classes.cosmic_works_ai_agent import CosmicWorksAIAgent

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

agent_pool = {}


@app.get("/")
def root():
    """
    Health probe endpoint.
    """    
    return {"status": "ready"}

@app.post("/ai/cosmic_works")
def run_cosmic_works_ai_agent(request: AIRequest):
    """
    Run the Cosmic Works AI agent.
    """
    if request.session_id not in agent_pool:
        agent_pool[request.session_id] = CosmicWorksAIAgent(request.session_id)
    return { "message": agent_pool[request.session_id].run(request.prompt)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)