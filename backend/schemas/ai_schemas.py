# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\schemas\ai_schemas.py
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class AIChatRequest(BaseModel):
    message: str

class AIAgentRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, Any]]] = []

class AIInsightResponse(BaseModel):
    insight: str

class AIBroadcastRequest(BaseModel):
    property_id: int
    title: Optional[str] = "Important Notice"
    content: str
