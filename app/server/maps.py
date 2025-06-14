from numpy.f2py.auxfuncs import throw_error
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import Dict, List
from datetime import datetime, date

from app.models import StationStatus
from app.server.charging_stations import get_by_city_id


def get_map_by_city_and_time(city_id: str, date: str, db: Session) -> Dict[str, List[dict]]:
    # 将字符串日期转换为 datetime 对象
    try:
        # 解析为日期对象
        query_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        throw_error("Invalid date format")

    charging_stations = get_by_city_id(city_id, db)
    station_info_list = []
    station_ids = []
    for station in charging_stations:
        station_info = {
            "lat": station.lat,
            "lon": station.lon,
            "popupInfo": {
                "id": station.station_id,
                "name": station.name,
                "description": station.description,
                "status": None,
                "lastUpdated": None
            }
        }
        station_info_list.append(station_info)
        station_ids.append(station.station_id)

    status_map = bulk_get_status(station_ids, query_date, db)
    for info in station_info_list:
        station_id = info["popupInfo"]["id"]
        if station_id in status_map:
            status = status_map[station_id]
            info["popupInfo"]["status"] = status.status
            info["popupInfo"]["lastUpdated"] = status.last_updated.isoformat() if status.last_updated else None

    # 使用原始日期字符串作为键返回
    return {date: station_info_list}


def bulk_get_status(station_ids: List[str], query_date: date, db: Session):
    if not station_ids:
        return {}
    start_date = datetime.combine(query_date, datetime.min.time())
    end_date = datetime.combine(query_date, datetime.max.time())
    subquery = (
        db.query(
            StationStatus.station_id,
            func.max(StationStatus.last_updated).label('max_updated')
        )
        .filter(
            StationStatus.station_id.in_(station_ids),
            StationStatus.last_updated >= start_date,
            StationStatus.last_updated <= end_date
        )
        .group_by(StationStatus.station_id)
        .subquery()
    )
    results = (
        db.query(StationStatus)
        .join(
            subquery,
            and_(
                StationStatus.station_id == subquery.c.station_id,
                StationStatus.last_updated == subquery.c.max_updated
            )
        )
        .all()
    )
    return {status.station_id: status for status in results}