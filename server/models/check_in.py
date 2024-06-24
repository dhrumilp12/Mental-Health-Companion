"""
This model represents a check-in.
"""

from datetime import datetime, timedelta
from pydantic import BaseModel, Field, field_validator, validator
from enum import Enum

class Frequency(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"

class CheckIn(BaseModel):
    user_id: str
    check_in_time: datetime
    frequency: Frequency
    status: str = "upcoming" # default status is upcoming
    last_conversation: str = ""  # default empty string, updated later
    notify: bool = False  # Default to False, updated based on user preference
    reminder_times: list[timedelta] = Field(default_factory=lambda: [
        timedelta(days=1),
        timedelta(weeks=1),
        timedelta(days=30)  # Approximately 1 month
    ])

    

    def save(self, db):
        # Convert model to dictionary and save to MongoDB
        document = self.dict()
        db.check_ins.insert_one(document)

    @field_validator('check_in_time', mode='before')
    def check_future_date(cls, v):
        if v < datetime.now():
            raise ValueError("Check-in time must be in the future")
        return v
    
    @staticmethod
    def count_user_check_ins(db, user_id, date):
        start_of_day = datetime.combine(date, datetime.min.time())
        end_of_day = datetime.combine(date, datetime.max.time())
        count = db.check_ins.count_documents({
            'user_id': user_id,
            'check_in_time': {'$gte': start_of_day, '$lt': end_of_day}
        })
        return count
    
    @staticmethod
    def validate_check_in_time(db, user_id, proposed_time):
        """ Validate the proposed check-in time against other check-ins on the same day. """
        date = proposed_time.date()
        start_of_day = datetime.combine(date, datetime.min.time())
        end_of_day = datetime.combine(date, datetime.max.time())

        # Fetch all check-ins for that user on the proposed date
        existing_check_ins = db.check_ins.find({
            'user_id': user_id,
            'check_in_time': {'$gte': start_of_day, '$lt': end_of_day}
        })

        for check_in in existing_check_ins:
            # Assuming check-ins should not overlap within an hour window
            if abs((check_in['check_in_time'] - proposed_time).total_seconds()) < 3600:
                return False  # Conflict found if within an hour of another check-in

        return True  # No conflicts found
    
     # Validator to ensure reminder times are valid
    @validator('reminder_times', each_item=True, pre=True)
    def validate_reminder_times(cls, v):
        if v.total_seconds() not in [3600, 86400, 604800, 2592000]:  # 1 hour, 1 day, 1 week, ~1 month
            raise ValueError("Invalid reminder time")
        return v

    # Serialize timedelta for MongoDB storage
    def dict(self, **kwargs):
        d = super().dict(**kwargs)
        d['reminder_times'] = [int(rt.total_seconds()) for rt in self.reminder_times]  # Serialize as seconds
        return d
