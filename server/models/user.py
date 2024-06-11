from pydantic import BaseModel, EmailStr, Field, field_validator, validator
from services.azure_mongodb import MongoDBClient

import re
class User(BaseModel):
    id: str = None
    username: str = Field(..., min_length=3, max_length=20)
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str = None
    age: int = Field(None, ge=18)  # Age should be a non-negative integer
    gender: str = Field(None, pattern='^(male|female|other)$')  # Example to validate gender
    placeOfResidence: str = None
    fieldOfWork: str = None

    @field_validator('username')
    def username_alphanumeric(cls, v):
        assert v.isalnum(), 'must be alphanumeric'
        return v
    

    @classmethod
    def find_by_username(cls, username):
        db_client = MongoDBClient.get_client()
        db = db_client[MongoDBClient.get_db_name()]
        user_data = db.users.find_one({"username": username})  # 'users' is the collection name
        if user_data:
            user_data['id'] = str(user_data['_id'])
            return cls(**user_data)
        return None