import json
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import LabelEncoder
import joblib
from datetime import datetime, timedelta

with open("data/access_logs.json") as f:
    logs = json.load(f)

df = pd.DataFrame(logs)
df["timestamp_dt"] = df["timestamp"].apply(lambda t: datetime.fromisoformat(t))
df["hour"] = df["timestamp_dt"].apply(lambda t: t.hour)
df["is_off_hours"] = df["hour"].apply(lambda h: 1 if (h < 6 or h > 20) else 0)

action_encoder = LabelEncoder()
df["action_code"] = action_encoder.fit_transform(df["action"])

role_encoder = LabelEncoder()
df["role_code"] = role_encoder.fit_transform(df["role"])

# NEW FEATURE: how many actions has this same user done in the last 60 seconds?
# This is what lets us catch a ransomware-style rapid burst, not just single odd events.
df = df.sort_values(["user_id", "timestamp_dt"]).reset_index(drop=True)

def count_recent(row, all_rows):
    window_start = row["timestamp_dt"] - timedelta(seconds=60)
    mask = (
        (all_rows["user_id"] == row["user_id"])
        & (all_rows["timestamp_dt"] > window_start)
        & (all_rows["timestamp_dt"] <= row["timestamp_dt"])
    )
    return mask.sum()

df["recent_activity_count"] = df.apply(lambda row: count_recent(row, df), axis=1)

features = df[["hour", "is_off_hours", "action_code", "role_code", "recent_activity_count"]]

model = IsolationForest(contamination=0.1, random_state=42)
model.fit(features)

joblib.dump(model, "model.pkl")
joblib.dump(action_encoder, "action_encoder.pkl")
joblib.dump(role_encoder, "role_encoder.pkl")

df["predicted"] = model.predict(features)
df["predicted_anomaly"] = df["predicted"].apply(lambda p: 1 if p == -1 else 0)

correct = (df["predicted_anomaly"] == df["is_anomalous"]).sum()
total = len(df)
print(f"Model trained on {total} log entries.")
print(f"Matches actual anomaly labels on {correct}/{total} ({correct/total*100:.1f}%) entries.")