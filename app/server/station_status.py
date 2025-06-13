from sqlalchemy.orm import Session

from app.models import StationStatus


def get_by_station_id(station_id, db: Session):
    station_statuses = db.query(
        StationStatus.id,
        StationStatus.station_id,
        StationStatus.timestamp,
        StationStatus.status,
        StationStatus.last_updated,
    ).filter(StationStatus.station_id == station_id)
    return station_statuses