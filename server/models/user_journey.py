"""
This model represents an object that keeps track of the user's 
overarching therapy goals and corcerns.
"""

from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class TherapyPlan(BaseModel):
    chat_id: Optional[str] = None
    exercise: Optional[list[str]] = []
    submit_assignments: Optional[list[str]] = []
    assign_assignments: Optional[list[str]] = []
    assign_exercise: Optional[list[str]] = []
    share_resources: Optional[list[str]] = []

class MentalHealthConcern(BaseModel):
    label: str
    severity: str

class UserJourney(BaseModel):
    user_id: str
    patient_goals: Optional[list[str]] = []
    last_update: Optional[datetime] = None
    therapy_plan: Optional[TherapyPlan] = TherapyPlan()
    mental_health_concerns: Optional[list[MentalHealthConcern]] = []