"""
API entrypoint for backend API.
"""
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required , get_jwt_identity
from models.subscription import Subscription,db
import json
from routes.user import user_routes 
from routes.ai import ai_routes
from routes.checkIn import checkIn_routes
from services.azure_mongodb import MongoDBClient
from services.scheduler import send_push_notification
from agents.mental_health_agent import MentalHealthAIAgent

# Set up the app
app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.environ.get("JWT_SECRET_KEY")
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mydatabase.db'

jwt = JWTManager(app)
CORS(app)

db.init_app(app)


# Create the tables
with app.app_context():
    db.create_all()

@app.route('/subscribe', methods=['POST'])
@jwt_required()
def subscribe():
    data = request.json
    print(f"Received subscription data: {data}")
    
    if not data or 'endpoint' not in data or 'keys' not in data or 'p256dh' not in data['keys'] or 'auth' not in data['keys']:
        return jsonify({'error': 'Missing required fields'}), 400
    
    
    subscription_info = json.dumps({
        'endpoint': data['endpoint'],
        'keys': {
            'p256dh': data['keys']['p256dh'],
            'auth': data['keys']['auth']
        }
    })

    user_id = get_jwt_identity()

    # Check if the subscription already exists
    existing_subscription = Subscription.query.filter_by(user_id=user_id).first()
    if existing_subscription:
         # Update existing subscription
        existing_subscription.subscription_info = subscription_info
    else:
        # Create new subscription
        new_subscription = Subscription(user_id=user_id, subscription_info=subscription_info)
        db.session.add(new_subscription)
    
    db.session.commit()

    return jsonify({'message': 'Subscription saved successfully'}), 200

@app.route('/send_push', methods=['POST'])
@jwt_required()
def send_push():
    data = request.json
    user_id = data['user_id']
    message = data['message']
    success = send_push_notification(user_id, message)
    if success:
        return jsonify({'message': 'Push notification sent successfully'}), 200
    else:
        return jsonify({'error': 'Failed to send push notification'}), 500


# Register routes
app.register_blueprint(user_routes)
app.register_blueprint(ai_routes)
app.register_blueprint(checkIn_routes)


# DB pre-load
MentalHealthAIAgent.load_agent_facts_to_db()

# Base endpoint
@app.get("/")
def root():
    """
    Health probe endpoint.
    """    
    return {"status": "ready"}
