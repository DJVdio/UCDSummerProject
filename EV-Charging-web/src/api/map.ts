import { createService } from '../utils/request';
import type { LatLngExpression } from 'leaflet';

// const BASE_URL = "https://9026-37-228-239-110.ngrok-free.app"; // backend import.meta.env.BASE_URL;
const BASE_URL = "http://localhost:5173"; // frontend

// 创建 Axios 实例
const EV = createService(BASE_URL);

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
  const response = await EV.get<CitiesResponse>('/cities.mock.json'); // backend: '/cities/all'
  return response.data;
};

/**
 * get charging stations
 */
export interface EVMarker {
  lat: number;
  lng: number;
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
export const getMapMarkers = async (): Promise<MapResponse> => {
  const { data } = await EV.get<MapResponse>('/map.mock.json');
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
  generation_consumption: GenerationConsumption;
}
export interface GenerationConsumption {
  interval: string;
  unit: string;
  data: { time: string; generation_kw: number; consumption_kw: number }[];
}
export interface SessionsAndEnergy {
  date: string;
  timezone: string;
  charging_sessions: ChargingSessions;
}
export interface ChargingSessions {
  interval: string;
  units: { sessions: string; energy: string };
  data: { time: string; session_count: number; energy_kwh: number }[];
}

export interface StationUtilisation {
  interval: string;
  unit: string;
  stations: { station_id: string; utilisation: number[] }[];
}
export const getGenerationConsumption = async ():
  Promise<ChartResponse<GenConPayload>> => {
  const resp = await EV.get<ChartResponse<GenConPayload>>('/lineChart.mock.json');
  return resp.data;    // 这是 { code, message, data: GenerationConsumption }
};

export const getChargingSessions = async ():
  Promise<ChartResponse<SessionsAndEnergy>> => {
  const resp = await EV.get<ChartResponse<SessionsAndEnergy>>('/barChart.mock.json');
  return resp.data;
};

export const getStationUtilisation = async ():
  Promise<ChartResponse<StationUtilisation>> => {
  const resp = await EV.get<ChartResponse<StationUtilisation>>('/heatChart.mock.json');
  return resp.data;
};