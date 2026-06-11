import os
import string
import secrets
import asyncio
import bcrypt
import jwt
from datetime import datetime, timedelta, date
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException, Depends, Request, Cookie, File, Form, Response, Query
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from starlette.middleware.base import BaseHTTPMiddleware

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from project_models import (
    User, Base, async_session, engine,
    Problem, AdminResponse, ServiceRecord, Users_in_telegram, Review
)
from tg_bot import start, send_msg, notify_admins_new_problem
from pydantic import BaseModel
from ai_assistant import TicketAssistantManager

def generate_code():
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(6))

SECRET_KEY = 'kW!8729ew95P$be5j532#8Qlv;3&5tJ3'
ALGORITHM  = "HS256"

app = FastAPI()

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Frame-Options"]        = "DENY"
        response.headers["X-XSS-Protection"]       = "1; mode=block"
        response.headers["X-Content-Type-Options"]  = "nosniff"
        response.headers["Referrer-Policy"]         = "strict-origin-when-cross-origin"
        
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data:; "
            "connect-src 'self';"
        )
        return response

app.add_middleware(SecurityHeadersMiddleware)

os.makedirs("static/user_problem_image", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
templates     = Jinja2Templates(directory='templates')

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session

def get_current_user(access_token: str = Cookie(None)):
    if not access_token:
        raise HTTPException(
            status_code=307,
            headers={"Location": "/login"}
        )
    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        role    = payload.get("role")
        if user_id is None or role is None:
            raise HTTPException(
                status_code=307,
                headers={"Location": "/login"}
            )
        return user_id, role
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=307,
            headers={"Location": "/login"}
        )
        
def get_current_user_optional(access_token: str = Cookie(None)):
    """Повертає дані юзера або None — без редіректу, для шаблонів."""
    if not access_token:
        return None
    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        role    = payload.get("role")
        if user_id is None or role is None:
            return None
        return {"user_id": user_id, "role": role}
    except jwt.PyJWTError:
        return None        

def admin_required(user_data: tuple = Depends(get_current_user)):
    _, role = user_data
    if role != "admin":
        raise HTTPException(status_code=403, detail="Доступ лише для адміністраторів")
    return True

@app.get("/")
async def home(request: Request, user=Depends(get_current_user_optional)):
    return templates.TemplateResponse(request=request, name="index.html", context={"current_user": user})

@app.get("/register")
async def register_get(request: Request):
    return templates.TemplateResponse(request=request, name="register.html", context={})

@app.post("/register")
async def register_post(
    request:  Request,
    username: str = Form(),
    password: str = Form(),
    email:    str = Form(),
    session:  AsyncSession = Depends(get_session),
):
    existing = await session.execute(select(User).filter(User.username == username))
    if existing.scalars().first():
        return templates.TemplateResponse(
            request=request, name="register.html",
            context={"message": "Користувач з таким іменем вже існує."}
        )

    new_user = User(username=username, email=email, is_admin=False)
    new_user.set_password(raw_password=password)
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)

    tg_code      = generate_code()
    user_in_tg   = Users_in_telegram(tg_code=tg_code, user_in_site=new_user.id)
    session.add(user_in_tg)
    await session.commit()

    return templates.TemplateResponse(
        request=request, name="register.html",
        context={
            "message":    "Ви успішно створили акаунт!",
            "tg_message": (
                f"Для отримання сповіщень переходьте до нашого бота "
                f"https://t.me/citadel_service_order_Bot "
                f"та відправте йому код: {tg_code}"
            ),
        }
    )

@app.get("/login")
async def login_get(request: Request, error: str = Query(default="")):
    return templates.TemplateResponse(
        request=request, name="login.html", context={"error": error}
    )

@app.post("/login")
async def login_post(
    request:   Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    session:   AsyncSession = Depends(get_session),
):
    result = await session.execute(select(User).filter(User.username == form_data.username))
    user   = result.scalars().first()

    if not user or not bcrypt.checkpw(form_data.password.encode(), user.password.encode()):
        return RedirectResponse(
            url="/login?error=Пароль або логін невірний, спробуйте ще раз",
            status_code=302,
        )

    token_data = {
        "user_id": user.id,
        "role":    "admin" if user.is_admin else "user",
        "exp":     datetime.utcnow() + timedelta(hours=72),
    }
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

    resp = RedirectResponse(url="/", status_code=302)
    resp.set_cookie(
        key="access_token", value=token,
        httponly=True, max_age=60*60*24*3, samesite="lax",
    )
    return resp

@app.get("/add_my_problem")
async def add_problem_get(request: Request, current_user: tuple = Depends(get_current_user)):
    return templates.TemplateResponse(request=request, name="add_problem.html", context={})

