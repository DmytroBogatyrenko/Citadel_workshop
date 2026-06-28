from fastapi import APIRouter
from backend.routers.api_auth import router as auth_router
from backend.routers.api_problems import router as problems_router
from backend.routers.api_stats import router as stats_router
from backend.routers.api_reviews import router as reviews_router
from backend.routers.api_assistant import router as assistant_router

apirouter = APIRouter()
apirouter.include_router(auth_router)
apirouter.include_router(problems_router)
apirouter.include_router(stats_router)
apirouter.include_router(reviews_router)
apirouter.include_router(assistant_router)