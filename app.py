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

logging.basicConfig()
cls_log = logging.getLogger("MyLogger")
cls_log.setLevel(logging.DEBUG)

GUILD = os.getenv("DISCORD_GUILD")


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
