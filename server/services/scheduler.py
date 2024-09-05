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
    
    print(f"Attempting to send notification to {user_id} with subscription: {subscription.subscription_info}")
    try:
        subscription_info = json.loads(subscription.subscription_info)
        print("Subscription info:", subscription_info)
        vapid_private_key = os.environ.get("VAPID_PRIVATE_KEY")
        print("vapid_private_key:", vapid_private_key)
        
        webpush(
            subscription_info=subscription_info,
            data=json.dumps({
                "title": "Notification Title",
                "body": message
            }),
            vapid_private_key=vapid_private_key,
            vapid_claims={"sub": "mailto:dpatel24@radar.gsw.edu"}
        )
        print("Notification sent successfully")
        return True
    except WebPushException as e:
            print(f"Failed to send notification: {e}")
            if e.response:
                print(f"Response: {e.response.text}")
                if e.response.json():
                    print(e.response.json())
                if e.response.status_code == 410:
                    # Remove the expired subscription from the database
                    subscription.delete()
                    print(f"Removed expired subscription for user {user_id}")
            return False
    except json.JSONDecodeError as json_error:
        print(f"JSON decoding error with subscription_info: {json_error}")
        return False