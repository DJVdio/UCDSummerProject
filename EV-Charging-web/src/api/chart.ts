import { createService } from '../utils/request';

const BASE_URL = "http://35.205.60.141:8000"; // backend import.meta.env.BASE_URL;
const BASE_URL_MOCK = "http://localhost:5173"; // frontend

// 创建 Axios 实例
const EV = createService(BASE_URL);

const EV_MOCK = createService(BASE_URL_MOCK);

// http://35.205.60.141:8000/graph/charging_sessions_counts?city_id=dublin&datetime=2025-06-20T19:30Z

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
    data: { time: string; sessioncounts: number }[];
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
export const getSessionCounts = async (
  cityId: string,
  datetime: string
): Promise<
  ChartResponse<SessionCountsPayload>
> => {
  const resp = await EV.get<ChartResponse<SessionCountsPayload>>(
    "/graph/charging_sessions_counts",
    {
      params: {
        city_id: cityId,
        datetime
      }
    }
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