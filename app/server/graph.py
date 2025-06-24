from datetime import timedelta, datetime, timezone
from typing import List, Dict

from sqlalchemy import func, and_
from sqlalchemy.orm import Session

from models import StationStatus
from server.charging_stations import get_by_city_id
from util.time_process import parse_datetime


def charging_sessions_counts(city_id: str, start_time: str, end_time: str, db: Session):
    try:
        # 解析开始时间和结束时间
        parsed_start = parse_datetime(start_time)
        parsed_end = parse_datetime(end_time)

        # 确保有时区信息（默认UTC）
        if parsed_start.tzinfo is None:
            parsed_start = parsed_start.replace(tzinfo=timezone.utc)
        if parsed_end.tzinfo is None:
            parsed_end = parsed_end.replace(tzinfo=timezone.utc)
    except ValueError as e:
        raise ValueError(f"Invalid datetime format: {str(e)}")

    # 获取城市所有充电桩
    charging_stations = get_by_city_id(city_id, db)
    station_ids = [station.station_id for station in charging_stations]

    # 在数据库层面直接统计每个小时的OCCUPIED状态变化次数
    hourly_counts = get_hourly_session_counts(station_ids, parsed_start, parsed_end, db)

    # 生成从开始时间到结束时间的所有整点小时
    current_hour = parsed_start.replace(minute=0, second=0, microsecond=0)
    end_hour = parsed_end.replace(minute=0, second=0, microsecond=0)
    sessions_list = []

    # 遍历每个整点小时
    while current_hour < end_hour:
        # 获取该小时的计数（若无则为0）
        count = hourly_counts.get(current_hour, 0)
        sessions_list.append({
            "time": current_hour.isoformat(),  # 使用ISO格式时间字符串
            "sessioncounts": count
        })
        current_hour += timedelta(hours=1)

    result = {
        "start_time": start_time,
        "end_time": end_time,
        "timezone": "Europe/Dublin",
        "charging_sessions": {
            "units": {
                "sessions": "count"
            },
            "data": sessions_list
        }
    }

    return result


def get_hourly_session_counts(
        station_ids: List[str], start_datetime: datetime, end_datetime: datetime, db: Session) -> Dict[datetime, int]:
    """获取每个整点小时的OCCUPIED状态变化次数"""
    if not station_ids:
        return {}

    # 转换aware时间为naive时间（假设数据库存储UTC时间）
    naive_start = start_datetime.astimezone(timezone.utc).replace(tzinfo=None)
    naive_end = end_datetime.astimezone(timezone.utc).replace(tzinfo=None)

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

    # 按小时分组并计数
    results = db.query(
        func.date_trunc('hour', subquery.c.timestamp).label('hour_start'),
        func.count().label('count')
    ).filter(
        and_(
            subquery.c.prev_status != "OCCUPIED",
            subquery.c.status == "OCCUPIED"
        )
    ).group_by('hour_start').all()

    # 将结果转换为aware datetime对象（UTC时区）
    return {
        # 将数据库返回的naive时间转为aware UTC时间
        hour_start.replace(tzinfo=timezone.utc): count
        for hour_start, count in results
    }