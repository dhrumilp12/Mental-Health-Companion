"""
This model represents an object that keeps track of the user's 
overarching therapy goals and corcerns.
"""

from datetime import datetime
from pydantic import BaseModel

class TherapyPlan(BaseModel):
    chat_id: str
    exercise: list[str]
    submit_assignments: list[str]
    assign_assignments: list[str]
    assign_exercise: list[str]
    share_resources: list[str]


class MentalHealthConcern(BaseModel):
    label: str
    severity: str


class UserJourney(BaseModel):
    user_id:str
    patient_goals: list[str]
    last_update:datetime
    therapy_plan: TherapyPlan
    mental_health_concerns: list[MentalHealthConcern]