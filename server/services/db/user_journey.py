from models.user_journey import UserJourney
from services.azure_mongodb import MongoDBClient
from pydantic import ValidationError
import logging

logger = logging.getLogger(__name__)

db = MongoDBClient.get_client()[MongoDBClient.get_db_name()]


def get_user_journey_by_user_id(user_id: str) -> UserJourney:
    """
    Retrieves the user's journey information, including mental health concerns, goals, and therapy plans, by the user's ID.
    """
    doc = db["user_journeys"].find_one({"user_id": user_id})
    if doc:
        # Convert strings in mental_health_concerns to MentalHealthConcern instances
        concerns = doc.get('mental_health_concerns', [])
        converted_concerns = []
        for concern in concerns:
            if isinstance(concern, str):
                converted_concerns.append({
                    "label": concern,
                    "severity": "unknown"
                })
            elif isinstance(concern, dict):
                converted_concerns.append(concern)
        doc['mental_health_concerns'] = converted_concerns

        try:
            return UserJourney(**doc)
        except ValidationError as e:
            print(f"Validation error: {e}")
            return None
    else:
        return None


