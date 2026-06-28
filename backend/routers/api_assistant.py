from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from backend.dependencies import get_current_user_api
from backend.ai_assistant import TicketAssistantManager

class AIDataRequest(BaseModel):
    description: str

router = APIRouter(prefix="/api")

@router.post("/analyze_ticket")
async def api_analyze_ticket(
    data: AIDataRequest, 
    current_user: tuple = Depends(get_current_user_api)
):
    if not data.description or len(data.description) < 5:
        raise HTTPException(status_code=400, detail="Опис занадто короткий")
    
    # Відправляємо текст до нашого AI
    ai_response = TicketAssistantManager.analyze_ticket(data.description)
    return ai_response
