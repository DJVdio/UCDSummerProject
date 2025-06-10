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
export async function getMapMarkers(): Promise<MapResponse> {
  const { data } = await EV.get<MapResponse>('/map.mock.json');
  return data;
}