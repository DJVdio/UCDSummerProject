import { useEffect, useState, useCallback } from "react";
import ReactECharts from "echarts-for-react";
import { Tooltip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useAppSelector } from '../../hooks';
import { getGenerationGridload, getSessionCounts, getEnergyDelivered, getStationUtilisation } from './../../api/chart';
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

const SESSION_COUNTS_TOOLTIP = `Charging Session counts chart shows how many EV
charging sessions started in each time slot during the day, derived from
changes in station status logs. Helps city planners and operators understand
the peak charging periods of EV users throughout the day. Provides a basis for
time-of-use pricing, grid load forecasting, and optimisation of charging
infrastructure deployment.`;

export default function DashboardView() {
  const [genCon, setGenCon] = useState<GenerationConsumptionPoint[]>([]);
  // const { currentLocationId, locations, isCustomRegionEnabled } =
  //   useAppSelector(s => s.map);
  const { currentLocationId, locations, isCustomRegionEnabled } =
    useAppSelector(s => s.map);
  const { timeRange } = useAppSelector(s => s.time);
  const [sessions, setSessions] = useState<SessionPoint[]>([]);
  const [energy, setEnergy] = useState<EnergyPoint[]>([]);
  const [utilisation, setUtilisation] = useState<number[][]>([]);
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
        console.log(arr, 'getEnergyDeliveredData')
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
        const res = await getStationUtilisation();
        const stations = res.data.station_utilisation.stations;
        // 每个站点一行，24 小时对应 0～23 index
        const matrix = stations.map(st =>
          st.data
            // 按 timestamp 排序（如果后端乱序）
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .map(pt => pt.utilisation)
        );
        setUtilisation(matrix);
      } catch (err) {
        console.error(err);
        setError('Failed to load site utilisation data');
      } finally {
        setLoading(false);
      }
    }
    getUtilisation()
  }, [currentLocationId, timeRange.timeStart, timeRange.timeEnd]);

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
          const ts = params[0].value[0]; // x
          const count = params[0].value[1]; // y
          const time = new Date(ts).toLocaleTimeString(
            'en-GB',
            { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }
          );
          return `${time}<br/>Session Counts ${count}`;
        },
      },
      legend: { data: ['Session Counts'] },
      xAxis: {
        type: 'time',
        axisLabel: {
          formatter: (ts: number) =>
            new Date(ts).toLocaleTimeString(
              'en-GB',
              { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }
            ),
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
      tooltip: { trigger: "axis" },
      legend: { data: ["Energy (kWh)"] },
      xAxis: {
        type: "time",
        axisLabel: {
          formatter: (ts: number) =>
            new Date(ts).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            }),
        },
      },
      yAxis: { type: "value", name: "kWh" },
      series: [
        {
          name: "Energy (kWh)",
          type: "bar",
          itemStyle: { color: "#5a6fc0" },
          data: energy.map((data) => [Date.parse(data.time), data.energy]),
        },
      ],
    }),
    [energy]
  );

  const heatOption = useCallback(() => {
    const data: [number, number, number][] = [];
    utilisation.forEach((row, station) => row.forEach((val, hour) => data.push([hour, station, val])));
    return {
      tooltip: {
        position: "top",
        formatter: (params: any) => `Station ${params.value[1]}\n${params.value[0]}:00 – ${(params.value[2] * 100).toFixed(0)}%`,
      },
      xAxis: { type: "category", data: Array.from({ length: 24 }, (_, i) => `${i}:00`), splitArea: { show: true } },
      yAxis: { type: "category", data: utilisation.map((_, i) => `S${i}`), splitArea: { show: true } },
      visualMap: { min: 0, max: 1, calculable: true, orient: "horizontal", left: "center", bottom: 15 },
      series: [{ name: "Utilisation", type: "heatmap", data, label: { show: false } }],
    };
  }, [utilisation]);

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
          <div className="dash-card-title">Energy Delivered</div>
          <ReactECharts option={barEDOption()} style={{ height: 360 }} />
        </div>
      </div>

      {/* two‑column area */}
      <div className="dash-two‑column-row">
        {/* <div className="dash-card">
          <div className="dash-card-title">Station-level Utilisation</div>
          <ReactECharts option={heatOption()} style={{ height: 360 }} />
        </div> */}
      </div>
    </div>
  );
}