from models.subscription import Subscription
from pywebpush import webpush, WebPushException
import json
import os
from dotenv import load_dotenv
load_dotenv()

def send_push_notification(user_id, message):
    subscription = Subscription.query.filter_by(user_id=user_id).first()
    if not subscription:
        print(f"No subscription found for user {user_id}")
        return False
    
    try:
            print("Subscription info:", subscription.subscription_info)

            webpush(
                subscription_info=json.loads(subscription.subscription_info),
                data=json.dumps({
                    "title": "Notification Title",
                    "body": message
                    }),
                vapid_private_key=os.environ.get("VAPID_PRIVATE_KEY"),
                vapid_claims={"sub": "mailto:dpatel24@radar.gsw.edu"}
            )
            print("Notification sent successfully")
            return True
    except WebPushException as e:
            print(f"Failed to send notification: {e}")
            if e.response and e.response.json():
                print(e.response.json())
    except json.JSONDecodeError as json_error:
        print(f"JSON decoding error with subscription_info: {json_error}")
        return False