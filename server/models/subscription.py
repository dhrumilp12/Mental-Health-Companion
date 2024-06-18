from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class NotificationTiming(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    subscription_id = db.Column(db.Integer, db.ForeignKey('subscription.id'))
    timing = db.Column(db.String(50))

class Subscription(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(120), unique=True, nullable=False)
    subscription_info = db.Column(db.String, nullable=False)
    notify_timing = db.Relationship('NotificationTiming', backref='subscription', lazy=True)  # Assuming NotificationTiming is another model that stores user preferences for timings

    