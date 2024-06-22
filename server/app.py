"""
API entrypoint for backend API.
"""
import os

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from models.subscription import db as sub_db
from routes.check_in import check_in_routes
from services.db.agent_facts import load_agent_facts_to_db

from routes.user import user_routes 
from routes.ai import ai_routes

# Set up the app
app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.environ.get("JWT_SECRET_KEY")

jwt = JWTManager(app)
CORS(app)

# Register routes
app.register_blueprint(user_routes)
app.register_blueprint(ai_routes)
app.register_blueprint(check_in_routes)

# DB pre-load
load_agent_facts_to_db()

# Subscription db
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mydatabase.db'
sub_db.init_app(app)
## Create the tables
with app.app_context():
    sub_db.create_all()

# Base endpoint
@app.get("/")
def root():
    """
    Health probe endpoint.
    """    
    return {"status": "ready"}
