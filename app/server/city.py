from sqlalchemy import func
from sqlalchemy.orm import Session

from models import City, ChargingStation


def get_all_cities(db: Session):
    cities = (
        db.query(
            City.city_id,
            City.label,
            func.ST_X(City.center).label("lon"),
            func.ST_Y(City.center).label("lat")
        )
        .filter(
            db.query(ChargingStation)
            .filter(ChargingStation.city_id == City.city_id)
            .exists()
        )
        .all()
    )
    return cities