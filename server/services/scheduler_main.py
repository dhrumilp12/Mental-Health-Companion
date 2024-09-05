# scheduler.py
from threading import Thread

import schedule
import time
from services.scheduler import send_push_notification
from models.check_in import CheckIn
from services.azure_mongodb import MongoDBClient
from datetime import datetime, timedelta
from flask import Flask

import logging

db_client = MongoDBClient.get_client()

class NotificationScheduler:
    def __init__(self, app: Flask):
        self.scheduler = schedule.Scheduler()
        self.db = MongoDBClient.get_client()[MongoDBClient.get_db_name()]
        self.app = app

    def format_delta(self, delta):
        if delta == timedelta(days=1):
            return "1 day"
        elif delta == timedelta(weeks=1):
            return "1 week"
        elif delta == timedelta(days=30):  # Approximating 1 month
            return "1 month"
        else:
            return str(delta)

    def schedule_notifications(self, check_in):
        user_id = check_in['user_id']
        check_in_time = check_in['check_in_time']
        reminder_times_seconds = check_in['reminder_times']

        # Convert seconds back to timedelta objects
        reminder_times = [timedelta(seconds=rt) for rt in reminder_times_seconds]

        for reminder_time in reminder_times:
            scheduled_time = check_in_time - reminder_time
            if scheduled_time > datetime.now():
                reminder_text = self.format_delta(reminder_time)
                self.scheduler.every().day.at(scheduled_time.strftime("%H:%M")).do(
                    self.send_notification, user_id=user_id, check_in_id=check_in['_id'],
                    message=f"Reminder: Your check-in is in {reminder_text}"
                )
                print(f"Current time: {datetime.now()}, scheduling notification for {scheduled_time}")
                print(f"Notification for {user_id} scheduled at {scheduled_time}")

    def send_notification(self, user_id, check_in_id, message):
        print(f"Sending notification to user: {user_id} at {datetime.now()}")
        with self.app.app_context():  # To access app configuration
            success = send_push_notification(user_id, message)
            if success:
                print(f"Sent notification to user: {user_id}")
            else:
                print(f"Failed to send notification to user: {user_id}")
            
    def clear_check_in_notifications(self,check_in_id, user_id):
        for job in self.scheduler.jobs:
            job_args = job.job_func.keywords.get("check_in", {})  # Safely access job args
            if job_args.get("_id", "") == check_in_id and job_args.get("user_id", "") == user_id:
                self.scheduler.cancel_job(job)  # Cancel the job
                print(f"Canceled scheduled notification for check-in {check_in_id}")

    def delete_past_check_ins(self):
        now = datetime.now()
        result = self.db.check_ins.delete_many({'check_in_time': {'$lt': now}})
        print(f"Deleted {result.deleted_count} past check-ins at {now}")

    def schedule_delete_past_check_ins(self):
        self.scheduler.every().day.at("00:00").do(self.delete_past_check_ins)  # Adjust the time as needed

    def run_scheduler(self):
        while True:
            self.scheduler.run_pending()
            time.sleep(1)

#def run_scheduler(app):  # Accept the Flask app as a parameter
 #   scheduler_instance = NotificationScheduler(app)  # Pass the app to the scheduler
 #   while True:
 #       scheduler_instance.scheduler.run_pending()  # Correctly reference the scheduler attribute
 #       time.sleep(1)


#def start_scheduler(app):
    #global scheduler
    #scheduler = NotificationScheduler(app)
    #notification_thread = Thread(target=run_scheduler, args=(app,))
    #notification_thread.start()




