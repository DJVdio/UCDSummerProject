from sqlalchemy import Column, String, Text, Float
from geoalchemy2 import Geometry
from app.database import Base


class ChargingStation(Base):
    __tablename__ = "charging_stations"

    station_id = Column(String, primary_key=True, index=True)
    name = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    location = Column(Geometry("POINT", srid=4326), nullable=True)
    city_id = Column(String, nullable=True)
    connector_type = Column(String, nullable=True)
    rated_power_kw = Column(Float, nullable=True)
