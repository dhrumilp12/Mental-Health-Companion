"""
This model represents entities that may be significant to the user,
such as people, places and things of sentimental value.
"""

from pydantic import BaseModel

class UserEntity(BaseModel):
    user_id: str
    entity_id: str
    entity_data: list[str]