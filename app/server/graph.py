from datetime import timedelta

from sqlalchemy.orm import Session

from server.charging_stations import get_by_city_id
from util.time_process import parse_datetime


def charging_sessions_counts(city_id: str, datetime_str: str, db: Session):
    original_datetime_str = datetime_str
    try:
        parsed_datetime = parse_datetime(datetime_str)
    except ValueError as e:
        raise ValueError(f"Invalid datetime format: {str(e)}")
    charging_stations = get_by_city_id(city_id, db)
    sessions_list = []
    for i in range(24):
        session = {
            "time": parsed_datetime + timedelta(hours=i),
            "sessioncounts": 0
        }
        sessions_list.append(session)
    return sessions_list