from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ChargingStation, StationStatus
from app.schemas.response import Response

def get_map_by_city_and_time(city_id, start_time, end_time, db: Session = Depends(get_db)):
    charging_stations = db.query(
        ChargingStation.station_id,
        ChargingStation.name,
        ChargingStation.description,
        func.ST_X(ChargingStation.location).label("lon"),
        func.ST_Y(ChargingStation.location).label("lat"),
        ChargingStation.city_id,
        ChargingStation.connector_type,
        ChargingStation.rated_power_kw
    ).filter(ChargingStation.city_id == city_id)
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