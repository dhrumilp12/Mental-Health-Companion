"""
    This model captures details about the agent that the agent may be asked about,
    such as when it was built, or who built it.
"""

from pydantic import BaseModel

class AgentFact(BaseModel):
    sample_query: str
    fact: str