from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base

class GridMetric(Base):
    __tablename__ = "grid_metrics"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True, nullable=False)
    metric_type = Column(String, index=True, nullable=False)  # "generation" or "load"
    value_mw = Column(Float, nullable=False)
