"""
This model represents a summary of all the interactions users have had
with the chatbot within a session.
"""

from datetime import datetime
from pydantic import BaseModel
from services.azure_mongodb import MongoDBClient
from pymongo import MongoClient

class ConcernProgress(BaseModel):
    label: str
    delta: int


class ChatSummary(BaseModel):
    user_id: str
    chat_id: str
    perceived_mood: str
    summary_text: str = ""
    concerns_progress: list[ConcernProgress]

    @classmethod
    def get_latest_chat_id(cls, user_id):
        """
        Retrieves the latest chat ID for the given user from the MongoDB database.

        Args:
        user_id (str): The user's identifier.

        Returns:
        int: The latest chat ID or None if no chat found.
        """
        db_client = MongoDBClient.get_client()
        db_name = MongoDBClient.get_db_name()
        db = db_client[db_name]
        chat_summary_collection = db["chat_summaries"]

        # Find the latest chat ID for the given user, sorted by chat ID in descending order
        chat_ids = chat_summary_collection.find(
            {"user_id": user_id},
            sort=[("chat_id", -1)]
        )

        return [chat['chat_id'] for chat in chat_ids]

    @classmethod
    def delete_all_user_chats(cls, user_id):
        db_client = MongoDBClient.get_client()
        db_name = MongoDBClient.get_db_name()
        db = db_client[db_name]
        chat_summary_collection = db["chat_summaries"]

        # Delete all chat summaries for the given user
        result = chat_summary_collection.delete_many({"user_id": user_id})
        return result  # This will return a DeleteResult object which includes the count of deleted documents
    
    @classmethod
    def delete_user_chats_in_range(cls, user_id, start_date, end_date):
        db_client = MongoDBClient.get_client()
        db_name = MongoDBClient.get_db_name()
        db = db_client[db_name]
        chat_summary_collection = db["chat_summaries"]

        # Ensure dates include time for start and end to capture the full range
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())

        result = chat_summary_collection.delete_many({
            "user_id": user_id,
            "timestamp": {
                "$gte": start_datetime,
                "$lte": end_datetime
            }
        })
        return result  # This will return a DeleteResult object which includes the count of deleted documents