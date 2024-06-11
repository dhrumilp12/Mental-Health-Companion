"""
API entrypoint for backend API.
"""

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from routes.user import user_routes 
from routes.ai import ai_routes

# Set up the app
app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 't54WKRE5t5UaZnEWDvUd75Qe5ilYAKKe9n8tbUGv3_Q' #FIXME: This should be an environment variable.
jwt = JWTManager(app)
CORS(app)

# Register routes
app.register_blueprint(user_routes)
app.register_blueprint(ai_routes)


# Base endpoint
@app.get("/")
def root():
    """
    Health probe endpoint.
    """    
    return {"status": "ready"}
