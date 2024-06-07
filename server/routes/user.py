import logging

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from bson import ObjectId

from werkzeug.security import generate_password_hash, check_password_hash
from models.user import User as UserModel
from tools.azure_mongodb import MongoDBClient



user_routes = Blueprint("user", __name__)

@user_routes.post('/user/signup')
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
            access_token = create_access_token(identity=username)
            return jsonify(access_token=access_token), 200
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
    db = db_client[MongoDBClient.get_db()]

    user_data = db['users'].find_one({"_id": ObjectId(user_id)})
    if user_data is None:
        return jsonify({"error": "User could not be found."}), 404
    
    user = UserModel(**user_data)
    return jsonify(user.model_dump(exclude={"password"})), 200


@user_routes.patch('/user/profile/<user_id>')
def update_profile_fields(user_id):
    update_fields = request.get_json()
    
    db_client = MongoDBClient.get_client()
    db = db_client[MongoDBClient.get_db()]

    result = db["users"].update_one({"_id": ObjectId(user_id)}, {"$set": update_fields})

    if result.matched_count == 0:
        return jsonify({"error": "User cannot be found."}), 404
    
    return jsonify({"message": "User has been updated successfully."}), 200


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
    
    except Exception as e:
        logging.error(f"Error logging mood: {str(e)}")
        return jsonify({"error": "Failed to log mood"}), 500


@user_routes.get('/user/get_mood_logs')
@jwt_required()
def get_mood_logs():
    try:
        current_user = get_jwt_identity()
        mood_logs = MongoDBClient.get_user_mood_logs(current_user)
        return jsonify({"mood_logs": [str(log) for log in mood_logs]}), 200
    
    except Exception as e:
        logging.error(f"Error retrieving mood logs: {str(e)}")
        return jsonify({"error": "Failed to retrieve mood logs"}), 500