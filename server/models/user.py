from pydantic import BaseModel, EmailStr, Field, field_validator, validator
from tools.azure_mongodb import MongoDBClient
import re
class User(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str = None
    age: int = Field(None, ge=0)  # Age should be a non-negative integer
    gender: str = Field(None, pattern='^(male|female|other)$')  # Example to validate gender
    place_of_residence: str = None
    field_of_work: str = None

    @field_validator('username')
    def username_alphanumeric(cls, v):
        assert v.isalnum(), 'must be alphanumeric'
        return v
    

    @classmethod
    def find_by_username(cls, username):
        db_client = MongoDBClient.get_client()
        db = db_client[MongoDBClient.get_db()]
        user_data = db.users.find_one({"username": username})  # 'users' is the collection name
        if user_data:
            return cls(**user_data)
        return None