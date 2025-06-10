from sqlalchemy import Column, String
from geoalchemy2 import Geometry
from app.database import Base


class City(Base):
    __tablename__ = 'cities'

    city_id = Column(String, primary_key=True)
    label = Column(String, nullable=False)
    center = Column(Geometry('POINT', srid=4326))