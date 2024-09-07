"""This module contains a function to delete all data for a user from the database."""
import logging
from services.azure_mongodb import MongoDBClient

def delete_user_data(user_id):
    db_client = MongoDBClient.get_client()
    db = db_client[MongoDBClient.get_db_name()]

    collections_to_clear = [
        'user_journeys', 'chat_summaries', 'check_ins', 
        'search_history', 'user_materials', 'user_entities'
    ]
    for collection in collections_to_clear:
        db[collection].delete_many({"user_id": user_id})
    logging.info(f"All data for user {user_id} deleted successfully")
