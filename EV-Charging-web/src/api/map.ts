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
  popupInfo: PopupInfo;
}
export interface PopupInfo {
  id: string;
  name: string;
  power_rating: number;
  description: string;
  type: string;
  status: string;
  lastUpdated: string;
}
export interface MapResponse {
  code: number;
  message: string;
  data: Record<string, EVMarker[]>;
}
// mock request
// export const getMapMarkers = async (): Promise<MapResponse> => {
//   const { data } = await EV_MOCK.get<MapResponse>(
//     '/map.mock.json',
//   ); //  /map.mock.json
//   return data;
// }
export const getMapMarkers = async (
  cityId: string,
  datetime: string
): Promise<MapResponse> => {
  const { data } = await EV.get<MapResponse>(
    '/map/get_map_by_city_and_time',
    {
      params: {
        city_id: cityId,
        datetime
      }
    }
  ); //  /map.mock.json
  return data;
}

// 获取用户自己绘制的矩形
export const getMapMarkersByRect = async (
  datetime: string,
  location1: string,
  location2: string
): Promise<MapResponse> => {
  const { data } = await EV.get<MapResponse>(
    '/map/cus_map',
    {
      params: {
        datetime,
        location1,
        location2,
      },
    }
  );
  return data;
};
