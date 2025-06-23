import requests
import psycopg2
from datetime import datetime

DB_CONFIG = {
    "host": "35.240.85.116",
    "port": 5432,
    "dbname": "ev_data",
    "user": "postgres",
    "password": "000000."
}

POST_URL = "https://myaccount.esbecars.com/stationFacade/findSitesInBounds"
HEADERS = {
    "Content-Type": "application/json",
    "Origin": "https://esb.ie",
    "Referer": "https://esb.ie/",
    "User-Agent": "Mozilla/5.0"
}

payload = {
    "filterByBounds": {
        "northEastLat": 55.4,
        "northEastLng": -5.2,
        "southWestLat": 51.3,
        "southWestLng": -10.6
    }
}

def map_status(raw_status):
    raw_status = raw_status.upper()
    if raw_status == "AVAILABLE":
        return "AVAILABLE"
    elif raw_status in {"CHARGING", "FINISHING", "OCCUPIED", "PAUSED", "PREPARING"}:
        return "OCCUPIED"
    else:
        return "OFFLINE"

resp = requests.post(POST_URL, json=payload, headers=HEADERS)
stations = resp.json()["data"]

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()
now = datetime.utcnow()

insert_count = 0
for s in stations:
    station_id = s["id"]

    cur.execute("SELECT 1 FROM charging_stations WHERE station_id = %s", (str(station_id),))
    if cur.fetchone() is None:
        print(f"[Jump] station_id={station_id} ")
        continue

    mapped_status = map_status(s["ss"])

    cur.execute("""
        INSERT INTO station_status (station_id, timestamp, status, last_updated)
        VALUES (%s, %s, %s, %s)
    """, (
        str(station_id),
        now,
        mapped_status,
        now
    ))
    insert_count += 1

conn.commit()
cur.close()
conn.close()
print(f"[{now}] insert: {insert_count} records")
