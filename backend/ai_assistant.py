import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("API_KEY")

MODEL_NAME = "gemini-3.1-flash-lite-preview"
client = genai.Client(api_key=API_KEY)

class TicketAssistantManager:
    @staticmethod
    def analyze_ticket(user_text: str) -> dict:
        instruction = (
            "Ти — досвідчений інженер сервісного центру та редактор. "
            "Твоє завдання — допомогти клієнту правильно і чітко сформулювати заявку на ремонт. "
            "Відповідай СУВОРО у форматі JSON. Структура JSON має бути такою:\n"
            "{\n"
            '  "corrected_text": "Виправлений варіант тексту (виправ граматику, зроби опис професійнішим і чіткішим)",\n'
            '  "solutions": ["Коротке можливе рішення 1 (що клієнт може спробувати сам)", "Можливе рішення 2"],\n'
            '  "questions": ["Уточнююче питання 1 (яку деталь варто вказати?)", "Уточнююче питання 2"]\n'
            "}"
        )
        
        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=user_text,
                config=types.GenerateContentConfig(
                    system_instruction=instruction,
                    temperature=0.3,
                    response_mime_type="application/json", 
                )
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"Помилка AI: {e}")
            return {
                "corrected_text": user_text,
                "solutions": ["Не вдалося згенерувати рішення."],
                "questions": ["Будь ласка, опишіть проблему максимально детально."]
            }