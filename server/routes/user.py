import logging
from bson import json_util
import json
import csv
import io
import asyncio
import os
from dotenv import load_dotenv
from flask import Blueprint, request, jsonify, current_app,send_file
from time import sleep
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from bson import ObjectId, json_util
from datetime import timedelta,datetime
from werkzeug.security import generate_password_hash, check_password_hash

from services.azure_mongodb import MongoDBClient
from models.user import User as UserModel
from models.chat_summary import ChatSummary
from services.db import mood_log
from agents.mental_health_agent import MentalHealthAIAgent, HumanMessage
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from flask_mail import Message, Mail

load_dotenv()
mail = Mail()

def generate_reset_token(email):
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    return serializer.dumps(email, salt=current_app.config['SECURITY_PASSWORD_SALT'])

def verify_reset_token(token):
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        email = serializer.loads(token, salt=current_app.config['SECURITY_PASSWORD_SALT'], max_age=3600)
    except (SignatureExpired, BadSignature):
        return None
    return UserModel.find_by_email(email)

user_routes = Blueprint("user", __name__)

@user_routes.post('/user/signup')
def signup():
    try:
        logging.info("Starting user registration process")
        full_user_data = request.get_json()
        logging.info(f"Received user data: {full_user_data}")

        # Extracting mental health concerns and removing them from the user data
        mental_health_concerns = full_user_data.pop('mental_health_concerns', [])

        user = UserModel(**full_user_data)

        db_client = MongoDBClient.get_client()
        db = db_client[MongoDBClient.get_db_name()]
        
        # Check if user already exists with the same username or email
        logging.info("Checking for existing users")
        existing_user = db['users'].find_one({"$or": [{"username": user.username}, {"email": user.email}]})
        if existing_user:
            logging.info("User already exists")
            return jsonify({"error": "User with this username or email already exists"}), 409
        
        hashed_password = generate_password_hash(user.password)
        full_user_data['password'] = hashed_password
        result = db['users'].insert_one(full_user_data)
        if result:
            logging.info("User registration successful")
            user_id = result.inserted_id
            access_token = create_access_token(identity=str(user_id), expires_delta=timedelta(hours=48))

             # Create UserJourney entry with the previously extracted concerns
            user_journey_data = {
                'user_id': str(user_id),
                'mental_health_concerns': mental_health_concerns,
                'patient_goals': [],
                'therapy_plan': {}  # Adjust as per your actual model
            }
            db['user_journeys'].insert_one(user_journey_data)

            
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
    
    # Fetch mental health concerns from UserJourney
    journey_data = db['user_journeys'].find_one({"user_id": user_id})
    if journey_data:
        user_data['mental_health_concerns'] = journey_data.get('mental_health_concerns', [])
        print(user_data['mental_health_concerns'])
    
    # Remove sensitive information like passwords
    user_data.pop('password', None)
    
    # Convert _id from ObjectId to string if needed
    user_data['_id'] = str(user_data['_id'])

    return jsonify(user_data), 200


@user_routes.patch('/user/profile/<user_id>')
def update_profile_fields(user_id):
    update_fields = request.get_json()
    
    db_client = MongoDBClient.get_client()
    db = db_client[MongoDBClient.get_db_name()]

    # Update main user fields, excluding mental_health_concerns to avoid direct updates
    if 'mental_health_concerns' in update_fields:
        mental_health_concerns = update_fields.pop('mental_health_concerns')
        # Update mental health concerns in UserJourney
        db['user_journeys'].update_one({"user_id": user_id}, {"$set": {"mental_health_concerns": mental_health_concerns}})


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

@user_routes.post('/user/request_reset')
def request_password_reset():
    email = request.json.get('email')
    user = UserModel.find_by_email(email)
    if not user:
        return jsonify({"message": "No user found with this email"}), 404

    token = generate_reset_token(user.email)
    base_url = os.getenv('RESET_PASSWORD_BASE_URL', 'http://localhost:3000/reset_password/')  # Default if not set
    reset_url = f"{base_url}{token}"
    msg = Message("Password Reset Request", sender=os.getenv('MAIL_USERNAME'), recipients=[user.email])
    msg.body = f"Please click on the link to reset your password: {reset_url}"
    mail.send(msg)
    
    return jsonify({"message": "Check your email for the reset password link"}), 200

