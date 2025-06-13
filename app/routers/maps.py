from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.response import Response
from app.server.maps import get_map_by_city_and_time

router = APIRouter()

@router.get("/get_map_by_city_and_time")
def get_map_by_city_and_time_api(city_id, date, db: Session = Depends(get_db)):
    station_info_list = get_map_by_city_and_time(city_id, date, db)
    return Response.ok(station_info_list)