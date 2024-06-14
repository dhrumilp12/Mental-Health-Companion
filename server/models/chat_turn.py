"""
This model represents a turn, that is, a single human-AI interaction.
"""

from datetime import datetime
from pydantic import BaseModel


class ChatTurn(BaseModel):
    user_id: str
    chat_id: int
    turn_id: int
    human_message: str
    ai_message: str
    timestamp: datetime
