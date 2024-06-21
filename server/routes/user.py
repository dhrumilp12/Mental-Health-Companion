import logging
from bson import json_util
import json

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import timedelta,datetime
from werkzeug.security import generate_password_hash, check_password_hash

from models.user import User as UserModel
from services.azure_mongodb import MongoDBClient

user_routes = Blueprint("user", __name__)

@user_routes.post('/user/signup')
def signup():
    try:
        logging.info("Starting user registration process")
        user_data = request.get_json()
        logging.info(f"Received user data: {user_data}")

        user = UserModel(**user_data)

        db_client = MongoDBClient.get_client()
        db = db_client[MongoDBClient.get_db_name()]
        
        # Check if user already exists with the same username or email
        logging.info("Checking for existing users")
        existing_user = db['users'].find_one({"$or": [{"username": user.username}, {"email": user.email}]})
        if existing_user:
            logging.info("User already exists")
            return jsonify({"error": "User with this username or email already exists"}), 409
        
        hashed_password = generate_password_hash(user.password)
        user_data['password'] = hashed_password
        result = db['users'].insert_one(user_data)
        if result:
            logging.info("User registration successful")
            user_id = result.inserted_id
            access_token = create_access_token(identity=str(user_id), expires_delta=timedelta(hours=24))
            return jsonify({"message": "User registered successfully", "access_token": access_token, "userId": str(user_id)}), 201
        else:
            logging.error("Failed to save user")
            return jsonify({"error": "Failed to register user"}), 500
    except Exception as e:
        logging.error(f"Exception during registration: {str(e)}")
        return jsonify({"error": str(e)}), 400


@user_routes.post('/user/anonymous_signin')
def anonymous_signin():
    try:
        # Set a reasonable expiration time for tokens, e.g., 24 hours
        #expires = timedelta(hours=24)

        identity = {'anonymous': True}
        access_token = create_access_token(identity=identity, expires_delta=False)  # Token never expires; adjust as needed
        logging.info("create access token successful")
        return jsonify(access_token=access_token), 200

    except Exception as e:
        # Log the error and return an appropriate error message
        logging.error(f"Failed to create access token: {str(e)}")
        return jsonify({"msg": "Failed to create access token"}), 500
    

@user_routes.post('/user/login')
def login():
    try:
        username = request.json.get('username', None)
        password = request.json.get('password', None)
        
        if not username or not password:
            return jsonify({"msg": "Missing username or password"}), 400

        user = UserModel.find_by_username(username)  # You need to implement this method in your User model
        if user and check_password_hash(user.password, password):
            access_token = create_access_token(identity=str(user.id), expires_delta=timedelta(hours=24))
            return jsonify(access_token=access_token, userId=str(user.id)), 200
        else:
            return jsonify({"msg": "Bad username or password"}), 401
    
    except Exception as e:
            logging.error(f"Login error: {str(e)}")
            return jsonify({"error": str(e)}), 500

    
@user_routes.post('/user/logout')
@jwt_required()
def logout():
    # JWT Revocation or Blacklisting could be implemented here if needed
    jwt_id = get_jwt_identity()
    logging.info(f"User {jwt_id} logged out successfully")
    return jsonify({"msg": "Logout successful"}), 200


@user_routes.get('/user/profile/<user_id>')
def get_public_profile(user_id):
    db_client = MongoDBClient.get_client()
    db = db_client[MongoDBClient.get_db_name()]

    user_data = db['users'].find_one({"_id": ObjectId(user_id)})
    if user_data is None:
        return jsonify({"error": "User could not be found."}), 404
    
    user = UserModel(**user_data)
    return jsonify(user.model_dump(exclude={"password"})), 200


@user_routes.patch('/user/profile/<user_id>')
def update_profile_fields(user_id):
    update_fields = request.get_json()
    
    db_client = MongoDBClient.get_client()
    db = db_client[MongoDBClient.get_db_name()]

    result = db["users"].update_one({"_id": ObjectId(user_id)}, {"$set": update_fields})

    if result.matched_count == 0:
        return jsonify({"error": "User cannot be found."}), 404
    
    return jsonify({"message": "User has been updated successfully."}), 200


@user_routes.patch('/user/change_password/<user_id>')
def change_password(user_id):
    try:
        # Authenticate user
        user_data = request.get_json()
        current_password = user_data['current_password']
        new_password = user_data['new_password']

        user = UserModel.find_by_id(user_id)
        if not user:
                logging.error("User not found")
                return jsonify({"error": "User not found"}), 404

        # Verify current password
        if not check_password_hash(user.password, current_password):
            logging.error("Incorrect current password")
            return jsonify({"error": "Incorrect current password"}), 403

        # Update to new password
        new_password_hash = generate_password_hash(new_password)
        if user.update_password(user.username, new_password_hash):
            logging.info("Password updated successfully")
            return jsonify({"message": "Password successfully updated"}), 200
        else:
            logging.error("Password update failed")
            return jsonify({"error": "Password update failed"}), 500
    except KeyError as e:
        logging.error(f"Missing data: {str(e)}")
        return jsonify({"error": "Missing data"}), 400
    except Exception as e:
        logging.error(f"Error changing password: {str(e)}")
        return jsonify({"error": str(e)}), 500


@user_routes.post('/user/log_mood')
@jwt_required()
def log_mood():
    try:
        current_user = get_jwt_identity()
        request_data = request.get_json()
        mood = request_data.get('mood')
        activities = request_data.get('activities')
        
        # Validate data
        if not mood or not activities:
            return jsonify({"message": "Missing data for mood or activities"}), 400
        
        MongoDBClient.log_user_mood(current_user, mood, activities)
        return jsonify({"message": "Mood logged successfully"}), 200
    
         # Example logging statement using datetime correctly
        logging.info(f"Logging mood for {current_user} at {datetime.now()}")
    
    except Exception as e:
        logging.error(f"Error logging mood: {str(e)}")
        return jsonify({"error": "Failed to log mood"}), 500


@user_routes.get('/user/get_mood_logs')
@jwt_required()
def get_mood_logs():
    try:
        current_user = get_jwt_identity()
        mood_logs = MongoDBClient.get_user_mood_logs(current_user)
        mood_logs_json = json.loads(json_util.dumps(mood_logs))
        return jsonify({"mood_logs": mood_logs_json}), 200
    
    except Exception as e:
        logging.error(f"Error retrieving mood logs: {str(e)}")
        return jsonify({"error": "Failed to retrieve mood logs"}), 500