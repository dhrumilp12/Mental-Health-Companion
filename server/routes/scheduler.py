from apscheduler.schedulers.background import BackgroundScheduler
from flask import current_app as app
from datetime import datetime, timedelta
from services.azure_mongodb import MongoDBClient
import pymongo

def notify_check_ins():
    db_client = MongoDBClient.get_client()
    db = db_client[MongoDBClient.get_db_name()]
    now = datetime.now()
    upcoming_check_ins = db.check_ins.find({
        'check_in_time': {'$gte': now, '$lt': now + timedelta(days=7)},
        'notify': True,
        'status': 'upcoming'
    })

    for check_in in upcoming_check_ins:
        delta = check_in['check_in_time'] - now
        if delta.days == 7 or delta.days == 1 or delta.total_seconds() / 3600 <= 1:
            send_notification(check_in['user_id'], check_in['check_in_time'], delta)

def send_notification(user_id, check_in_time, delta):
    message = ""
    if delta.days == 7:
        message = "Your check-in is scheduled in 1 week."
    elif delta.days == 1:
        message = "Your check-in is scheduled tomorrow."
    elif delta.total_seconds() / 3600 <= 1:
        message = "Your check-in is in less than 1 hour."

    # This is where you'd integrate your actual notification logic
    print(f"Notify {user_id}: {message}")

scheduler = BackgroundScheduler()
scheduler.add_job(func=notify_check_ins, trigger='interval', hours=1)
scheduler.start()

def init_scheduler(app):
    app.config['scheduler'] = scheduler
