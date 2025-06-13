# app/schemas/station_status.py

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class StationStatusBase(BaseModel):
    station_id: str
    timestamp: datetime
    status: Optional[str] = None
    last_updated: Optional[datetime] = None

class StationStatusCreate(StationStatusBase):
    pass

class StationStatusResponse(StationStatusBase):
    id: int

    class Config:
        orm_mode = True
