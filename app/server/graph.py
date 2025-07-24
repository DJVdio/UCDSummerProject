from collections import defaultdict
from datetime import timedelta, datetime, timezone
from typing import List, Dict

from sqlalchemy import func, and_, case
from sqlalchemy.orm import Session

from models import StationStatus, GridMetric
from server.charging_stations import get_by_city_id
from util.time_process import parse_datetime, process_start_end_time


def charging_sessions_counts(city_id: str, start_time: str, end_time: str, db: Session):
    try:
        parsed_start, parsed_end = process_start_end_time(start_time, end_time)
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


def city_energy(city_id: str, start_time: str, end_time: str, db: Session):
    try:
        parsed_start, parsed_end = process_start_end_time(start_time, end_time)
    except ValueError as e:
        raise ValueError(f"Invalid datetime format: {str(e)}")

    # 获取城市所有充电桩
    charging_stations = get_by_city_id(city_id, db)
    station_ids = [station.station_id for station in charging_stations]
    # 创建station_id到额定功率的映射
    station_power_map = {station.station_id: station.rated_power_kw for station in charging_stations}
    occupied_records = get_occupied_records(station_ids, parsed_start, parsed_end, db)
    hourly_energy = {}

    current_hour = parsed_start.replace(minute=0, second=0, microsecond=0)
    end_hour = parsed_end.replace(minute=0, second=0, microsecond=0)
    while current_hour <= end_hour:
        hourly_energy[current_hour] = 0.0
        current_hour += timedelta(hours=1)

    if not occupied_records:
        return format_energy_result(start_time, hourly_energy)

    session_start = None
    for i in range(len(occupied_records)):
        record = occupied_records[i]
        station_id = record.station_id
        timestamp = record.timestamp.replace(tzinfo=timezone.utc)
        power = station_power_map.get(station_id, 0)
        if power is None:
            continue
        # 新会话开始
        if session_start is None:
            session_start = timestamp
        # 检查会话是否结束
        end_session = False
        if i == len(occupied_records) - 1:
            end_session = True
        else:
            next_record = occupied_records[i + 1]
            time_diff = (next_record.timestamp - record.timestamp).total_seconds()
            # 超过1小时间隔或更换充电站视为新会话
            if next_record.station_id != station_id or time_diff > 3600:
                end_session = True
        # 结束当前会话
        if end_session:
            session_end = timestamp
            # 确保会话时间在查询范围内
            session_start = max(session_start, parsed_start)
            session_end = min(session_end, parsed_end)
            if session_start < session_end:
                # 计算会话跨越的小时区间
                current_hour = session_start.replace(minute=0, second=0, microsecond=0)
                end_hour = session_end.replace(minute=0, second=0, microsecond=0)
                # 处理会话跨越的每个小时
                while current_hour <= end_hour:
                    # 计算当前小时的开始和结束时间
                    hour_start = max(session_start, current_hour)
                    hour_end = min(session_end, current_hour + timedelta(hours=1))
                    # 计算该小时内的持续时间（小时）
                    duration = (hour_end - hour_start).total_seconds() / 3600.0
                    # 计算该小时内的用电量
                    energy = duration * power
                    # 累加到小时用电量
                    if current_hour in hourly_energy:
                        hourly_energy[current_hour] += energy
                    else:
                        hourly_energy[current_hour] = energy
                    # 移动到下一个小时
                    current_hour += timedelta(hours=1)
            # 重置会话跟踪
            session_start = None

    return format_energy_result(start_time, hourly_energy)


def get_occupied_records(station_ids: List[str], start_time: datetime, end_time: datetime, db: Session):
    naive_start = start_time.astimezone(timezone.utc).replace(tzinfo=None)
    naive_end = end_time.astimezone(timezone.utc).replace(tzinfo=None)

    return (
        db.query(StationStatus)
        .filter(
            StationStatus.station_id.in_(station_ids),
            StationStatus.status == "OCCUPIED",
            StationStatus.timestamp >= naive_start,
            StationStatus.timestamp < naive_end
        )
        .order_by(StationStatus.station_id, StationStatus.timestamp)
        .all()
    )

def format_energy_result(date_str: str, hourly_energy: dict) -> dict:
    """格式化用电量结果"""
    energy_data = []
    for hour_start, energy in sorted(hourly_energy.items()):
        energy_data.append({
            "time": hour_start.isoformat(),
            "energy_kwh": round(energy, 2)  # 四舍五入保留两位小数
        })

    return {
        "date": date_str,
        "timezone": "Europe/Dublin",
        "energy_delivered": {
            "units": {"energy": "kWh"},
            "data": energy_data
        }
    }

