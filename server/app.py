"""
API entrypoint for backend API.
"""
from dotenv import load_dotenv
import os

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from models.subscription import db as sub_db
from routes.check_in import check_in_routes
from services.db.agent_facts import load_agent_facts_to_db

from routes.user import user_routes 
from routes.ai import ai_routes
from flask_mail import Mail

load_dotenv()



def run_app():
    # Set up the app
    app = Flask(__name__)
    app.config['JWT_SECRET_KEY'] = os.environ.get("JWT_SECRET_KEY")
    app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_PORT'] = 465
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
    app.config['MAIL_USE_SSL'] = True
    app.config['MAIL_USE_TLS'] = False
    app.config['SECURITY_PASSWORD_SALT'] = os.getenv("SECURITY_PASSWORD_SALT")
     # Debugging statements
    print("SECRET_KEY:", app.config['SECRET_KEY'])
    print("SECURITY_PASSWORD_SALT:", app.config['SECURITY_PASSWORD_SALT'])
    print("Loaded SECURITY_PASSWORD_SALT:", os.getenv("SECURITY_PASSWORD_SALT"))


    mail = Mail(app)
    jwt = JWTManager(app)
    cors_config = {

        r"*": {
            "origins": ["https://mental-health-app-web.azurewebsites.net", "127.0.0.1"],
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            "allow_headers": [
                "Authorization",
                "Content-Type",
                "X-Requested-With",
                "X-CSRF-Token"
            ]
        }
    }
    CORS(app, resources=cors_config)


    # Register routes
    app.register_blueprint(user_routes)
    app.register_blueprint(ai_routes)
    app.register_blueprint(check_in_routes)

    # Base endpoint
    @app.get("/")
    def root():
        """
        Health probe endpoint.
        """    
        return {"status": "ready"}

    return app, jwt, mail


def setup_sub_db(app):
    # Subscription db
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mydatabase.db'
    sub_db.init_app(app)
    ## Create the tables
    with app.app_context():
        sub_db.create_all()

app,mail, jwt = run_app()

# DB pre-load
load_agent_facts_to_db()

setup_sub_db(app)

