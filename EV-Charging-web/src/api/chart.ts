import { createService } from '../utils/request';

const BASE_URL = "http://35.205.60.141:8000"; // backend import.meta.env.BASE_URL;
const BASE_URL_MOCK = "http://localhost:5173"; // frontend

// 创建 Axios 实例
const EV = createService(BASE_URL);

const EV_MOCK = createService(BASE_URL_MOCK);

// http://35.205.60.141:8000/graph/charging_sessions_counts?city_id=dublin&datetime=2025-06-20T19:30Z
// localhost:8000/graph/city_energy?city_id=dublin&start_time=2025-06-24T00:15Z&end_time=2025-06-24T12:15Z
// localhost:8000/graph/charging_sessions_counts?city_id=dublin&start_time=2025-06-24T00:15Z&end_time=2025-06-24T12:15Z

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
  grid_energy: {
    time: string;
    generation_mw: number;
    load_mw: number;
  }[];
}
// export interface GenerationConsumption {
//   // interval: string;
//   unit: string;
//   data: { time: string; generation_mw: number; load_mw: number }[];
// }

export const getGenerationGridload = async (
  start_time: string,
  end_time: string,
): Promise<
  ChartResponse<GenConPayload>
> => {
  const resp = await EV.get<ChartResponse<GenConPayload>>(
    "/graph/grid_energy",
    {
      params: {
        start_time,
        end_time
      }
    }
  );
  return resp.data;
};
//   Promise<ChartResponse<GenConPayload>> => {
//   const resp = await EV_MOCK.get<ChartResponse<GenConPayload>>('/lineChart.mock.json'); // /graph/grid_energy
//   return resp.data;    // 这是 { code, message, data: GenerationConsumption }
// };

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
  start_time: string,
  end_time: string,
): Promise<
  ChartResponse<SessionCountsPayload>
> => {
  const resp = await EV.get<ChartResponse<SessionCountsPayload>>(
    "/graph/charging_sessions_counts",
    {
      params: {
        city_id: cityId,
        start_time,
        end_time
      }
    }
  );
  return resp.data;
};

export const getEnergyDelivered = async (
  cityId: string,
  start_time: string,
  end_time: string,
): Promise<
  ChartResponse<EnergyDeliveredPayload>
> => {
  const resp = await EV.get<ChartResponse<EnergyDeliveredPayload>>(
    "/graph/city_energy",
    {
      params: {
        city_id: cityId,
        start_time,
        end_time
      }
    }
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
  station_name: string;
  data: Array<{
    timestamp: string;      // ISO string
    utilisation: number;    // 0～1
  }>;
}

export const getStationUtilisation = async (
  cityId: string,
  start_time: string,
  end_time: string,
):
  Promise<ChartResponse<StationUtilisation>> => {
  const resp = await EV.get<ChartResponse<StationUtilisation>>(
    "/graph/station_utilisation",
    {
      params: {
        city_id: cityId,
        start_time,
        end_time
      }
    }
  );
  return resp.data;
};

export interface WholeCountryMapRow {
  city_id: string;
  label: string;
  lon: number;
  lat: number;
  charging_station_count: number;
}

export const getWholeCountryMap = async (): Promise<
  ChartResponse<WholeCountryMapRow[]>
> => {
  const resp = await EV.get<ChartResponse<WholeCountryMapRow[]>>(
    "/map/get_whole_country_map"
  );
  return resp.data;
};