from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from models import StationStatus, ChargingStation, GridMetric


from sqlalchemy.sql import text

def get_charging_counts(city_id: str, db: Session):

    station_ids = db.query(ChargingStation.station_id).filter(
        ChargingStation.city_id == city_id
    ).subquery()


    results = db.query(
        func.date_trunc('minute', StationStatus.timestamp) \
            .label("raw_time"),
        func.count().label("count")
    ).filter(
        StationStatus.station_id.in_(station_ids),
        StationStatus.status == 'occupied'
    ).group_by("raw_time").order_by("raw_time").all()


    from datetime import datetime, timedelta

    counts = {}
    for r in results:
        raw_time: datetime = r.raw_time
        minute_block = raw_time.replace(minute=(raw_time.minute // 15) * 15, second=0, microsecond=0)
        key = minute_block.strftime("%Y-%m-%d %H:%M")
        counts[key] = counts.get(key, 0) + r.count

    return counts


def get_city_energy(db: Session):
    results = db.query(
        func.date_trunc('minute', GridMetric.timestamp).label("raw_time"),
        GridMetric.metric_type,
        func.sum(GridMetric.value_mw).label("total")
    ).group_by("raw_time", GridMetric.metric_type).order_by("raw_time").all()

    from datetime import datetime

    energy_data = {"generation": [], "load": []}
    for r in results:
        raw_time: datetime = r.raw_time
        minute_block = raw_time.replace(minute=(raw_time.minute // 15) * 15, second=0, microsecond=0)
        time_str = minute_block.strftime("%Y-%m-%d %H:%M")

        energy_data[r.metric_type].append({
            "datetime": time_str,
            "value": r.total
        })

    return energy_data

