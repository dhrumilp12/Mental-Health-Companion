"""
API entrypoint for backend API.
"""
from dotenv import load_dotenv
import os
from threading import Thread
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from services.scheduler_main import NotificationScheduler
from models.subscription import db as sub_db
from services.db.agent_facts import load_agent_facts_to_db
from config.config import Config
from routes import register_blueprints
from flask_mail import Mail

load_dotenv()


def run_app():
    # Set up the app
    app = Flask(__name__)
    
    app.config.from_object(Config)
     # Debugging statements
    print("SECRET_KEY:", app.config['SECRET_KEY'])
    print("SECURITY_PASSWORD_SALT:", app.config['SECURITY_PASSWORD_SALT'])
    print("Loaded SECURITY_PASSWORD_SALT:", os.getenv("SECURITY_PASSWORD_SALT"))


    mail = Mail(app)
    jwt = JWTManager(app)
    cors_config = {
        r"*": {
            "origins": [os.getenv("BASE_URL")],
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
    register_blueprints(app)

    # Base endpoint
    @app.get("/")
    def root():
        """
        Health probe endpoint.
        """    
        return {"status": "ready"}
    

    # Create and start the notification scheduler
    scheduler = NotificationScheduler(app)
    notification_thread = Thread(target=scheduler.run_scheduler)
    notification_thread.start()

    @app.route("/test-notification")
    def test_notification():
        # Use actual values or test values for user_id and check_in_id
        user_id = "66d7b0c05a0e718dd3ea783d"
        check_in_id = "66d901c021a63476598fe1c1"
        message = "This is a test notification."
        scheduler.send_notification(user_id, check_in_id, message)
        return jsonify({"message": "Test notification sent"})
    
    
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
if __name__ == '__main__':
    HOST = os.getenv("FLASK_RUN_HOST") or "0.0.0.0"
    PORT = os.getenv("FLASK_RUN_PORT") or 8000
    app, jwt, mail = run_app()
    load_agent_facts_to_db()
    setup_sub_db(app)
    app.run(debug=True, host= HOST, port= PORT)

    