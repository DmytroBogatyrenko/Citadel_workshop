import jwt
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel

from backend.config import SECRET_KEY, ALGORITHM
from backend.dependencies import get_session, get_current_user_api
from backend.project_models import User, Users_in_telegram
from backend.utils import generate_code

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

router = APIRouter(prefix="/api")

@router.post("/register")
async def api_register(
    data: RegisterRequest,
    session: AsyncSession = Depends(get_session),
):
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Пароль має містити щонайменше 6 символів")

    existing = await session.execute(select(User).filter(User.username == data.username))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Користувач з таким іменем вже існує")

    new_user = User(username=data.username, email=data.email, is_admin=False)
    new_user.set_password(raw_password=data.password)
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)

    tg_code = generate_code()
    user_in_tg = Users_in_telegram(tg_code=tg_code, user_in_site=new_user.id)
    session.add(user_in_tg)
    await session.commit()

    return {
        "success": True,
        "username": new_user.username,
        "tg_code": tg_code,
    }

@router.post("/login")
async def api_login(
    data: LoginRequest,
    response: Response,
    session: AsyncSession = Depends(get_session),
):
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Пароль має містити щонайменше 6 символів")

    result = await session.execute(select(User).filter(User.username == data.username))
    user = result.scalars().first()

    if not user or not user.verify_password(data.password):
        raise HTTPException(status_code=401, detail="Пароль або логін невірний")

    token_data = {
        "user_id": user.id,
        "role": "admin" if user.is_admin else "user",
        "username": user.username,
        "exp": datetime.utcnow() + timedelta(hours=72),
    }
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

    response.set_cookie(
        key="access_token", value=token,
        httponly=True, max_age=60*60*24*3, samesite="lax",
    )
    return {"success": True, "username": user.username, "role": "admin" if user.is_admin else "user"}

@router.post("/logout")
async def api_logout(response: Response):
    response.delete_cookie("access_token")
    return {"success": True}

@router.get("/me")
async def api_me(current_user: tuple = Depends(get_current_user_api)):
    return {
        "user_id": current_user[0],
        "role": current_user[1],
        "username": current_user[2],
    }
