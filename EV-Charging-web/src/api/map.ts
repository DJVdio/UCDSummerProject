import { createService } from '../utils/request';
import type { LatLngExpression } from 'leaflet';

const BASE_URL = "http://35.205.60.141:8000"; // backend import.meta.env.BASE_URL;
const BASE_URL_MOCK = "http://localhost:5173"; // frontend

// 创建 Axios 实例
const EV = createService(BASE_URL);

const EV_MOCK = createService(BASE_URL_MOCK);

/**
 * get location
 */
// city item
export interface CityApiItem {
  city_id: string;
  label: string;
  center: LatLngExpression;   // = [number, number]
}

// city res
export interface CitiesResponse {
  code: number;
  message: string;
  data: CityApiItem[];
}
export const getAllCities = async (): Promise<CitiesResponse> => {
  const response = await EV.get<CitiesResponse>('/cities/all'); // backend: '/cities/all' // /cities.mock.json
  return response.data;
};
// export const getAllCities = async (): Promise<CitiesResponse> => {
//   const response = await EV_MOCK.get<CitiesResponse>('/cities.mock.json'); // backend: '/cities/all' // /cities.mock.json
//   return response.data;
// };

/**
 * get charging stations
 */
export interface EVMarker {
  lat: number;
  lon: number;
  power_kW: number;
  connectorType: string;
  popupInfo: PopupInfo;
}
export interface PopupInfo {
  id: string;
  name: string;
  description: string;
  status: string;
  lastUpdated: string;
}
export interface MapResponse {
  code: number;
  message: string;
  data: Record<string, EVMarker[]>;
}
// export const getMapMarkers = async (): Promise<MapResponse> => {
//   const { data } = await EV_MOCK.get<MapResponse>(
//     '/map.mock.json',
//   ); //  /map.mock.json
//   return data;
// }
export const getMapMarkers = async (
  cityId: string,
  date: string
): Promise<MapResponse> => {
  const { data } = await EV.get<MapResponse>(
    '/map/get_map_by_city_and_time',
    {
      params: {
        city_id: cityId,
        date
      }
    }
  ); //  /map.mock.json
  return data;
}

/**
 * get chart data
 */
export interface ChartResponse<T> {
  code: number;
  message: string;
  data: T;
}
export interface GenConPayload {
  date: string;
  timezone: string;
  generation_gridload: GenerationConsumption;
}
export interface GenerationConsumption {
  // interval: string;
  unit: string;
  data: { time: string; generation_kw: number; gridload_kw: number }[];
}

export const getGenerationGridload = async ():
  Promise<ChartResponse<GenConPayload>> => {
  const resp = await EV_MOCK.get<ChartResponse<GenConPayload>>('/lineChart.mock.json');
  return resp.data;    // 这是 { code, message, data: GenerationConsumption }
};

export interface SessionCountsPayload {
  date: string;
  timezone: string;
  charging_sessions: {
    units: { sessions: string };
    data: { time: string; session_count: number }[];
  };
}

export interface EnergyDeliveredPayload {
  date: string;
  timezone: string;
  energy_delivered: {
    units: { energy: string };
    data: { time: string; energy_kwh: number }[];
  };
}
export const getSessionCounts = async (): Promise<
  ChartResponse<SessionCountsPayload>
> => {
  const resp = await EV_MOCK.get<ChartResponse<SessionCountsPayload>>(
    "/sessionCounts.mock.json"
  );
  return resp.data;
};


export const getEnergyDelivered = async (): Promise<
  ChartResponse<EnergyDeliveredPayload>
> => {
  const resp = await EV_MOCK.get<ChartResponse<EnergyDeliveredPayload>>(
    "/energyDelivered.mock.json"
  );
  return resp.data;
};
export interface StationUtilisation {
  date: string;
  timezone: string;
  station_utilisation: StationUtilisationData;
}
export interface StationUtilisationData {
  unit: string;  // "ratio"
  stations: StationRow[];
}
export interface StationRow {
  station_id: string;
  data: Array<{
    timestamp: string;      // ISO string
    utilisation: number;    // 0～1
  }>;
}

export const getStationUtilisation = async ():
  Promise<ChartResponse<StationUtilisation>> => {
  const resp = await EV_MOCK.get<ChartResponse<StationUtilisation>>('/heatChart.mock.json');
  return resp.data;
};