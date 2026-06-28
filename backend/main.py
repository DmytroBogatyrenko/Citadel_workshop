import os
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from backend.config import origins
from backend.project_models import engine, Base
from backend.tg_bot import start
from backend.routers.api import apirouter
from backend.routers.html_routes import router as html_router

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Код, який виконується при запуску додатка
    bot_task = asyncio.create_task(start())
    await init_db()
    yield
    # Код, який виконується при зупинці додатка
    bot_task.cancel()
    try:
        await bot_task
    except asyncio.CancelledError:
        pass

app = FastAPI(lifespan=lifespan)

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("static/user_problem_image", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="react-assets")

# Підключення всіх API та HTML роутерів
app.include_router(apirouter)
app.include_router(html_router)

# Catch-all для роутингу React SPA
@app.get("/{full_path:path}")
async def serve_react(full_path: str):
    return FileResponse("frontend/dist/index.html")