@app.post("/add_my_problem")
async def add_problem_post(
    request:      Request,
    title:        str  = Form(),
    description:  str  = Form(),
    img                = File(None),
    current_user: tuple = Depends(get_current_user),
    session:      AsyncSession = Depends(get_session),
):
    img_path = None
    if img and img.filename:
        allowed_ext = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"}
        ext = os.path.splitext(img.filename)[1].lower()
        if ext not in allowed_ext:
            return templates.TemplateResponse(
                request=request, name="add_problem.html",
                context={"message": "Недозволений тип файлу. Дозволені: jpg, png, gif, webp, pdf."}
            )
        safe_name     = secrets.token_hex(8) + ext
        file_location = f"user_problem_image/{safe_name}"
        with open("static/" + file_location, "wb+") as f:
            f.write(await img.read())
        img_path = file_location

    new_problem = Problem(
        title=title, description=description,
        user_id=current_user[0], image_url=img_path,
    )
    session.add(new_problem)
    await session.commit()
    await session.refresh(new_problem)
    await notify_admins_new_problem(new_problem.id, new_problem.title)

    return templates.TemplateResponse(
        request=request, name="add_problem.html",
        context={"message": f'Проблема: "{title}" записана!'}
    )

@app.get("/new_problems")
async def new_problems(
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: tuple = Depends(get_current_user),
):
    if current_user[1] != "admin":
        return templates.TemplateResponse(
            request=request, name="access_denied.html",
            context={"current_user": {"user_id": current_user[0], "role": current_user[1]}}
        )
    result = await session.execute(select(Problem).filter_by(status="В обробці"))
    return templates.TemplateResponse(
        request=request, name="all_problems.html",
        context={"problems": result.scalars().all(), "current_user": {"user_id": current_user[0], "role": current_user[1]}}
    )

@app.get("/problem")
async def problem_get(
    problem_id: int,
    request:    Request,
    session:    AsyncSession = Depends(get_session),
    _:          bool = Depends(admin_required),
):
    result = await session.execute(select(Problem).filter_by(id=problem_id))
    return templates.TemplateResponse(
        request=request, name="problem_check.html",
        context={"problem": result.scalars().first()}
    )

@app.post("/problem")
async def problem_post(
    request:      Request,
    id:           int   = Form(),
    current_user: tuple = Depends(get_current_user),
    session:      AsyncSession = Depends(get_session),
    _:            bool  = Depends(admin_required),
):
    result  = await session.execute(select(Problem).filter_by(id=id))
    problem = result.scalar_one_or_none()
    if problem:
        problem.status   = "У роботі"
        problem.admin_id = current_user[0]
        await send_msg(problem.user_id, f"Запит #{problem.id} ({problem.title})\nСтатус → 'У роботі'")
        session.add(problem)
        await session.commit()
        await session.refresh(problem)
    return templates.TemplateResponse(
        request=request, name="problem_check.html",
        context={"problem": problem, "message": "Заявку взято в роботу!"}
    )

@app.get("/admin_problems")
async def admin_problems(
    request:      Request,
    current_user: tuple = Depends(get_current_user),
    session:      AsyncSession = Depends(get_session),
):
    if current_user[1] != "admin":
        return templates.TemplateResponse(
            request=request, name="access_denied.html",
            context={"current_user": {"user_id": current_user[0], "role": current_user[1]}}
        )
    result = await session.execute(select(Problem).filter_by(admin_id=current_user[0]))
    return templates.TemplateResponse(
        request=request, name="admin_problems.html",
        context={"problems": result.scalars().all(), "current_user": {"user_id": current_user[0], "role": current_user[1]}}
    )
    
@app.get("/admin/stats")
async def admin_stats(
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: tuple = Depends(get_current_user),
):
    if current_user[1] != "admin":
        return templates.TemplateResponse(
            request=request, name="access_denied.html",
            context={"current_user": {"user_id": current_user[0], "role": current_user[1]}}
        )    

@app.get("/add_answer")
async def add_answer_get(
    problem_id: int,
    request:    Request,
    _:          bool = Depends(admin_required),
):
    return templates.TemplateResponse(
        request=request, name="add_answer.html",
        context={"id": problem_id}
    )

@app.post("/add_answer")
async def add_answer_post(
    request:      Request,
    problem_id:   int = Form(),
    message:      str = Form(),
    current_user: tuple = Depends(get_current_user),
    session:      AsyncSession = Depends(get_session),
    _:            bool = Depends(admin_required),
):
    new_answer = AdminResponse(message=message, admin_id=current_user[0], problem_id=problem_id)
    session.add(new_answer)
    await session.commit()

    result  = await session.execute(select(Problem).filter_by(id=problem_id))
    problem = result.scalars().one_or_none()
    problem.status = "Є відповідь"
    await send_msg(problem.user_id, f"Запит #{problem.id} ({problem.title})\nСтатус → 'Є відповідь'")
    session.add(problem)
    await session.commit()

    return templates.TemplateResponse(
        request=request, name="add_answer.html",
        context={"message": "Відповідь збережена!", "id": problem_id}
    )

@app.get("/all_my_problems")
@app.get("/my_all_problems")   
async def my_all_problems(
    request:      Request,
    current_user: tuple = Depends(get_current_user),
    session:      AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Problem).filter_by(user_id=current_user[0]))
    return templates.TemplateResponse(
        request=request, name="all_my_problems.html",
        context={"problems": result.scalars().all(), 
                "current_user": {"user_id": current_user[0], "role": current_user[1]}}
    )

