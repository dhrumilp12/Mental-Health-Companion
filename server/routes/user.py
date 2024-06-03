import logging

from flask import Blueprint, request, jsonify

from werkzeug.security import generate_password_hash
from models.user import User as UserModel
from tools.azure_mongodb import MongoDBClient

user_routes = Blueprint("user", __name__)

@user_routes.post('/signup')
def signup():
    try:
        logging.info("Starting user registration process")
        user_data = request.get_json()
        logging.info(f"Received user data: {user_data}")

        user = UserModel(**user_data)

        db_client = MongoDBClient.get_client()
        db = db_client[MongoDBClient.get_db()]
        
        # Check if user already exists with the same username or email
        logging.info("Checking for existing users")
        existing_user = db['users'].find_one({"$or": [{"username": user.username}, {"email": user.email}]})
        if existing_user:
            logging.info("User already exists")
            return jsonify({"error": "User with this username or email already exists"}), 409
        
        hashed_password = generate_password_hash(user.password)
        user_data['password'] = hashed_password
        result = MongoDBClient.save_user(db, user_data)
        if result:
            logging.info("User registration successful")
            return jsonify({"message": "User registered successfully"}), 201
        else:
            logging.error("Failed to in context_save")
            return jsonify({"error": "Failed to register user"}), 500
    except Exception as e:
        logging.error(f"Exception during time_registration: {str(e)}")
        return jsonify({"error": str(e)}), 400
