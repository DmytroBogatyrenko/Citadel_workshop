from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.dependencies import get_session, get_current_user_api
from backend.project_models import Problem, ServiceRecord

router = APIRouter(prefix="/api")

@router.get("/admin_stats")
async def api_admin_stats(
    current_user: tuple = Depends(get_current_user_api),
    session: AsyncSession = Depends(get_session),
):
    if current_user[1] != "admin":
        raise HTTPException(status_code=403, detail="Доступ лише для адміністраторів")

    all_q = await session.execute(select(Problem))
    all_prob = all_q.scalars().all()

    stats = {"В обробці": 0, "У роботі": 0, "Є відповідь": 0, "Завершено": 0}
    for p in all_prob:
        if p.status in stats:
            stats[p.status] += 1
    active_count = stats["В обробці"] + stats["У роботі"] + stats["Є відповідь"]

    done_q = await session.execute(
        select(Problem.date_created, ServiceRecord.date_completed)
        .join(ServiceRecord, Problem.id == ServiceRecord.problem_id)
        .filter(Problem.status == "Завершено")
    )
    done_records = done_q.all()
    total_seconds = sum((dc - cr).total_seconds() for cr, dc in done_records)
    count = len(done_records)

    avg_time_str = "Немає завершених запитів"
    if count > 0:
        avg_time_str = f"{total_seconds / count / 3600:.1f} годин"

    return {
        "stats": stats,
        "active_count": active_count,
        "avg_time": avg_time_str,
    }
