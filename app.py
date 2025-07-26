import asyncio
from dotenv import load_dotenv

load_dotenv()
import os
from interactions import (
    Activity,
    ActivityType,
    Client,
    Intents,
    listen,
)
import logging
from utils import get_next_f1_session
from interactions.models.discord.enums import Status


import google.generativeai as genai
from interactions.api.events import MessageCreate

logging.basicConfig()
cls_log = logging.getLogger("MyLogger")
cls_log.setLevel(logging.DEBUG)

GUILD = os.getenv("DISCORD_GUILD")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("Warning: GEMINI_API_KEY not set in environment.")


bot = Client(
    sync_interactions=True,
    asyncio_debug=True,
    logger=cls_log,
    token=os.environ.get("DISCORD_TOKEN"),
    intents=Intents.ALL,
    default_prefix="!",
)


@listen()
async def on_ready():
    print("Ready")
    while True:
        await bot.change_presence(
            Status.ONLINE,
            Activity(type=ActivityType.WATCHING, name=get_next_f1_session()),
        )
        await asyncio.sleep(60)


if __name__ == "__main__":
    bot.start()


@listen()
async def on_message(event: MessageCreate):
    print("MessageCreate event received:", event)
    message = event.message

    if message.author.bot:
        return

    if bot.user and any(str(bot.user.id) in str(mention.id) for mention in message.mentions):
        prompt = message.content
        print("Prompt:", prompt)

        if bot.user.username in prompt:
            prompt = prompt.replace(f"@{bot.user.username}", "").strip()
        try:
            model = genai.GenerativeModel('gemini-2.0-flash')
            response = model.generate_content(prompt)
            answer = response.text.strip() if hasattr(response, 'text') else str(response)
        except ValueError as e:
            answer = f"Sorry, Gemini could not generate a response. ({e})"
        except Exception as e: # pylint: disable=broad-exception-caught
            answer = f"Sorry, an unexpected error occurred. ({e})"
        print("Answer:", answer)
        await message.reply(answer)
