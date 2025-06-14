# app/models/station_status.py

from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey
from database import Base

class StationStatus(Base):
    __tablename__ = "station_status"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    station_id = Column(String, ForeignKey("charging_stations.station_id"), nullable=False)
    timestamp = Column(TIMESTAMP, nullable=False)
    status = Column(String, nullable=True)
    last_updated = Column(TIMESTAMP, nullable=True)
