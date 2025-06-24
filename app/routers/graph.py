from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends

from database import get_db
from server.graph import charging_sessions_counts, city_energy
from util.response import Response

router = APIRouter()

@router.get("/charging_sessions_counts")
def charging_sessions_counts_api(city_id, start_time, end_time, db: Session = Depends(get_db)):
    result = charging_sessions_counts(city_id, start_time, end_time, db)
    return Response.ok(result)

@router.get("/city_energy")
def city_energy_api(city_id, start_time, end_time, db: Session = Depends(get_db)):
    result = city_energy(city_id, start_time, end_time, db)
    return Response.ok(result)