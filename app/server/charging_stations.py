from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import ChargingStation

def get_by_station_id(station_id, db: Session):
    charging_station = db.query(
        ChargingStation.station_id,
        ChargingStation.name,
        ChargingStation.description,
        func.ST_X(ChargingStation.location).label("lon"),
        func.ST_Y(ChargingStation.location).label("lat"),
        ChargingStation.city_id,
        ChargingStation.connector_type,
        ChargingStation.rated_power_kw
    ).filter(ChargingStation.station_id == station_id).first()
    return charging_station

def get_by_city_id(city_id, db: Session):
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
    return charging_stations