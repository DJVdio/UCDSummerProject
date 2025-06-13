from sqlalchemy.orm import Session

from app.server.charging_stations import get_by_city_id
from app.server.station_status import get_by_station_id_and_date


def get_map_by_city_and_time(city_id, date, db: Session):
    station_info_list = []
    charging_stations = get_by_city_id(city_id, db)
    for charging_station in charging_stations:
        station_info_list.append({
            "lat": charging_station.lat,
            "lon": charging_station.lon,
            "popupInfo": {
                "id": charging_station.station_id,
                "name": charging_station.name,
                "description": charging_station.description,
                "status": None,
                "lastUpdated": None
            }
        })
    for station_info in station_info_list:
        station_status = get_by_station_id_and_date(station_info["popupInfo"]["id"], date, db)
        if station_status:
            station_info["popupInfo"]["status"] = station_status.status
            station_info["popupInfo"]["lastUpdated"] = station_status.last_updated
    result = {
        date: station_info_list
    }
    return result
