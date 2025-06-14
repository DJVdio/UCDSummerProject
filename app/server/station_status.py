from datetime import datetime

from sqlalchemy import func, cast, Date
from sqlalchemy.orm import Session

from models import StationStatus


def get_by_station_id(station_id, db: Session):
    station_statuses = db.query(
        StationStatus.id,
        StationStatus.station_id,
        StationStatus.timestamp,
        StationStatus.status,
        StationStatus.last_updated,
    ).filter(StationStatus.station_id == station_id)
    return station_statuses

def get_by_station_id_and_date(station_id, date, db: Session):
    if isinstance(date, str):
        date = datetime.strptime(date, "%Y-%m-%d").date()

    subquery = (
        db.query(
            StationStatus,
            func.rank().over(
                partition_by=StationStatus.station_id,
                order_by=StationStatus.last_updated.desc()
            ).label('rnk')
        )
        .filter(
            StationStatus.station_id == station_id,
            cast(StationStatus.timestamp, Date) == date
        )
        .subquery()
    )

    station_statuses = (
        db.query(
            subquery.c.id,
            subquery.c.station_id,
            subquery.c.timestamp,
            subquery.c.status,
            subquery.c.last_updated,
        )
        .filter(subquery.c.rnk == 1)
    )

    return station_statuses.first()