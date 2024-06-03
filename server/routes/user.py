import logging

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

from werkzeug.security import generate_password_hash, check_password_hash
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

@user_routes.post('/anonymous_signin')
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
    
@user_routes.post('/login')
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

    
@user_routes.post('/logout')
@jwt_required()
def logout():
    # JWT Revocation or Blacklisting could be implemented here if needed
    jwt_id = get_jwt_identity()
    logging.info(f"User {jwt_id} logged out successfully")
    return jsonify({"msg": "Logout successful"}), 200