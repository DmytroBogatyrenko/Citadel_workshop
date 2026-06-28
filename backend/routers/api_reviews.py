from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.dependencies import get_session, get_current_user_api
from backend.project_models import Review, Problem

router = APIRouter(prefix="/api")

@router.get("/reviews")
async def api_reviews(
    current_user: tuple = Depends(get_current_user_api),
    session: AsyncSession = Depends(get_session),
):
    reviews_q = await session.execute(select(Review).order_by(Review.date_created.desc()))
    reviews = reviews_q.scalars().all()

    done_q = await session.execute(select(Problem).filter_by(user_id=current_user[0], status="Завершено"))
    can_leave_review = len(done_q.scalars().all()) > 0

    return {
        "reviews": [
            {
                "id": r.id,
                "text": r.text,
                "user_id": r.user_id,
                "date_created": r.date_created.strftime('%d.%m.%Y'),
            }
            for r in reviews
        ],
        "can_leave_review": can_leave_review,
    }

@router.post("/reviews")
async def api_add_review(
    text: str = Form(),
    current_user: tuple = Depends(get_current_user_api),
    session: AsyncSession = Depends(get_session),
):
    done_q = await session.execute(select(Problem).filter_by(user_id=current_user[0], status="Завершено"))
    if not done_q.scalars().all():
        raise HTTPException(status_code=403, detail="Тільки користувачі із завершеними запитами можуть залишати відгуки.")

    session.add(Review(text=text, user_id=current_user[0]))
    await session.commit()

    return {"success": True}
