from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId

class SearchResult(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()))
    title: str
    link: str
    description: str = None
    videoUrl: str = None  # Only for YouTube results
    searched_on: datetime = Field(default_factory=datetime.utcnow)

class SearchHistory(BaseModel):
    user_id: str
    queries: list[SearchResult]
