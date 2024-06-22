"""
This model represents a turn, that is, a single human-AI interaction.
"""
from pydantic import BaseModel, Json


class ChatTurn(BaseModel):
    SessionId: str
    History: Json

