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
    elif isinstance(value, dict):
        return {k: serialize_objectid(v) for k, v in value.items()}
    elif isinstance(value, list):
        return [serialize_objectid(item) for item in value]
    return value

def save_search_results(user_id, results, search_type):
    db_client = MongoDBClient.get_client()
    db = db_client[MongoDBClient.get_db_name()]
    history_record = {
        'user_id': user_id,
        'queries': results,
        'search_type': search_type
    }
    db.search_history.insert_one(history_record)

def get_user_search_history(user_id):
    db_client = MongoDBClient.get_client()
    db = db_client[MongoDBClient.get_db_name()]
    history = db.search_history.find({'user_id': user_id})
    return serialize_objectid(list(history))

def delete_user_search_history(user_id):
    db_client = MongoDBClient.get_client()
    db = db_client[MongoDBClient.get_db_name()]
    db.search_history.delete_many({'user_id': user_id})