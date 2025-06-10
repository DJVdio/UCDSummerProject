from pydantic import BaseModel
from typing import Optional, Tuple, List


class CityBase(BaseModel):
    city_id: str
    label: str

class CityResponse(CityBase):
    center: Optional[List[float]] = None