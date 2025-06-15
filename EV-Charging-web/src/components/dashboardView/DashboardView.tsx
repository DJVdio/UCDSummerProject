import { useEffect, useState, useCallback } from "react";
import ReactECharts from "echarts-for-react";
// import {  } from "@mui/material";
import { getGenerationGridload, getSessionCounts, getEnergyDelivered, getStationUtilisation } from './../../api/map';
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
// const generateGenerationConsumptionData = (): GenerationConsumptionPoint[] => {
//   const out: GenerationConsumptionPoint[] = [];
//   for (let h = 0; h < 24; h++) {
//     const baseGen = 400 + Math.sin((h / 24) * Math.PI * 2) * 150;
//     const baseCon = 380 + Math.sin(((h + 4) / 24) * Math.PI * 2) * 130;
//     out.push({
//       time: `${h.toString().padStart(2, "0")}:00`,
//       generation: Math.round(baseGen + Math.random() * 20),
//       consumption: Math.round(baseCon + Math.random() * 20),
//     });
//   }
//   return out;
// }

// const generateChargingSessionData = (): ChargingSessionPoint[] => {
//   const out: ChargingSessionPoint[] = [];
//   for (let h = 0; h < 24; h++) {
//     const sessions = Math.round(
//       5 + Math.max(0, Math.cos(((h - 18) / 24) * Math.PI * 2)) * 20 + Math.random() * 3
//     );
//     const energy = sessions * (10 + Math.random() * 5);
//     out.push({ time: h, sessions, energy: Math.round(energy) });
//   }
//   return out;
// }

// const generateUtilisationMatrix = (): number[][] => {
//   const stations = 10;
//   const matrix: number[][] = [];
//   for (let s = 0; s < stations; s++) {
//     const row: number[] = [];
//     const phaseShift = (s / stations) * Math.PI * 2;
//     for (let h = 0; h < 24; h++) {
//       const utilisation = Math.max(0, Math.sin(((h - 6) / 24) * Math.PI * 2 + phaseShift));
//       row.push(parseFloat(((utilisation * 0.9 + Math.random() * 0.1)).toFixed(2)));
//     }
//     matrix.push(row);
//   }
//   return matrix;
// }

export default function DashboardView() {
  // const [genCon] = useState(generateGenerationConsumptionData);
  // const [charging] = useState(generateChargingSessionData);
  // const [utilisation] = useState(generateUtilisationMatrix);
  const [genCon, setGenCon] = useState<GenerationConsumptionPoint[]>([]);
  const [sessions, setSessions] = useState<SessionPoint[]>([]);
  const [energy, setEnergy] = useState<EnergyPoint[]>([]);
  const [utilisation, setUtilisation] = useState<number[][]>([]);
  // use for api
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // get data of three chart
  useEffect(() => {
    // get generation/consumption
    async function getGenerationGridloadData() {
      try {
        const res = await getGenerationGridload();
        console.log(res.data, 'dash res of gene')
        const arr = res.data.generation_gridload.data.map(d => ({
          // console.log(d)
          time: d.time,
          generation: d.generation_kw,
          grid_load: d.gridload_kw,
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
        const res = await getSessionCounts();
        // console.log(res, 'getSessionCounts')
        const arr = res.data.charging_sessions.data.map((d) => ({
          time: d.time,
          sessions: d.session_count,
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
        const res = await getEnergyDelivered();
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
  }, []);
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
          // key：把 ISO 字符串转成毫秒数
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
      tooltip: { trigger: "axis" },
      legend: { data: ["Session Counts"] },
      xAxis: {
        type: 'time',
        axisLabel: {
          formatter: (ts: number) => {
            const cscDate = new Date(ts);
            return cscDate.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
          }
        }
      },
      yAxis: [
        { type: "value", name: "Session Counts" },
        // { type: "value", name: "Energy (kWh)" },
      ],
      series: [
        {
          name:'Session Counts',
          type:'bar',
          yAxisIndex:0,
          itemStyle: { color: "#9eca7f" },
          data: sessions.map(data => [new Date(data.time).getTime(), data.sessions])
        },
      ]
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
          <div className="dash-card-title">Grid Load vs Generation</div>
          <ReactECharts option={lineOption()} style={{ height: 400 }} />
        </div>
        <div className="dash-card">
          <div className="dash-card-title">Charging Session counts</div>
          <ReactECharts option={barCSCOption()} style={{ height: 360 }} />
        </div>
      </div>

      {/* two‑column area */}
      <div className="dash-two‑column-row">
        <div className="dash-card">
          <div className="dash-card-title">Energy Delivered</div>
          <ReactECharts option={barEDOption()} style={{ height: 360 }} />
        </div>
        <div className="dash-card">
          <div className="dash-card-title">Station-level Utilisation</div>
          <ReactECharts option={heatOption()} style={{ height: 360 }} />
        </div>
      </div>
    </div>
  );
}