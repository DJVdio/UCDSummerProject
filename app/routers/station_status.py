from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.response import Response
from server.station_status import get_by_station_id

router = APIRouter()

@router.get("/get_by_station_id")
def get_by_station_id_api(station_id, db: Session = Depends(get_db)):
    station_statuses = get_by_station_id(station_id, db)
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