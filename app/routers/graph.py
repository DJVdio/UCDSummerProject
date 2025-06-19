from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends

from database import get_db
from server.graph import charging_sessions_counts
from util.response import Response

router = APIRouter()

@router.get("/charging_sessions_counts")
def charging_sessions_counts_api(city_id, datetime, db: Session = Depends(get_db)):
    station_info_list = charging_sessions_counts(city_id, datetime, db)
    return Response.ok(station_info_list)