from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from util.response import Response
from server.maps import get_map_by_city_and_time, get_whole_country_map

router = APIRouter()

@router.get("/get_map_by_city_and_time")
def get_map_by_city_and_time_api(city_id, datetime, db: Session = Depends(get_db)):
    station_info_list = get_map_by_city_and_time(city_id, datetime, db)
    return Response.ok(station_info_list)

@router.get("/get_whole_country_map")
def get_whole_contry_map_api(db: Session = Depends(get_db)):
    return Response.ok(get_whole_country_map(db))