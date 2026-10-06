from fastapi import FastAPI
from pydantic import BaseModel
import joblib
from datetime import datetime, timedelta
from collections import defaultdict

app = FastAPI()

model = joblib.load("model.pkl")
action_encoder = joblib.load("action_encoder.pkl")
role_encoder = joblib.load("role_encoder.pkl")

# Tracks recent request timestamps per user, in memory, to detect rapid bursts
recent_events = defaultdict(list)

def get_recent_activity_count(user_id, current_time):
    window_start = current_time - timedelta(seconds=60)
    events = [t for t in recent_events[user_id] if t > window_start]
    events.append(current_time)
    recent_events[user_id] = events
    return len(events)

class LogEntry(BaseModel):
    user_id: str
    role: str
    record_id: str
    action: str
    timestamp: str

@app.get("/health")
def health():
    return {"status": "AI detection service running"}
@app.post("/reset")
def reset():
    recent_events.clear()
    return {"status": "AI service memory cleared"}

@app.post("/score")
def score(entry: LogEntry):
    current_time = datetime.fromisoformat(entry.timestamp)
    hour = current_time.hour
    is_off_hours = 1 if (hour < 6 or hour > 20) else 0
    action_code = action_encoder.transform([entry.action])[0]
    role_code = role_encoder.transform([entry.role])[0]
    recent_count = get_recent_activity_count(entry.user_id, current_time)

    features = [[hour, is_off_hours, action_code, role_code, recent_count]]
    prediction = model.predict(features)[0]
    anomaly_score = model.decision_function(features)[0]
    is_anomalous = prediction == -1

    if is_anomalous and recent_count >= 5:
        reason = "Rapid repeated activity - possible ransomware behavior"
    elif is_anomalous and is_off_hours:
        reason = "Off-hours access"
    elif is_anomalous:
        reason = "Unusual access pattern"
    else:
        reason = "Normal"

    return {
        "is_anomalous": bool(is_anomalous),
        "anomaly_score": float(anomaly_score),
        "recent_activity_count": recent_count,
        "reason": reason
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
    