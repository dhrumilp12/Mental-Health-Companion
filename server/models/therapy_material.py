"""
This model represents resources that may be useful to patients'
treatment.
"""

from pydantic import BaseModel, HttpUrl

class TherapyMaterial(BaseModel):
    resource_id: str
    resource_type: str
    source: HttpUrl