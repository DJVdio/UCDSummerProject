import { useEffect, useState, useCallback, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { Tooltip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useAppSelector } from '../../hooks';
import { getGenerationGridload, getSessionCounts, getEnergyDelivered, getStationUtilisation } from './../../api/chart';
import ErrorSnackbar from '../../components/ErrorSnackbar/ErrorSnackbar';

import "./DashboardView.css"

interface GenerationConsumptionPoint {
  time: string;
  generation: number;
  grid_load: number;
}

interface ChargingSessionPoint {
  time: string;
  sessions: number;
  energy: number;
}
interface SessionPoint {
  time: string;
  sessions: number;
}

interface EnergyPoint {
  time: string;
  energy: number;
}

dayjs.extend(utc);

const SESSION_COUNTS_TOOLTIP = `Displays the number of EV charging sessions derived from station status logs on the ESB Charge Point Map. `;

const ENERTY_DELIVERED_TOOLTIP = `Represents the total energy (kWh) delivered during charging sessions, calculated from ESB status records`;

const STATION_UTLISATION_TOOLTIP = `Indicates how frequently each charging station is in use based on ESB availability logs.`;

export default function DashboardView() {
  const [genCon, setGenCon] = useState<GenerationConsumptionPoint[]>([]);
  // const { currentLocationId, locations, isCustomRegionEnabled } =
  //   useAppSelector(s => s.map);
  const { currentLocationId, locations, isCustomRegionEnabled } =
    useAppSelector(s => s.map);
  const { timeRange } = useAppSelector(s => s.time);
  const [sessions, setSessions] = useState<SessionPoint[]>([]);
  const [energy, setEnergy] = useState<EnergyPoint[]>([]);
  const [stationIds, setStationIds] = useState<string[]>([]);
  const [stationNameMap, setStationNameMap] = useState<Record<string, string>>({});
  const [utilMatrix, setUtilMatrix] = useState<number[][]>([]);
  // use for api
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // get data of three chart
  useEffect(() => {
    if (!timeRange.timeStart || !timeRange.timeEnd) return;
    setLoading(true);
    setError(null);

    const startIsoTime = new Date(timeRange.timeStart).toISOString().slice(0, 19) + 'Z';
    const endIsoTime   = new Date(timeRange.timeEnd).toISOString().slice(0, 19) + 'Z';
    // get generation/consumption
    async function getGenerationGridloadData() {
      try {
        const res = await getGenerationGridload(startIsoTime, endIsoTime);
        console.log(res.data, 'dash res of gene')
        const arr = res.data.grid_energy.map(d => ({
          // console.log(d)
          time: d.time,
          generation: d.generation_mw,
          grid_load: d.load_mw,
        }));
        setGenCon(arr);
      } catch (err) {
        console.error('Failed to load GenerationConsumption data', err);
        setError('Failed to load GenerationConsumption data, please try again later.');
      } finally {
        setLoading(false);
      }
    }
    getGenerationGridloadData(); 

    // get charging sessions counts
    async function getSessionCountsData() {
      try {
        // const isoTime = new Date(timePoint.replace(' ', 'T'))
          // .toISOString()
          // .slice(0, 10);
          // .slice(0, 19) + 'Z';
        // const isoTime = new Date(timePoint).toISOString().slice(0, 10);  
        const res = await getSessionCounts(currentLocationId, startIsoTime, endIsoTime);
        // console.log(res, 'getSessionCounts')
        const arr = res.data.charging_sessions.data.map((data) => ({
          time: data.time,
          sessions: data.sessioncounts,
        }));
        // console.log(arr)
        setSessions(arr);
      } catch (err) {
        console.error('Failed to load getSessionCounts data', err);
        setError('Failed to load getSessionCounts data, please try again later.');
      } finally {
        setLoading(false);
      }
    }
    getSessionCountsData()

    // get Energy Delivered
    async function getEnergyDeliveredData() {
      try {
        const res = await getEnergyDelivered(currentLocationId, startIsoTime, endIsoTime);
        console.log(res, 'getEnergyDeliveredData')
        const arr = res.data.energy_delivered.data.map((d) => ({
          time: d.time,
          energy: d.energy_kwh,
        }));
        // console.log(arr, 'getEnergyDeliveredData')
        setEnergy(arr);
      } catch (err) {
        console.error('Failed to load EnergyDelivered data', err);
        setError('Failed to load EnergyDelivered data, please try again later.');
      } finally {
        setLoading(false);
      }
    }
    getEnergyDeliveredData()

    // get station utilisation
    async function getUtilisation() {
      try {
        const res = await getStationUtilisation(currentLocationId, startIsoTime, endIsoTime);
        const stations = res.data.station_utilisation.stations;
        console.log(res, 'getUtilisation')
        const ids = stations.map(st => st.station_id);
        const matrix = stations.map((st) => {
          const sum = Array(24).fill(0);
          const cnt = Array(24).fill(0);

          st.data.forEach((pt: { timestamp: string; utilisation: number }) => {
            const h = dayjs.utc(pt.timestamp).hour(); // 保证按 UTC 小时聚合
            sum[h] += pt.utilisation;
            cnt[h] += 1;
          });

          return sum.map((v, i) => (cnt[i] ? v / cnt[i] : 0));
        });

        setStationIds(ids);
        setStationNameMap(Object.fromEntries(stations.map(st => [st.station_id, st.station_name])));
        setUtilMatrix(matrix);
      } catch (err) {
        console.error(err);
        setError('Failed to load site utilisation data');
      } finally {
        setLoading(false);
      }
    }
    getUtilisation()
  }, [currentLocationId, timeRange.timeStart, timeRange.timeEnd]);
  // 统一UTC
  const fmtUTC = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
  const lineOption = useCallback(
    () => ({
      tooltip: { trigger: "axis" },
      legend: { data: ["Generation", "grid load"] },
      // xAxis: { type: "category", data: genCon.map((d) => d.time) },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        axisLabel: {
          formatter: (ts: number) => {
            const date = new Date(ts);
            return date.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
          }
        }
      },
      yAxis: { type: "value", name: "kW" },
      series: [
        {
          name: 'Generation',
          type: 'line',
          smooth: true,
          data: genCon.map(data => [new Date(data.time).getTime(), data.generation]),
        },
        {
          name: 'grid load',
          type: 'line',
          smooth: true,
          data: genCon.map(data => [new Date(data.time).getTime(), data.grid_load]),
        }
      ]
    }),
    [genCon]
  );

  const barCSCOption = useCallback(
    () => ({
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const ts = params[0].value[0]; // x(ms, UTC)
          const count = params[0].value[1]; // y
          return `${fmtUTC.format(new Date(ts))}<br/>Session Counts ${count}`;
        },
      },
      legend: { data: ['Session Counts'] },
      xAxis: {
        type: 'time',
        axisLabel: {
          formatter: (ts: number) => fmtUTC.format(new Date(ts)),
        },
      },
      yAxis: { type: 'value', name: 'Session Counts' },
      series: [{
        name: 'Session Counts',
        type: 'bar',
        itemStyle: { color: '#9eca7f' },
        data: sessions.map(d => [dayjs.utc(d.time).valueOf(), d.sessions]),
      }],
    }),
    [sessions]
  );


  const barEDOption = useCallback(
    () => ({
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const ts = params[0].value[0];
          const val = params[0].value[1];
          return `${fmtUTC.format(new Date(ts))}<br/>Energy (kWh) ${val}`;
        },
      },
      legend: { data: ['Energy (kWh)'] },
      xAxis: {
        type: 'time',
        axisLabel: {
          formatter: (ts: number) => fmtUTC.format(new Date(ts)),
        },
      },
      yAxis: { type: 'value', name: 'kWh' },
      series: [
        {
          name: 'Energy (kWh)',
          type: 'bar',
          itemStyle: { color: '#5a6fc0' },
          data: energy.map(d => [dayjs.utc(d.time).valueOf(), d.energy]),
        },
      ],
    }),
    [energy]
  );

  const displayIds = useMemo(
    () => stationIds.map(id => (id.startsWith('S') ? id : `S${id}`)),
    [stationIds]
  );
  const heatOption = useMemo(() => {
    const data: [number, number, number][] = [];
    utilMatrix.forEach((row, stationIdx) => {
      row.forEach((val, hour) => {
        data.push([hour, stationIdx, val]); // x=hour, y=stationIdx, value=util
      });
    });

    return {
      grid: { top: 50, left: 150, right: 30, bottom: 60 },
      tooltip: {
        position: "top",
        formatter: (p: any) => {
          const hour = String(p.value[0]).padStart(2, "0");
          const rawId = stationIds[p.value[1]];
          const showId = rawId.startsWith('S') ? rawId : `S${rawId}`;
          const name = stationNameMap[rawId];
          return `${showId}${name ? ` (${name})` : ""}<br/>${hour}:00 – ${(p.value[2] * 100).toFixed(0)}%`;
        },
      },
      dataZoom: [
        { type: 'slider', yAxisIndex: 0, right: 5, start: 0, end: 40, filterMode: 'weakFilter', }, // 右侧滑块
        { type: 'inside', yAxisIndex: 0 },                              // 鼠标滚轮缩放
      ],
      xAxis: {
        type: "category",
        data: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`),
        splitArea: { show: true },
        axisTick: { alignWithLabel: true },
      },
      yAxis: {
        type: "category",
        data: displayIds,
        axisLabel: {
          interval: 0, 
          formatter: (name: string) => (name.length > 20 ? name.slice(0, 20) + "…" : name),
        },
        splitArea: { show: true },
      },
      visualMap: {
        min: 0,
        max: 1,
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: 10,
      },
      series: [
        {
          name: "Utilisation",
          type: "heatmap",
          data,
          label: { show: false },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(0, 0, 0, 0.3)",
            },
          },
        },
      ],
    };
  }, [utilMatrix, stationIds, stationNameMap]);

  return (
    <div className="dash-container">
      {/*two‑column area */}
      <div className="dash-two‑column-row">
        <div className="dash-card">
          <div className="dash-card-title">
            Charging Session Counts
            <Tooltip arrow title={SESSION_COUNTS_TOOLTIP}>
              <InfoOutlinedIcon
                fontSize="small"
                sx={{ cursor: "pointer", color: "text.secondary" }}
              />
            </Tooltip>
          </div>
          <ReactECharts option={barCSCOption()} style={{ height: 360 }} />
        </div>
        {/* <div className="dash-card">
          <div className="dash-card-title">Grid Load vs Generation</div>
          <ReactECharts option={lineOption()} style={{ height: 400 }} />
        </div> */}
        <div className="dash-card">
          <div className="dash-card-title">
            Energy Delivered
            <Tooltip arrow title={ENERTY_DELIVERED_TOOLTIP}>
              <InfoOutlinedIcon
                fontSize="small"
                sx={{ cursor: "pointer", color: "text.secondary" }}
              />
            </Tooltip>
            </div>
          <ReactECharts option={barEDOption()} style={{ height: 360 }} />
        </div>
      </div>

      {/* two‑column area */}
      <div className="dash-two‑column-row">
        <div className="dash-card">
          <div className="dash-card-title">
            Station-level Utilisation
            <Tooltip arrow title={STATION_UTLISATION_TOOLTIP}>
              <InfoOutlinedIcon
                fontSize="small"
                sx={{ cursor: "pointer", color: "text.secondary" }}
              />
            </Tooltip>
          </div>
          <ReactECharts option={heatOption} style={{ height: 1200 }} />
        </div>
      </div>
      <ErrorSnackbar
        error={error}
        onClose={() => setError(null)}
      />
    </div>
  );
}