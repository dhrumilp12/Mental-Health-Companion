from pydantic import BaseModel

class AIRequest(BaseModel):
    session_id:str
    prompt:str