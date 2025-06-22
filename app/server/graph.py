from datetime import timedelta, datetime, timezone
from typing import List, Dict

from sqlalchemy import func, and_
from sqlalchemy.orm import Session

from models import StationStatus
from server.charging_stations import get_by_city_id
from util.time_process import parse_datetime


def charging_sessions_counts(city_id: str, datetime_str: str, db: Session):
    try:
        parsed_datetime = parse_datetime(datetime_str)
        if parsed_datetime.tzinfo is None:
            parsed_datetime = parsed_datetime.replace(tzinfo=timezone.utc)
    except ValueError as e:
        raise ValueError(f"Invalid datetime format: {str(e)}")

    # 获取当天的起始时间 (00:00 UTC)
    start_of_day = parsed_datetime.replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    # 获取当天的结束时间 (次日00:00 UTC)
    end_of_day = start_of_day + timedelta(days=1)

    # 获取城市所有充电桩
    charging_stations = get_by_city_id(city_id, db)
    station_ids = [station.station_id for station in charging_stations]

    # 在数据库层面直接统计每个小时的OCCUPIED状态变化次数
    hourly_counts = get_hourly_session_counts(station_ids, start_of_day, end_of_day, db)

    # 生成结果列表
    sessions_list = []
    for hour in range(24):
        session_time = start_of_day + timedelta(hours=hour)
        count = hourly_counts.get(hour, 0)
        sessions_list.append({
            "time": session_time,
            "sessioncounts": count
        })
    result = {
        "date": datetime_str,
        "timezone": "Europe/Dublin",
        "charging_sessions":{
            "units":{
                "sessions": "count"
            },
            "data": sessions_list
        }
    }

    return result


def get_hourly_session_counts(station_ids: List[str], start_datetime: datetime, end_datetime: datetime, db: Session) -> \
Dict[int, int]:
    """获取每个小时的OCCUPIED状态变化次数"""
    if not station_ids:
        return {}

    # 转换aware时间为naive时间
    naive_start = start_datetime.replace(tzinfo=None)
    naive_end = end_datetime.replace(tzinfo=None)

    # 使用窗口函数检测状态变化
    subquery = db.query(
        StationStatus.station_id,
        StationStatus.timestamp,
        StationStatus.status,
        func.lag(StationStatus.status).over(
            partition_by=StationStatus.station_id,
            order_by=StationStatus.timestamp
        ).label('prev_status')
    ).filter(
        StationStatus.station_id.in_(station_ids),
        StationStatus.timestamp >= naive_start,
        StationStatus.timestamp < naive_end
    ).subquery()

    results = db.query(
        func.extract('hour', subquery.c.timestamp).label('hour'),
        func.count().label('count')
    ).filter(
        and_(
            subquery.c.prev_status != "OCCUPIED",
            subquery.c.status == "OCCUPIED"
        )
    ).group_by('hour').all()

    return {int(row.hour): row.count for row in results}