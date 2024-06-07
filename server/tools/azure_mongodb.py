import os
import time
import random
import logging
import requests
import pymongo
from pymongo import UpdateOne, ReturnDocument
import mongomock
from flask import g
from datetime import datetime

from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load settings from the .env file
load_dotenv()

class MongoDBClient:
    _client = None
    _db_name = None

    @staticmethod
    def get_mongodb_variables():
        CONNECTION_STRING = os.environ.get("DB_CONNECTION_STRING")
        return CONNECTION_STRING

    @classmethod
    def get_client(cls):
        CONNECTION_STRING = MongoDBClient.get_mongodb_variables()
        ENV = os.environ.get("FLASK_ENV")
        
        if cls._client is None:
            if ENV == "test":
                cls._client = mongomock.MongoClient()
                # g.db = cls.get_client
            else:
                cls._client = pymongo.MongoClient(CONNECTION_STRING)
                # g.db = cls.get_client

        return cls._client
    
    @classmethod
    def get_db(cls):
        ENV = os.environ.get("FLASK_ENV")
        APP_NAME = "mental-health"

        # sets the db based on the environment
        if cls._db_name is None:
            cls._db_name = f"{APP_NAME}-{ENV}"
        
        return cls._db_name


    @staticmethod    
    def clear_collections(db, collection_names):
        try:
            def delete_operation():
                for coll_name in collection_names:
                    db[coll_name].delete_many({})

            MongoDBClient.execute_with_retries(delete_operation)
            logger.info("Cleared existing data in collections.")
        except Exception as e:
            logger.error(f"Error clearing collections: {str(e)}")
            raise            


    @staticmethod 
    def load_products(db, dataset, Model, coll_name):
        try:
            raw_data = dataset
            response = requests.get(raw_data)
            response_as_json = response.json()
            valid_objs = [Model(**data) for data in response_as_json]

            def bulk_write_operation():
                db[coll_name].bulk_write([UpdateOne({"_id": obj.id}, {"$set": obj.dict(by_alias=True)}, upsert=True) for obj in valid_objs])

            if valid_objs:
                MongoDBClient.execute_with_retries(bulk_write_operation)
                logger.info(f"Loaded {len(valid_objs)} {coll_name}.")
                return valid_objs  # Ensure objects are returned
            else:
                logger.warning(f"No valid {coll_name} to load.")
                return []
        except Exception as e:
            logger.error(f"Error loading {coll_name}: {str(e)}")
            raise


    @staticmethod
    def execute_with_retries(operation, max_retries=5):
        retries = 0
        while retries < max_retries:
            try:
                return operation()
            except (pymongo.errors.BulkWriteError, pymongo.errors.WriteError) as e:
                retry_after_ms = 100  # Default retry interval
                if hasattr(e, 'details'):
                    # Extracting retry after ms from BulkWriteError
                    retry_after_ms = max(
                        (int(err.get('errmsg', '').split('RetryAfterMs=')[1].split(',')[0]) 
                        for err in e.details.get('writeErrors', []) 
                        if 'RetryAfterMs=' in err.get('errmsg', '')),
                        default=100
                    )
                elif 'RetryAfterMs' in str(e):
                    # Extracting retry after ms from WriteError
                    retry_after_msg = str(e).split("RetryAfterMs=")[1]
                    retry_after_ms = int(retry_after_msg.split(',')[0])

                sleep_time = max(retry_after_ms / 1000.0, 1.0) + random.uniform(0.05, 0.1)
                time.sleep(sleep_time)
                retries += 1
                print(f"Retrying after {sleep_time} seconds...")
            except Exception as e:
                print(f"Error during operation: {e}")
                raise
        raise Exception("Maximum retries exceeded")
    
    @staticmethod
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

    @staticmethod
    def log_user_mood(user_id, mood, activities):
        try:
            client = MongoDBClient.get_client()
            db = client[MongoDBClient.get_db()]  # Get the database instance
            db.mood_logs.insert_one({
                "user_id": user_id,
                "mood": mood,
                "activities": activities,
                "timestamp": datetime.now()
            })
        except pymongo.errors.PyMongoError as e:
            logging.error(f"Error logging mood: {str(e)}")
            raise
        
    @staticmethod
    def get_user_mood_logs(user_id):
        try:
            client = MongoDBClient.get_client()
            db = client[MongoDBClient.get_db()]  # Get the database instance
            return list(db.mood_logs.find({"user_id": user_id}))
        except pymongo.errors.PyMongoError as e:
            logging.error(f"Error retrieving mood logs: {str(e)}")
            raise