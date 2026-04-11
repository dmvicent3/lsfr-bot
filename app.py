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
from utils import get_next_f1_session, get_sessions_in_one_hour
from interactions.models.discord.enums import Status
from interactions.api.events import MessageCreate

import google.generativeai as genai

logging.basicConfig()
cls_log = logging.getLogger("MyLogger")
cls_log.setLevel(logging.DEBUG)

GUILD = os.getenv("DISCORD_GUILD")

BOT_ID = int(os.environ["DISCORD_BOT_ID"])

DISCORD_CHANNEL_ID = int(os.getenv("DISCORD_CHANNEL_ID"))
DISCORD_ROLE_ID = int(os.getenv("DISCORD_ROLE_ID"))

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


announced_sessions = set()

async def f1_ping_task():
    await bot.wait_until_ready()
    while True:
        try:
            channel = await bot.fetch_channel(DISCORD_CHANNEL_ID)
            sessions_to_announce = get_sessions_in_one_hour()
            
            for race_name, session_name, session_time in sessions_to_announce:
                session_key = f"{race_name}_{session_name}"
                if session_key not in announced_sessions:
                    message = f"<@&{DISCORD_ROLE_ID}> - {race_name} {session_name} starts in 1 hour! ({session_time})"
                    await channel.send(message)
                    announced_sessions.add(session_key)
                    cls_log.info("Announced %s", session_key)
        except (OSError, ValueError) as e:
            cls_log.error("Error in F1 ping task: %s", e)
        
        await asyncio.sleep(60)

@listen()
async def on_ready():
    print("Ready")
    asyncio.create_task(f1_ping_task())
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

    user_content = strip_all_mentions(message.content)

    prompt = user_content

    if message.message_reference and message.message_reference.message_id:
        try:
            ref_message = await message.channel.fetch_message(message.message_reference.message_id)
            ref_content = ref_message.content or ""
            prompt = f"[Original message]: {ref_content.strip()}\n[User reply]: {user_content}"
        except Exception as e: # pylint: disable=broad-exception-caught
            print(f"⚠️ Could not fetch replied-to message: {e}")

    print("Prompt for Gemini:", prompt)

    SYSTEM_INSTRUCTION = """
    Reply with only the final answer.
    Do not include reasoning, analysis, hidden thought, or step-by-step work.
    Be succinct with your answers and don't waste a token.
    """
    
    try:
        model = genai.GenerativeModel("gemma-4-31b-it", system_instruction=SYSTEM_INSTRUCTION)
        response = model.generate_content(prompt)
        answer = getattr(response, "text", str(response)).strip()
    except ValueError as e:
        answer = f"⚠️ Gemini error: {e}"
    except Exception as e:  # pylint: disable=broad-exception-caught
        answer = f"❗ Unexpected error: {e}"

    MAX_LEN = 2000
    if len(answer) <= MAX_LEN:
        await message.reply(answer)
    else:
        start = 0
        while start < len(answer):
            chunk = answer[start:start+MAX_LEN]
            if len(chunk) == MAX_LEN:
                last_nl = chunk.rfind('\n')
                if last_nl > 0:
                    chunk = chunk[:last_nl]
            await message.reply(chunk)
            start += len(chunk)


if __name__ == "__main__":
    bot.start()


