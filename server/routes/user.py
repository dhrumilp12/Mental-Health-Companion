import os
from flask import Blueprint, request, jsonify

from werkzeug.security import generate_password_hash
from models.user import User as UserModel
from tools.azure_mongodb import MongoDBClient

user_routes = Blueprint("user", __name__)

@user_routes.post('/signup')
def signup():
    try:
        user_data = request.get_json()
        user = UserModel(**user_data)
        hashed_password = generate_password_hash(user.password)
        user_data['password'] = hashed_password
        db_client = MongoDBClient.get_client(os.getenv('DB_CONNECTION_STRING'))
        db = db_client['cosmic_works']
        result = MongoDBClient.save_user(db, user_data)
        if result:
            return jsonify({"message": "User registered successfully"}), 201
        else:
            return jsonify({"error": "Failed to register user"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 400
