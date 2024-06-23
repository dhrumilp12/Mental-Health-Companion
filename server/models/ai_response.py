from pydantic import BaseModel

class AIResponse(BaseModel):
    session_id:str
    answer:str