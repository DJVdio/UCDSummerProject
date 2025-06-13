# app/schemas/charging_stations.py

from pydantic import BaseModel
from typing import Optional, List


class ChargingStationBase(BaseModel):
    station_id: str
    name: Optional[str] = None
    description: Optional[str] = None
    city_id: Optional[str] = None
    connector_type: Optional[str] = None
    rated_power_kw: Optional[float] = None


class ChargingStationResponse(ChargingStationBase):
    # 前端接收 geometry 点时，可以用 [lng, lat] 列表
    location: Optional[List[float]] = None

    class Config:
        orm_mode = True