@user_routes.post('/user/reset_password/<token>')
def reset_password(token):
    new_password = request.json.get('password')
    user = verify_reset_token(token)
    if not user:
        return jsonify({"error": "Invalid or expired token"}), 403

    new_password_hash = generate_password_hash(new_password)
    user.update_password(user.username, new_password_hash)
    
    return jsonify({"message": "Password has been reset successfully"}), 200


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
        
        # Example logging statement using datetime correctly
        logging.info(f"Logging mood for {current_user} at {datetime.now()}")
        
        mood_log.log_user_mood(current_user, mood, activities)
        return jsonify({"message": "Mood logged successfully"}), 200
    
         
    
    except Exception as e:
        logging.error(f"Error logging mood: {str(e)}")
        return jsonify({"error": "Failed to log mood"}), 500


@user_routes.get('/user/get_mood_logs')
@jwt_required()
def get_mood_logs():
    try:
        current_user = get_jwt_identity()
        mood_logs = mood_log.get_user_mood_logs(current_user)
        mood_logs_json = json.loads(json_util.dumps(mood_logs))
        return jsonify({"mood_logs": mood_logs_json}), 200
    
    except Exception as e:
        logging.error(f"Error retrieving mood logs: {str(e)}")
        return jsonify({"error": "Failed to retrieve mood logs"}), 500
    

