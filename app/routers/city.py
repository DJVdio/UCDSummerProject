from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import City
from app.schemas.response import StandardResponse, Response
from app.schemas.city import CityResponse

router = APIRouter()


@router.get("/all", response_model=StandardResponse[List[CityResponse]])
def get_all_cities(db: Session = Depends(get_db)):
    cities = db.query(
        City.city_id,
        City.label,
        func.ST_X(City.center).label("lon"),
        func.ST_Y(City.center).label("lat")
    ).all()

    result = []
    for city in cities:
        result.append({
            "city_id": city.city_id,
            "label": city.label,
            "center": [city.lat, city.lon] if city.lon is not None else None
        })

    return Response.ok(result)