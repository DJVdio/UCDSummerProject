import requests
import psycopg2
from datetime import datetime

today = datetime.utcnow().strftime('%d-%b-%Y')

url = (
    "https://www.smartgriddashboard.com/api/chart/"
    f"?region=ALL&chartType=generation&dateRange=day"
    f"&dateFrom={today}&dateTo={today}"
    f"&areas=generationactual&compareData=demandactual"
)

r = requests.get(url)
rows = r.json()["Rows"]

conn = psycopg2.connect(
    host="35.240.85.116",
    port=5432,
    dbname="ev_data",
    user="postgres",
    password="000000."
)
cur = conn.cursor()

inserted = 0

for row in rows:
    if row["Value"] is None:
        continue

    ts = datetime.strptime(row["EffectiveTime"], "%d-%b-%Y %H:%M:%S")
    field = row["FieldName"]
    value = float(row["Value"])
    kind = "generation" if field == "GEN_EXP" else "load" if field == "SYSTEM_DEMAND" else None

    if not kind:
        continue

    cur.execute(
        "SELECT 1 FROM grid_metrics WHERE timestamp = %s AND metric_type = %s LIMIT 1;",
        (ts, kind)
    )
    if cur.fetchone():
        continue

    cur.execute(
        "INSERT INTO grid_metrics (timestamp, metric_type, value_mw) VALUES (%s, %s, %s);",
        (ts, kind, value)
    )
    inserted += 1

conn.commit()
cur.close()
conn.close()

print(f"[{datetime.utcnow()}] insert {inserted} notes")
