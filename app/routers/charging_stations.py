from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from util.response import Response
from server.charging_stations import get_by_station_id, get_by_city_id

router = APIRouter()

@router.get("/get_by_station_id")
def get_by_id_api(station_id, db: Session = Depends(get_db)):
    charging_station = get_by_station_id(station_id,db)
    result = {
        "station_id": charging_station.station_id,
        "name": charging_station.name,
        "description": charging_station.description,
        "location": [charging_station.lat, charging_station.lon] if charging_station.lon is not None else None,
        "city_id": charging_station.city_id,
        "connector_type": charging_station.connector_type,
        "rated_power_kw": charging_station.rated_power_kw
    }
    return Response.ok(result)

@router.get("/get_by_city_id")
def get_by_id_api(city_id, db: Session = Depends(get_db)):
    charging_stations = get_by_city_id(city_id,db)
    result = []
    for charging_station in charging_stations:
        result.append({
            "station_id": charging_station.station_id,
            "name": charging_station.name,
            "description": charging_station.description,
            "location": [charging_station.lat, charging_station.lon] if charging_station.lon is not None else None,
            "city_id": charging_station.city_id,
            "connector_type": charging_station.connector_type,
            "rated_power_kw": charging_station.rated_power_kw
        })
    return Response.ok(result)