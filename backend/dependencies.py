import jwt
from fastapi import Cookie, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import AsyncGenerator

from backend.config import SECRET_KEY, ALGORITHM
from backend.project_models import async_session

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
        user_id  = payload.get("user_id")
        role     = payload.get("role")
        username = payload.get("username")
        if user_id is None or role is None:
            raise HTTPException(
                status_code=307,
                headers={"Location": "/login"}
            )
        return user_id, role, username
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=307,
            headers={"Location": "/login"}
        )

def get_current_user_api(access_token: str = Cookie(None)):
    if not access_token:
        raise HTTPException(status_code=401, detail="Неавторизовано")
    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        role = payload.get("role")
        username = payload.get("username")
        if user_id is None or role is None:
            raise HTTPException(status_code=401, detail="Неавторизовано")
        return (user_id, role, username)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Недійсний токен")

def build_user_context(current_user: tuple) -> dict:
    return {
        "user_id": current_user[0], 
        "role": current_user[1], 
        "username": current_user[2] if len(current_user) > 2 else None
    }

def get_current_user_optional(access_token: str = Cookie(None)):
    """Повертає дані юзера або None — без редіректу, для шаблонів."""
    if not access_token:
        return None
    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id  = payload.get("user_id")
        role     = payload.get("role")
        username = payload.get("username")
        if user_id is None or role is None:
            return None
        return {"user_id": user_id, "role": role, "username": username}
    except jwt.PyJWTError:
        return None        

def admin_required(user_data: tuple = Depends(get_current_user)):
    role = user_data[1]
    if role != "admin":
        raise HTTPException(status_code=403, detail="Доступ лише для адміністраторів")
    return True