@app.get("/check_message")
async def check_message(
    id:           int,
    request:      Request,
    current_user: tuple = Depends(get_current_user),
    session:      AsyncSession = Depends(get_session),
):
    problem = await session.execute(select(Problem).filter_by(id=id))
    answer  = await session.execute(select(AdminResponse).filter_by(problem_id=id))
    return templates.TemplateResponse(
        request=request, name="check_message.html",
        context={
            "problem": problem.scalars().one_or_none(),
            "answer":  answer.scalars().one_or_none(),
        }
    )

@app.get("/service_complete")
async def service_complete_get(
    problem_id: int,
    request:    Request,
    _:          bool = Depends(admin_required),
):
    return templates.TemplateResponse(
        request=request, name="service_complete.html",
        context={"problem_id": problem_id}
    )

@app.post("/service_complete")
async def service_complete_post(
    request:    Request,
    work_done:  str = Form(),
    parts_used: str = Form(),
    problem_id: int = Form(),
    session:    AsyncSession = Depends(get_session),
    _:          bool = Depends(admin_required),
):
    result  = await session.execute(select(Problem).filter_by(id=problem_id))
    problem = result.scalars().one_or_none()

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

    return templates.TemplateResponse(
        request=request, name="service_complete.html",
        context={"message": "Запис додано!", "problem_id": problem_id}
    )

@app.get("/service_record_review")
async def service_record_review(
    id:           int,
    request:      Request,
    current_user: tuple = Depends(get_current_user),
    session:      AsyncSession = Depends(get_session),
):
    problem        = await session.execute(select(Problem).filter_by(id=id))
    service_record = await session.execute(select(ServiceRecord).filter_by(problem_id=id))
    return templates.TemplateResponse(
        request=request, name="service_check.html",
        context={
            "problem":        problem.scalars().one_or_none(),
            "service_record": service_record.scalars().one_or_none(),
        }
    )

@app.get("/admin/stats")
async def admin_stats(
    request: Request,
    session: AsyncSession = Depends(get_session),
    _:       bool = Depends(admin_required),
):
    all_q    = await session.execute(select(Problem))
    all_prob = all_q.scalars().all()

    stats = {"В обробці": 0, "У роботі": 0, "Є відповідь": 0, "Завершено": 0}
    for p in all_prob:
        if p.status in stats:
            stats[p.status] += 1
    active_count = stats["В обробці"] + stats["У роботі"] + stats["Є відповідь"]

    done_q   = await session.execute(
        select(Problem.date_created, ServiceRecord.date_completed)
        .join(ServiceRecord, Problem.id == ServiceRecord.problem_id)
        .filter(Problem.status == "Завершено")
    )
    done_records  = done_q.all()
    total_seconds = sum((dc - cr).total_seconds() for cr, dc in done_records)
    count         = len(done_records)

    avg_time_str = "Немає завершених запитів"
    if count > 0:
        avg_time_str = f"{total_seconds / count / 3600:.1f} годин"

    return templates.TemplateResponse(
        request=request, name="admin_stats.html",
        context={"stats": stats, "active_count": active_count, "avg_time": avg_time_str}
    )

@app.get("/reviews")
async def reviews_get(
    request:      Request,
    current_user: tuple = Depends(get_current_user),
    session:      AsyncSession = Depends(get_session),
):
    reviews_q = await session.execute(select(Review).order_by(Review.date_created.desc()))
    reviews   = reviews_q.scalars().all()

    done_q          = await session.execute(select(Problem).filter_by(user_id=current_user[0], status="Завершено"))
    can_leave_review = len(done_q.scalars().all()) > 0

    return templates.TemplateResponse(
        request=request, name="reviews.html",
        context={"reviews": reviews, "can_leave_review": can_leave_review}
    )

@app.post("/reviews")
async def reviews_post(
    request:      Request,
    text:         str = Form(),
    current_user: tuple = Depends(get_current_user),
    session:      AsyncSession = Depends(get_session),
):
    done_q = await session.execute(select(Problem).filter_by(user_id=current_user[0], status="Завершено"))
    if not done_q.scalars().all():
        raise HTTPException(status_code=403, detail="Тільки користувачі із завершеними запитами можуть залишати відгуки.")

    session.add(Review(text=text, user_id=current_user[0]))
    await session.commit()
    return RedirectResponse(url="/reviews", status_code=303)

class AIDataRequest(BaseModel):
    description: str

@app.post("/api/analyze_ticket")
async def api_analyze_ticket(data: AIDataRequest, current_user: tuple = Depends(get_current_user)):
    if not data.description or len(data.description) < 5:
        raise HTTPException(status_code=400, detail="Опис занадто короткий")
    
    # Відправляємо текст до нашого AI
    ai_response = TicketAssistantManager.analyze_ticket(data.description)
    return ai_response

@app.post("/logout")
def logout():
    resp = RedirectResponse(url="/login", status_code=303)
    resp.delete_cookie("access_token")
    return resp

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.on_event("startup")
async def on_startup():
    asyncio.create_task(start())
    await init_db()