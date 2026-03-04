import json
from datetime import datetime, timedelta


def get_next_f1_session():
    f = open("./public/f1sessions.json", encoding="utf-8")
    sessions = json.load(f)
    current_time = datetime.now()

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


def get_sessions_in_one_hour():
    f = open("./public/f1sessions.json", encoding="utf-8")
    sessions = json.load(f)
    current_time = datetime.now()
    upcoming_sessions = []

    for race in sessions["races"]:
        race_name = race["name"]
        for session_name, session_time_str in race["sessions"].items():
            if session_name.lower() not in ["qualifying", "gp"]:
                continue
            
            session_time = datetime.fromisoformat(session_time_str[:-1])
            time_until_session = session_time - current_time
            
            if 3480 < time_until_session.total_seconds() < 3720:
                upcoming_sessions.append((race_name, session_name.upper(), session_time.strftime("%H:%M UTC")))
    
    f.close()
    return upcoming_sessions


# COMMANDS LIST

# Check Pi system status (Storage, CPU, RAM, Uptime)
# Remind of next qual/race start
