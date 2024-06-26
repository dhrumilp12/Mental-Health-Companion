from services.azure_mongodb import MongoDBClient

import logging
import json

from pymongo.collection import ReturnDocument
from bson.objectid import ObjectId
from bson.errors import InvalidId

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


db = MongoDBClient.get_client()[MongoDBClient.get_db_name()]


def save_user(db, user_data):
    try:
        result = db['users'].find_one_and_update(
            {"username": user_data['username']},
            {"$set": user_data},
            upsert=True,
            return_document=ReturnDocument.AFTER
        )
        logger.info("User saved or updated.")
        return result
    except Exception as e:
        logger.error(f"Error saving user: {str(e)}")
        raise


def get_user_profile_by_user_id(user_id: str) -> str:
    """
    Retrieves a user's profile information by the user's ID to be used when brought up in conversation.
    Includes age, name and location. Exclude if user ID is `0`, as this indicates it is an anonymous user.
    """
    try:
        user_objectid = ObjectId(user_id)
    except InvalidId as e:
        logger.error(f"Invalid user ID: {str(e)}")
        return ""

    doc = db["users"].find_one({"_id": user_objectid}, {"password": 0, "email": 0})
    if "contentVector" in doc:
        del doc["contentVector"]
    return json.dumps(doc, default=str)
