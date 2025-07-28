from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from util.response import Response
from server.maps import get_map_by_city_and_time, get_whole_country_map, get_cus_map

router = APIRouter()


@router.get("/get_map_by_city_and_time")
def get_map_by_city_and_time_api(city_id, datetime, db: Session = Depends(get_db)):
    return Response.ok(get_map_by_city_and_time(city_id, datetime, db))


@router.get("/get_whole_country_map")
def get_whole_contry_map_api(db: Session = Depends(get_db)):
    return Response.ok(get_whole_country_map(db))


@router.get("/cus_map")
def cus_map_api(city_id: str, datetime: str, location1: str, location2: str, db: Session = Depends(get_db)):
    return Response.ok(get_cus_map(city_id, datetime, location1, location2, db))
