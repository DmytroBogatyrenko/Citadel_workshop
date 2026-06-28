import os
import secrets
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.dependencies import get_session, get_current_user_api
from backend.project_models import Problem, AdminResponse, ServiceRecord
from backend.tg_bot import send_msg, notify_admins_new_problem

router = APIRouter(prefix="/api")

@router.post("/add_problem")
async def api_add_problem(
    title: str = Form(),
    description: str = Form(),
    img = File(None),
    current_user: tuple = Depends(get_current_user_api),
    session: AsyncSession = Depends(get_session),
):
    img_path = None
    if img and img.filename:
        allowed_ext = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"}
        ext = os.path.splitext(img.filename)[1].lower()
        if ext not in allowed_ext:
            raise HTTPException(status_code=400, detail="Недозволений тип файлу")
        safe_name = secrets.token_hex(8) + ext
        file_location = f"user_problem_image/{safe_name}"
        with open("static/" + file_location, "wb+") as f:
            f.write(await img.read())
        img_path = file_location

    new_problem = Problem(
        title=title,
        description=description,
        user_id=current_user[0],
        image_url=img_path,
    )
    session.add(new_problem)
    await session.commit()
    await session.refresh(new_problem)
    await notify_admins_new_problem(new_problem.id, new_problem.title)

    return {"success": True, "id": new_problem.id, "title": new_problem.title}

@router.get("/new_problems")
async def api_new_problems(
    current_user: tuple = Depends(get_current_user_api),
    session: AsyncSession = Depends(get_session),
):
    if current_user[1] != "admin":
        raise HTTPException(status_code=403, detail="Доступ лише для адміністраторів")

    result = await session.execute(select(Problem).filter_by(status="В обробці"))
    problems = result.scalars().all()

    return [
        {"id": p.id, "title": p.title, "description": p.description}
        for p in problems
    ]

@router.post("/take_problem")
async def api_take_problem(
    id: int = Form(),
    current_user: tuple = Depends(get_current_user_api),
    session: AsyncSession = Depends(get_session),
):
    if current_user[1] != "admin":
        raise HTTPException(status_code=403, detail="Доступ лише для адміністраторів")

    result = await session.execute(select(Problem).filter_by(id=id))
    problem = result.scalar_one_or_none()
    if not problem:
        raise HTTPException(status_code=404, detail="Заявку не знайдено")

    problem.status = "У роботі"
    problem.admin_id = current_user[0]
    await send_msg(problem.user_id, f"Запит #{problem.id} ({problem.title})\nСтатус → 'У роботі'")
    session.add(problem)
    await session.commit()

    return {"success": True}

@router.get("/admin_problems")
async def api_admin_problems(
    current_user: tuple = Depends(get_current_user_api),
    session: AsyncSession = Depends(get_session),
):
    if current_user[1] != "admin":
        raise HTTPException(status_code=403, detail="Доступ лише для адміністраторів")

    result = await session.execute(select(Problem).filter_by(admin_id=current_user[0]))
    problems = result.scalars().all()

    return [
        {"id": p.id, "title": p.title, "status": p.status}
        for p in problems
    ]

@router.post("/add_answer")
async def api_add_answer(
    problem_id: int = Form(),
    message: str = Form(),
    current_user: tuple = Depends(get_current_user_api),
    session: AsyncSession = Depends(get_session),
):
    if current_user[1] != "admin":
        raise HTTPException(status_code=403, detail="Доступ лише для адміністраторів")

    new_answer = AdminResponse(message=message, admin_id=current_user[0], problem_id=problem_id)
    session.add(new_answer)
    await session.commit()

    result = await session.execute(select(Problem).filter_by(id=problem_id))
    problem = result.scalars().one_or_none()
    problem.status = "Є відповідь"
    await send_msg(problem.user_id, f"Запит #{problem.id} ({problem.title})\nСтатус → 'Є відповідь'")
    session.add(problem)
    await session.commit()

    return {"success": True}

@router.get("/my_problems")
async def api_my_problems(
    current_user: tuple = Depends(get_current_user_api),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Problem).filter_by(user_id=current_user[0]))
    problems = result.scalars().all()

    return [
        {
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "status": p.status,
            "date_created": p.date_created.isoformat() if p.date_created else None,
        }
        for p in problems
    ]

@router.get("/check_message")
async def api_check_message(
    id: int,
    current_user: tuple = Depends(get_current_user_api),
    session: AsyncSession = Depends(get_session),
):
    problem_q = await session.execute(select(Problem).filter_by(id=id))
    problem = problem_q.scalars().one_or_none()

    if not problem:
        raise HTTPException(status_code=404, detail="Заявку не знайдено")

    answer_q = await session.execute(select(AdminResponse).filter_by(problem_id=id))
    answer = answer_q.scalars().one_or_none()

    return {
        "problem": {
            "id": problem.id,
            "title": problem.title,
            "description": problem.description,
            "status": problem.status,
        },
        "answer": {"message": answer.message} if answer else None,
    }

@router.post("/service_complete")
async def api_service_complete(
    work_done: str = Form(),
    parts_used: str = Form(),
    problem_id: int = Form(),
    current_user: tuple = Depends(get_current_user_api),
    session: AsyncSession = Depends(get_session),
):
    if current_user[1] != "admin":
        raise HTTPException(status_code=403, detail="Доступ лише для адміністраторів")

    result = await session.execute(select(Problem).filter_by(id=problem_id))
    problem = result.scalars().one_or_none()

    if not problem:
        raise HTTPException(status_code=404, detail="Заявку не знайдено")

    warranty_info = (
        f"# {problem_id}\n"
        f"Тип послуги: сервісне обслуговування\n"
        f"Дата початку робіт: {problem.date_created.date()}\n"
        f"Дата завершення робіт: {date.today()}\n"
        f"Гарантія: 180 днів"
    )
    session.add(ServiceRecord(
        work_done=work_done, parts_used=parts_used,
        problem_id=problem_id, warranty_info=warranty_info,
    ))
    problem.status = "Завершено"
    await send_msg(problem.user_id, f"Запит #{problem.id} ({problem.title})\nСтатус → 'Завершено'")
    session.add(problem)
    await session.commit()

    return {"success": True}

@router.get("/service_record_review")
async def api_service_record_review(
    id: int,
    current_user: tuple = Depends(get_current_user_api),
    session: AsyncSession = Depends(get_session),
):
    problem_q = await session.execute(select(Problem).filter_by(id=id))
    problem = problem_q.scalars().one_or_none()

    if not problem:
        raise HTTPException(status_code=404, detail="Заявку не знайдено")

    record_q = await session.execute(
        select(ServiceRecord).filter_by(problem_id=id).order_by(ServiceRecord.id.desc())
    )
    record = record_q.scalars().first()

    if not record:
        raise HTTPException(status_code=404, detail="Гарантійний талон не знайдено")

    return {
        "problem": {"id": problem.id, "title": problem.title, "status": problem.status},
        "service_record": {
            "work_done": record.work_done,
            "parts_used": record.parts_used,
            "warranty_info": record.warranty_info,
        },
    }
