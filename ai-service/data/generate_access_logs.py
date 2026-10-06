import json
import random
from datetime import datetime, timedelta

random.seed(7)

ROLES = ["doctor", "nurse", "admin"]
USER_IDS = [f"DOC{100+i}" for i in range(10)] + [f"NUR{200+i}" for i in range(5)]
ACTIONS = ["read", "write"]

def load_record_ids():
    with open("ehr_records.json") as f:
        records = json.load(f)
    return [r["record_id"] for r in records]

def normal_log_entry(log_id, record_ids, base_time):
    return {
        "log_id": f"LOG{10000+log_id}",
        "user_id": random.choice(USER_IDS),
        "role": random.choice(ROLES),
        "record_id": random.choice(record_ids),
        "action": random.choice(ACTIONS),
        "timestamp": (base_time + timedelta(minutes=random.randint(0, 720))).isoformat(),
        "is_anomalous": 0
    }

def ransomware_burst(log_id_start, record_ids, base_time):
    """Simulates one compromised account rapidly reading/writing many records in seconds - a ransomware-like signature."""
    attacker = "DOC109"
    entries = []
    for i in range(30):
        entries.append({
            "log_id": f"LOG{10000+log_id_start+i}",
            "user_id": attacker,
            "role": "doctor",
            "record_id": random.choice(record_ids),
            "action": "write",
            "timestamp": (base_time + timedelta(seconds=i*2)).isoformat(),
            "is_anomalous": 1
        })
    return entries

def offhours_access(log_id_start, record_ids, base_time):
    """Simulates unusual off-hours access - another anomaly signature."""
    entries = []
    odd_hour_time = base_time.replace(hour=3, minute=random.randint(0,59))
    for i in range(5):
        entries.append({
            "log_id": f"LOG{10000+log_id_start+i}",
            "user_id": random.choice(USER_IDS),
            "role": "nurse",
            "record_id": random.choice(record_ids),
            "action": "read",
            "timestamp": (odd_hour_time + timedelta(minutes=i)).isoformat(),
            "is_anomalous": 1
        })
    return entries

def main():
    record_ids = load_record_ids()
    base_time = datetime.now().replace(hour=8, minute=0, second=0, microsecond=0)

    logs = [normal_log_entry(i, record_ids, base_time) for i in range(300)]
    logs += ransomware_burst(300, record_ids, base_time)
    logs += offhours_access(340, record_ids, base_time)

    random.shuffle(logs)

    with open("access_logs.json", "w") as f:
        json.dump(logs, f, indent=2)

    anomaly_count = sum(1 for l in logs if l["is_anomalous"] == 1)
    print(f"Generated {len(logs)} access log entries ({anomaly_count} anomalous) -> access_logs.json")

if __name__ == "__main__":
    main()