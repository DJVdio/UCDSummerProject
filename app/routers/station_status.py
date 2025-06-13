from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import StationStatus
from app.schemas.response import Response

router = APIRouter()

@router.get("/get_by_station_id")
def get_by_id(station_id, db: Session = Depends(get_db)):
    station_statuses = db.query(
        StationStatus.id,
        StationStatus.station_id,
        StationStatus.timestamp,
        StationStatus.status,
        StationStatus.last_updated,
    ).filter(StationStatus.station_id == station_id)

    result = []
    for station_status in station_statuses:
        result.append({
            "id": station_status.id,
            "station_id": station_status.station_id,
            "timestamp": station_status.timestamp,
            "status": station_status.status,
            "last_updated": station_status.last_updated
        })

    return Response.ok(result)