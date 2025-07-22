from datetime import datetime, timezone
from typing import Dict, List

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from models import StationStatus
from server.charging_stations import get_by_city_id
from util.time_process import parse_datetime


def get_map_by_city_and_time(city_id: str, datetime_str: str, db: Session) -> Dict[str, List[dict]]:
    # 保存原始输入的时间字符串（用于返回结果）
    original_datetime_str = datetime_str
    # 验证并解析时间字符串（处理各种时区格式）
    try:
        parsed_datetime = parse_datetime(datetime_str)
    except ValueError as e:
        raise ValueError(f"Invalid datetime format: {str(e)}")

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
                "type": station.connector_type,
                "power_rating": station.rated_power_kw,  # 新增字段
                "status": None,
                "lastUpdated": None
            }
        }
        station_info_list.append(station_info)
        station_ids.append(station.station_id)

    status_map = bulk_get_status(station_ids, parsed_datetime, db)

    for info in station_info_list:
        station_id = info["popupInfo"]["id"]
        if station_id in status_map:
            status = status_map[station_id]
            info["popupInfo"]["status"] = status.status
            if status.timestamp:
                if status.timestamp.tzinfo is None:
                    info["popupInfo"]["lastUpdated"] = status.timestamp.replace(tzinfo=timezone.utc).isoformat()
                else:
                    info["popupInfo"]["lastUpdated"] = status.timestamp.astimezone(timezone.utc).isoformat()

    return {original_datetime_str: station_info_list}



def bulk_get_status(station_ids: List[str], parsed_datetime: datetime, db: Session) -> Dict[str, object]:
    if not station_ids:
        return {}

    if parsed_datetime.tzinfo is None:
        query_datetime = parsed_datetime.replace(tzinfo=timezone.utc)
    else:
        query_datetime = parsed_datetime.astimezone(timezone.utc)

    # start_datetime = query_datetime - timedelta(minutes=15)
    end_datetime = query_datetime

    # 创建子查询：获取每个充电站在时间范围内的最新时间戳
    subquery = (
        db.query(
            StationStatus.station_id,
            func.max(StationStatus.last_updated).label('latest')
        )
        .filter(
            StationStatus.station_id.in_(station_ids),
            # StationStatus.timestamp >= start_datetime,
            StationStatus.timestamp <= end_datetime
        )
        .group_by(StationStatus.station_id)
        .subquery()
    )

    # 主查询：获取最新时间戳对应的完整状态记录
    results = (
        db.query(StationStatus)
        .join(
            subquery,
            and_(
                StationStatus.station_id == subquery.c.station_id,
                StationStatus.last_updated == subquery.c.latest
            )
        )
        .all()
    )

    return {status.station_id: status for status in results}


