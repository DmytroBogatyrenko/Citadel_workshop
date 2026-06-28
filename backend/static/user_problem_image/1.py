from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import logging

app = FastAPI()

# Налаштування логування
logging.basicConfig(level=logging.INFO)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # Приймаємо WebSocket-з'єднання
    await websocket.accept()
    logging.info("WebSocket з'єднання встановлено.")

    try:
        while True:
            # Отримуємо текстове повідомлення від клієнта
            data = await websocket.receive_text()
            logging.info(f"Отримано повідомлення: {data}")

            # Відправляємо відповідь клієнту
            await websocket.send_text(f"Повідомлення отримано: {data}")

    except WebSocketDisconnect:
        logging.info("Клієнт від'єднався.")
    except Exception as e:
        # Обробка загальних помилок
        logging.error(f"Помилка: {e}")
    finally:
        # Закриваємо WebSocket-з'єднання
        await websocket.close()
        logging.info("WebSocket з'єднання закрито.")