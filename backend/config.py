import os
from dotenv import load_dotenv
from fastapi.templating import Jinja2Templates

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "kW!8729ew95P$be5j532#8Qlv;3&5tJ3")
ALGORITHM = "HS256"

# Дозволені домени для CORS
origins = [
    "https://d1arm86htgwr15.cloudfront.net",
    "https://citadelworkshop.duckdns.org",
    "http://127.0.0.1:8000",
    "http://localhost:3000",
    "http://localhost:5173",
]

# Ініціалізація Jinja2 шаблонів
templates = Jinja2Templates(directory='templates')