@user_routes.get('/user/download_chat_logs')
@jwt_required()
def download_chat_logs():
    try:
        current_user = get_jwt_identity()
        logging.info(f"Downloading chat logs for user {current_user}")
        
        chat_ids = ChatSummary.get_latest_chat_id(current_user)
        if not chat_ids:
            return jsonify({"message": "No chat sessions found for this user."}), 204
        
        csv_file = io.StringIO()
        csv_writer = csv.writer(csv_file)
        headers = ["Chat ID","Timestamp", "Content", "Source"]
        csv_writer.writerow(headers)

        for chat_id in chat_ids:
            session_id = f"{current_user}-{chat_id}"
            logging.info(f"Downloading chat logs for session {session_id}")
            agent = MentalHealthAIAgent()
            chat_logs = agent.get_session_history(session_id)

            if not chat_logs or not hasattr(chat_logs, 'aget_messages'):
                logging.warning(f"No chat logs available for session {session_id}")
                continue

            chat_log_entries = asyncio.run(chat_logs.aget_messages())

            for log in chat_log_entries:
                content = getattr(log, 'content', 'No Content Available')
                message_type = getattr(log, 'type', 'Unknown Type')
                timestamp = datetime.fromtimestamp(int(chat_id)).strftime('%Y-%m-%d %H:%M:%S')
                row = [chat_id,timestamp, content, message_type]
                csv_writer.writerow(row)

        csv_file.seek(0)

        return send_file(
            io.BytesIO(csv_file.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name='chat_logs.csv'
        )
    except Exception as e:
        logging.error(f"Error downloading chat logs: {str(e)}")
        return jsonify({"error": "Failed to download chat logs"}), 500
    

@user_routes.delete('/user/delete_chat_logs')
@jwt_required()
def delete_user_chat_logs():
    try:
        current_user = get_jwt_identity()
        logging.info(f"Request received to delete chat logs for user {current_user}")
        
        # Call the method to delete all chat logs
        result = ChatSummary.delete_all_user_chats(current_user)
        
        if result.deleted_count == 0:
            return jsonify({"message": "No chat logs found to delete for this user."}), 404
        
        return jsonify({"message": f"Successfully deleted {result.deleted_count} chat logs for the user."}), 200

    except Exception as e:
        logging.error(f"Error deleting chat logs: {str(e)}")
        return jsonify({"error": "Failed to delete chat logs"}), 500

@user_routes.delete('/user/delete_chat_logs/range')
@jwt_required()
def delete_user_chat_logs_in_range():
    logging.info("Entered the delete route")
    try:
        current_user = get_jwt_identity()
        logging.info(f"Current user: {current_user}")
        start_date = request.args.get('start_date', type=lambda s: datetime.strptime(s, '%Y-%m-%d'))
        end_date = request.args.get('end_date', type=lambda s: datetime.strptime(s, '%Y-%m-%d'))

        if not start_date or not end_date:
            logging.info("Start or end date not provided")
            return jsonify({"message": "You must provide both start and end dates in YYYY-MM-DD format."}), 400

        attempt_count = 0
        while attempt_count < 5:  # Retry up to 5 times
            attempt_count += 1
            try:
                result = ChatSummary.delete_user_chats_in_range(current_user, start_date, end_date)
                if result.deleted_count > 0:
                    logging.info(f"Deleted {result.deleted_count} chats")
                    return jsonify({"message": f"Successfully deleted {result.deleted_count} chat logs for the user."}), 200
                else:
                    logging.info("No chats found to delete")
                    return jsonify({"message": "No chat logs found to delete for this user in the specified range."}), 204
            except Exception as retry_exc:
                logging.error(f"Attempt {attempt_count}: {str(retry_exc)}")
                if 'RetryAfterMs' in str(retry_exc):
                    sleep(4)  # Sleep for 4 milliseconds before retrying
                else:
                    break

        return jsonify({"error": "Failed to delete chat logs after several attempts"}), 500

    except Exception as e:
        logging.error(f"Error deleting chat logs: {str(e)}")
        return jsonify({"error": "Failed to delete chat logs"}), 500
    


@user_routes.get('/user/download_chat_logs/range')
@jwt_required()
def download_chat_logs_in_range():
    try:
        current_user = get_jwt_identity()
        logging.info(f"Downloading chat logs for user {current_user} within a specific date range")

        start_date = request.args.get('start_date', type=lambda s: datetime.strptime(s, '%Y-%m-%d'))
        end_date = request.args.get('end_date', type=lambda s: datetime.strptime(s, '%Y-%m-%d'))
        
        if not start_date or not end_date:
            return jsonify({"message": "You must provide both start and end dates in YYYY-MM-DD format."}), 400

        start_chat_id = int(datetime.combine(start_date, datetime.min.time()).timestamp())
        end_chat_id = int(datetime.combine(end_date, datetime.max.time()).timestamp())

        db_client = MongoDBClient.get_client()
        db_name = MongoDBClient.get_db_name()
        db = db_client[db_name]
        chat_summary_collection = db["chat_summaries"]

        chat_ids = chat_summary_collection.find({
            "user_id": current_user,
            "chat_id": {"$gte": start_chat_id, "$lte": end_chat_id}
        })

        if not chat_ids:
            return jsonify({"message": "No chat sessions found for this user within the specified range."}), 204

        csv_file = io.StringIO()
        csv_writer = csv.writer(csv_file)
        headers = ["Chat ID", "Timestamp", "Content", "Source"]
        csv_writer.writerow(headers)

        agent = MentalHealthAIAgent()
        for chat in chat_ids:
            session_id = f"{current_user}-{chat['chat_id']}"
            logging.info(f"Downloading chat logs for session {session_id}")
            chat_logs = agent.get_session_history(session_id)

            if not chat_logs or not hasattr(chat_logs, 'aget_messages'):
                logging.warning(f"No chat logs available for session {session_id}")
                continue

            chat_log_entries = asyncio.run(chat_logs.aget_messages())

            for log in chat_log_entries:
                content = getattr(log, 'content', 'No Content Available')
                message_type = getattr(log, 'type', 'Unknown Type')
                timestamp = datetime.fromtimestamp(int(chat['chat_id'])).strftime('%Y-%m-%d %H:%M:%S')
                row = [chat['chat_id'], timestamp, content, message_type]
                csv_writer.writerow(row)

        csv_file.seek(0)

        return send_file(
            io.BytesIO(csv_file.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name='chat_logs_range.csv'
        )
    except Exception as e:
        logging.error(f"Error downloading chat logs: {str(e)}")
        return jsonify({"error": "Failed to download chat logs"}), 500
