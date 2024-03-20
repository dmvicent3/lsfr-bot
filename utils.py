import psutil
import os
import json
from datetime import datetime, timedelta


def get_system_info():
    # Get CPU usage
    cpu_usage = psutil.cpu_percent()

    # Get available memory
    memory = psutil.virtual_memory()
    available_memory = memory.available / (1024**3)  # Convert to GB

    # Get disk usage
    disk_usage = psutil.disk_usage("/")
    available_disk = disk_usage.free / (1024**3)  # Convert to GB

    # Get network information
    network_info = psutil.net_io_counters()
    upload_speed = network_info.bytes_sent
    download_speed = network_info.bytes_recv

    # Get system temperature
    cpu_temp = (
        os.popen("vcgencmd measure_temp")
        .readline()
        .replace("temp=", "")
        .replace("'C\n", "")
    )

    # Get system uptime
    uptime = int(psutil.boot_time())

    return f"CPU Usage: {cpu_usage}%\nAvailable Memory: {available_memory:.2f} GB\nAvailable Disk Space: {available_disk:.2f} GB\nUpload Speed: {upload_speed} bytes/sec\nDownload Speed: {download_speed} bytes/sec\nCPU Temperature: {cpu_temp}\nUptime: {uptime} seconds"


def get_next_f1_session():
    f = open("./public/f1sessions.json")
    sessions = json.load(f)
    current_time = datetime.utcnow()

    for race in sessions["races"]:
        for session_name, session_time_str in race["sessions"].items():
            session_time = datetime.fromisoformat(session_time_str[:-1])
            if current_time < session_time:
                time_left = session_time - current_time
                if time_left.days > 1:
                    return f"{session_name}: {time_left.days}d"
                f.close()
                return f"{session_name}: {time_left.seconds // 3600}h:{time_left.seconds % 3600 // 60}m"

            # Check if the session is currently happening
            if session_name != "GP":
                session_end_time = session_time + timedelta(hours=1)
            else:
                session_end_time = session_time + timedelta(hours=2)

            if session_time <= current_time <= session_end_time:
                f.close()
                return f"{session_name} is LIVE"
    f.close()
    return "No upcoming sessions"


# COMMANDS LIST

# Check Pi system status (Storage, CPU, RAM, Uptime)
# Remind of next qual/race start
