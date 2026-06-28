import os
import asyncio
from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from sqlalchemy.future import select
from backend.project_models import async_session, Users_in_telegram, User

load_dotenv()
TOKEN = os.getenv("BOT_TOKEN")

if not TOKEN:
    raise ValueError("Помилка: BOT_TOKEN не знайдено у файлі .env!")

bot = Bot(token=TOKEN)
dp = Dispatcher()

@dp.message(CommandStart())
async def start_cmd(message: types.Message):
    await message.answer("Привіт! Надішліть свій 6-значний код з сайту для синхронізації акаунту.")

@dp.message()
async def process_code(message: types.Message):
    code = message.text.strip().upper()
    
    if len(code) < 6:
            await message.answer("Код має бути не менше 6 символів. Спробуйте ще раз.")
            return

    async with async_session() as session:
        result = await session.execute(select(Users_in_telegram).filter_by(tg_code=code))
        tg_user = result.scalars().first()
        
        if tg_user:
            if tg_user.user_tg_id:
                await message.answer("Цей код вже був використаний для синхронізації.")
            else:
                tg_user.user_tg_id = message.from_user.id
                await session.commit()
                await message.answer("✅ Акаунт успішно синхронізовано! Тепер ви отримуватимете сповіщення.")
        else:
            await message.answer("❌ Невірний код. Перевірте його на сайті та спробуйте ще раз.")

async def send_msg(user_id_site: int, text: str):
    async with async_session() as session:
        result = await session.execute(select(Users_in_telegram).filter_by(user_in_site=user_id_site))
        tg_user = result.scalars().first()
        if tg_user and tg_user.user_tg_id:
            try:
                await bot.send_message(tg_user.user_tg_id, text)
            except Exception as e:
                print(f"Помилка відправки користувачу: {e}")

async def notify_admins_new_problem(problem_id: int, problem_title: str):
    async with async_session() as session:
        admins_query = await session.execute(
            select(Users_in_telegram.user_tg_id)
            .join(User, User.id == Users_in_telegram.user_in_site)
            .filter(User.is_admin == True, Users_in_telegram.user_tg_id.isnot(None))
        )
        admin_tg_ids = admins_query.scalars().all()
        
        for tg_id in admin_tg_ids:
            try:
                await bot.send_message(tg_id, f" <b>Новий запит від клієнта!</b>\n\n ID заявки: {problem_id}\n Суть: {problem_title}", parse_mode="HTML")
            except Exception as e:
                print(f"Помилка відправки адміну: {e}")

async def start():
    """Запуск бота паралельно з FastAPI"""
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)