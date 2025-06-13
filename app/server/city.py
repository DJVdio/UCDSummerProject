from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import City


def get_all_cities(db: Session):  # 移除Depends
    cities = db.query(
        City.city_id,
        City.label,
        func.ST_X(City.center).label("lon"),
        func.ST_Y(City.center).label("lat")
    ).all()
    return cities