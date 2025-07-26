import asyncio
from dotenv import load_dotenv
import re

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
from interactions.api.events import MessageCreate

import google.generativeai as genai

logging.basicConfig()
cls_log = logging.getLogger("MyLogger")
cls_log.setLevel(logging.DEBUG)

GUILD = os.getenv("DISCORD_GUILD")

BOT_ID = int(os.environ["DISCORD_BOT_ID"])

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
    intents=Intents.ALL | Intents.GUILDS | Intents.MESSAGE_CONTENT | Intents.GUILD_MESSAGES,
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

MENTION_ID_RE = re.compile(r"<@!?(?P<id>\d+)>")

def extract_mention_ids(content: str) -> list[int]:
    return [int(m.group("id")) for m in MENTION_ID_RE.finditer(content)]

def strip_all_mentions(content: str) -> str:
    return MENTION_ID_RE.sub("", content).strip()

@listen()
async def on_message_create(event: MessageCreate):
    message = event.message

    if message.author.bot:
        return

    mentioned_ids = extract_mention_ids(message.content)

    if BOT_ID not in mentioned_ids:
        return

    prompt = strip_all_mentions(message.content)
    print("Prompt for Gemini:", prompt)

    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        answer = getattr(response, "text", str(response)).strip()
    except ValueError as e:
        answer = f"⚠️ Gemini error: {e}"
    except Exception as e:
        answer = f"❗ Unexpected error: {e}"

    await message.reply(answer)


if __name__ == "__main__":
    bot.start()


