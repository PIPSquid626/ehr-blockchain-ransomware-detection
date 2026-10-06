import json
import random
from datetime import datetime, timedelta

random.seed(42)

FIRST_NAMES = ["Ade", "Chidi", "Ngozi", "Musa", "Amaka", "Tunde", "Fatima", "Emeka", "Yusuf", "Blessing"]
LAST_NAMES = ["Okafor", "Bello", "Eze", "Yakubu", "Adeyemi", "Nwosu", "Ibrahim", "Uche", "Mohammed", "Okon"]
DIAGNOSES = ["Malaria", "Hypertension", "Type 2 Diabetes", "Typhoid Fever", "Asthma", "Peptic Ulcer", "Migraine"]
MEDICATIONS = ["Artemether", "Amlodipine", "Metformin", "Ciprofloxacin", "Salbutamol", "Omeprazole", "Paracetamol"]
DOCTOR_IDS = [f"DOC{100+i}" for i in range(10)]

def random_date(start_year=1960, end_year=2005):
    start = datetime(start_year, 1, 1)
    end = datetime(end_year, 12, 31)
    delta = end - start
    return (start + timedelta(days=random.randint(0, delta.days))).strftime("%Y-%m-%d")

def generate_ehr_record(record_id):
    attending_doctor = random.choice(DOCTOR_IDS)
    consented_doctors = [attending_doctor]
    if random.random() < 0.3:
        consented_doctors.append(random.choice(DOCTOR_IDS))

    return {
        "record_id": f"EHR{1000+record_id}",
        "patient_name": f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
        "date_of_birth": random_date(),
        "diagnosis": random.choice(DIAGNOSES),
        "medication": random.choice(MEDICATIONS),
        "attending_doctor": attending_doctor,
        "consented_doctors": consented_doctors,
        "created_at": datetime.now().isoformat(),
        "last_modified": datetime.now().isoformat()
    }

def main(num_records=200):
    records = [generate_ehr_record(i) for i in range(num_records)]
    with open("ehr_records.json", "w") as f:
        json.dump(records, f, indent=2)
    print(f"Generated {num_records} synthetic EHR records -> ehr_records.json")

if __name__ == "__main__":
    main()