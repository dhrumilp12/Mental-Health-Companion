"""
This model represents user's relationship to therapy resources.
"""

from pydantic import BaseModel

class UserMaterial(BaseModel):
    user_id: str
    resource_id: str
    user_liked: bool
    user_viewed: bool