from pydantic import BaseModel
from typing import List, Optional

# 1. User Profile (Bulletproof Version)
# All fields have defaults so it won't crash if data is missing
class UserProfile(BaseModel):
    full_name: Optional[str] = "User"
    age_group: Optional[str] = "Unknown"
    gender: Optional[str] = "Unknown"
    height: Optional[str] = "Unknown"
    weight: Optional[str] = "Unknown"
    activity_level: Optional[str] = "Unknown"
    diet: Optional[str] = "Unknown"
    water_intake: Optional[str] = "Unknown"
    smoke: Optional[str] = "Unknown"
    alcohol: Optional[str] = "Unknown"
    sleep_hours: Optional[str] = "Unknown"
    
    # Lists must default to empty list []
    conditions: List[str] = []
    medications: List[str] = []
    family_history: List[str] = []
    
    checkup_frequency: Optional[str] = "Unknown"
    goals: List[str] = []
    consent: bool = False

# 2. Chat Structures
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    image_data: Optional[str] = None
    user_profile: Optional[UserProfile] = None
    history: List[Message] = []
    question: str

# 3. Analyze Structure
class AnalyzeRequest(BaseModel):
    image_data: str
    user_profile: Optional[UserProfile] = None