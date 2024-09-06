""" This module contains functions to format search results. """
from services.azure_mongodb import MongoDBClient
from bson import ObjectId
import json

def format_youtube_result(result):
    """Format the search result to return only necessary details."""
    return {
        'videoTitle': result['snippet']['title'],
        'description': result['snippet']['description'],
        'videoUrl': f"https://www.youtube.com/watch?v={result['id']['videoId']}"
    }

def format_result(result):
    """Format the search result to return only necessary details."""
    return {
        'title': result.get('title'),
        'snippet': result.get('snippet'),
        'link': result.get('link')
    }

def serialize_objectid(value):
    """Helper function to convert ObjectId to string."""
    if isinstance(value, ObjectId):
        return str(value)
    return value

def save_search_results(user_id, results):
    db_client = MongoDBClient.get_client()
    db = db_client[MongoDBClient.get_db_name()]
    history_record = {
        'user_id': user_id,
        'queries': results
    }
    db.search_history.insert_one(history_record)

def get_user_search_history(user_id):
    db_client = MongoDBClient.get_client()
    db = db_client[MongoDBClient.get_db_name()]
    history = db.search_history.find_one({'user_id': user_id})
    if history:
        # Recursively convert ObjectId instances to strings
        history = json.loads(json.dumps(history, default=serialize_objectid))
    return history

def delete_user_search_history(user_id):
    db_client = MongoDBClient.get_client()
    db = db_client[MongoDBClient.get_db_name()]
    db.search_history.delete_many({'user_id': user_id})