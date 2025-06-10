from pydantic import BaseModel
from typing import Optional, Tuple

class CityBase(BaseModel):
    city_id: str
    label: str

class CityResponse(CityBase):
    center: Optional[Tuple[float, float]] = None