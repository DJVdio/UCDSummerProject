from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.response import Response
from server.graph import get_charging_counts, get_city_energy

router = APIRouter()

@router.get("/charging_sessions_counts")
def charging_counts_api(city_id: str, db: Session = Depends(get_db)):
    data = get_charging_counts(city_id, db)
    return Response.ok(data)

@router.get("/city_energy")
def city_energy_api(db: Session = Depends(get_db)):
    data = get_city_energy(db)
    return Response.ok(data)