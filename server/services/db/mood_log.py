import logging
from datetime import datetime
from pymongo.errors import PyMongoError

from services.azure_mongodb import MongoDBClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@staticmethod
def log_user_mood(user_id, mood, activities):
    try:
        client = MongoDBClient.get_client()
        db = client[MongoDBClient.get_db_name()]  # Get the database instance
        db.mood_logs.insert_one({
            "user_id": user_id,
            "mood": mood,
            "activities": activities,
            "timestamp": datetime.now()
        })
    except PyMongoError as e:
        logging.error(f"Error logging mood: {str(e)}")
        raise
    
@staticmethod
def get_user_mood_logs(user_id):
    try:
        client = MongoDBClient.get_client()
        db = client[MongoDBClient.get_db_name()]  # Get the database instance
        return list(db.mood_logs.find({"user_id": user_id}))
    except PyMongoError as e:
        logging.error(f"Error retrieving mood logs: {str(e)}")
        raise