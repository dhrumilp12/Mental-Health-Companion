"""
This model represents a summary of all the interactions users have had
with the chatbot within a session.
"""

from datetime import datetime
from pydantic import BaseModel


class ConcernProgress(BaseModel):
    label: str
    delta: int


class ChatSummary(BaseModel):
    user_id: str
    chat_id: str
    perceived_mood: str
    summary_text: str = ""
    concerns_progress: list[ConcernProgress]