def grid_generation_vs_load(start_time: str, end_time: str, db: Session):
    try:
        parsed_start, parsed_end = process_start_end_time(start_time, end_time)
    except ValueError as e:
        raise ValueError(f"Invalid datetime format: {str(e)}")

    naive_start = parsed_start.astimezone(timezone.utc).replace(tzinfo=None)
    naive_end = parsed_end.astimezone(timezone.utc).replace(tzinfo=None)

    # 聚合每小时的generation与load
    data = db.query(
        func.date_trunc('hour', GridMetric.timestamp).label('hour'),
        GridMetric.metric_type,
        func.avg(GridMetric.value_mw).label('avg_mw')
    ).filter(
        GridMetric.timestamp >= naive_start,
        GridMetric.timestamp < naive_end,
        GridMetric.metric_type.in_(["generation", "load"])
    ).group_by('hour', GridMetric.metric_type).order_by('hour').all()

    # 整理为结构化数据
    hourly_data = {}
    for hour, mtype, value in data:
        if hour not in hourly_data:
            hourly_data[hour] = {"generation_mw": 0.0, "load_mw": 0.0}
        if mtype == "generation":
            hourly_data[hour]["generation_mw"] = round(value, 2)
        elif mtype == "load":
            hourly_data[hour]["load_mw"] = round(value, 2)

    return {
        "start_time": start_time,
        "end_time": end_time,
        "timezone": "Europe/Dublin",
        "grid_energy": [
            {
                "time": hour.replace(tzinfo=timezone.utc).isoformat(),
                **values
            }
            for hour, values in sorted(hourly_data.items())
        ]
    }


def station_utilisation(city_id: str, start_time: str, end_time: str, db: Session):
    try:
        parsed_start, parsed_end = process_start_end_time(start_time, end_time)
    except ValueError as e:
        raise ValueError(f"Invalid datetime format: {str(e)}")

    date = start_time

    # 获取城市所有充电桩
    charging_stations = get_by_city_id(city_id, db)
    station_name_map = {station.station_id: station.name for station in charging_stations}
    station_ids = list(station_name_map.keys())

    if not station_ids:
        return {
            "date": date,
            "timezone": "Europe/Dublin",
            "station_utilisation": {
                "unit": "ratio",
                "stations": []
            }
        }

    # --- 1. 取所有记录 & OCCUPIED 记录 ---
    all_records = (
        db.query(StationStatus.station_id, StationStatus.timestamp)
        .filter(
            StationStatus.station_id.in_(station_ids),
            StationStatus.timestamp >= parsed_start,
            StationStatus.timestamp < parsed_end
        )
        .order_by(StationStatus.station_id, StationStatus.timestamp)
        .all()
    )
    occupied_records = (
        db.query(StationStatus.station_id, StationStatus.timestamp)
        .filter(
            StationStatus.station_id.in_(station_ids),
            StationStatus.status == "OCCUPIED",
            StationStatus.timestamp >= parsed_start,
            StationStatus.timestamp < parsed_end
        )
        .order_by(StationStatus.station_id, StationStatus.timestamp)
        .all()
    )

    # --- 2. 统一使用 UTC-aware 的整点小时作为 key ---
    # 初始化计数结构
    all_counts = {sid: defaultdict(int) for sid in station_ids}
    occ_counts = {sid: defaultdict(int) for sid in station_ids}

    # 累加所有记录
    for station_id, ts in all_records:
        # 假设数据库存储 UTC-naive，先标记为 UTC，然后取小时
        hour = ts.replace(tzinfo=timezone.utc).replace(minute=0, second=0, microsecond=0)
        all_counts[station_id][hour] += 1

    # 累加 OCCUPIED 记录
    for station_id, ts in occupied_records:
        hour = ts.replace(tzinfo=timezone.utc).replace(minute=0, second=0, microsecond=0)
        occ_counts[station_id][hour] += 1

    # --- 3. 生成每小时利用率 ---
    stations_list = []

    # 迭代器也用 UTC-aware 整点小时
    current = parsed_start.astimezone(timezone.utc).replace(minute=0, second=0, microsecond=0)
    end_hour = parsed_end.astimezone(timezone.utc).replace(minute=0, second=0, microsecond=0)

    for station_id in station_ids:
        data = []
        hour = current
        while hour < end_hour:
            total = all_counts[station_id].get(hour, 0)
            occ = occ_counts[station_id].get(hour, 0)
            utilisation = occ / total if total > 0 else 0.0

            data.append({
                "timestamp": hour.isoformat(),
                "utilisation": round(utilisation, 4)
            })
            hour += timedelta(hours=1)

        stations_list.append({
            "station_id": station_id,
            "station_name": station_name_map[station_id],
            "data": data
        })

    return {
        "date": date,
        "timezone": "Europe/Dublin",
        "station_utilisation": {
            "unit": "ratio",
            "stations": stations_list
        }
    }