from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from util.response import Response
from server.city import get_all_cities

router = APIRouter()


@router.get("/all")
def get_all_cities_api(db: Session = Depends(get_db)):
    cities = get_all_cities(db)
    result = []
    for city in cities:
        result.append({
            "city_id": city.city_id,
            "label": city.label,
            "center": [city.lat, city.lon] if city.lon is not None else None
        })

    return Response.ok(result)