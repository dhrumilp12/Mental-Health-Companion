# scheduler.py

import schedule
import time
from .scheduler import send_push_notification
from models.check_in import CheckIn
from services.azure_mongodb import MongoDBClient
from datetime import datetime, timedelta
from flask import current_app as app


db_client = MongoDBClient.get_client()
db = db_client[MongoDBClient.get_db_name()]

class NotificationScheduler:
    def __init__(self):
        self.scheduler = schedule.Scheduler()

    def schedule_notifications(self, check_in):
        for reminder_time in check_in['reminder_times']:
            scheduled_time = check_in['check_in_time'] - reminder_time
            self.scheduler.every().day.at(scheduled_time.strftime("%H:%M")).do(
                lambda: self.send_notification(check_in)
            )
            print(f"Notification for {check_in['user_id']} scheduled at {scheduled_time}")

    def send_notification(self, check_in):
        with app.app_context():  # To access app configuration
            user_id = check_in['user_id']
            reminder_text = "1 hour" if check_in['reminder_times'][0] == timedelta(hours=1) else "1 day" if check_in['reminder_times'][0] == timedelta(days=1) else "1 week" 
            message = f"Upcoming check-in in {reminder_text}."
            send_push_notification(user_id, message)
            print("Sent notification to user: ", user_id)
            
    def clear_check_in_notifications(self,check_in_id, user_id):
        for job in self.scheduler.jobs:
            job_args = job.job_func.keywords.get("check_in", {})  # Safely access job args
            if job_args.get("_id", "") == check_in_id and job_args.get("user_id", "") == user_id:
                self.scheduler.cancel_job(job)  # Cancel the job
                print(f"Canceled scheduled notification for check-in {check_in_id}")

    def delete_past_check_ins(self):
        now = datetime.now()
        result = db.check_ins.delete_many({'check_in_time': {'$lt': now}})
        print(f"Deleted {result.deleted_count} past check-ins at {now}")

    def schedule_delete_past_check_ins(self):
        self.scheduler.every().day.at("00:00").do(self.delete_past_check_ins)  # Adjust the time as needed

    def run_scheduler(self):
        while True:
            self.scheduler.run_pending()
            time.sleep(1)


# Create a single global instance of the scheduler
scheduler = NotificationScheduler()

# Start the scheduler in a background thread
from threading import Thread
notification_thread = Thread(target=scheduler.run_scheduler)
notification_thread.start()




