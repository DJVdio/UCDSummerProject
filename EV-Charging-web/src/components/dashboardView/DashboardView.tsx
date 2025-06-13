import { useEffect, useState, useCallback } from "react";
import ReactECharts from "echarts-for-react";
// import {  } from "@mui/material";
import { getGenerationConsumption, getChargingSessions, getStationUtilisation } from './../../api/map';
import "./DashboardView.css"

interface GenerationConsumptionPoint {
  time: string;
  generation: number;
  consumption: number;
}

interface ChargingSessionPoint {
  time: string;
  sessions: number;
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
  const [charging, setCharging] = useState<ChargingSessionPoint[]>([]);
  const [utilisation, setUtilisation] = useState<number[][]>([]);
  // use for api
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // get data of three chart
  useEffect(() => {
    // get generation/consumption
    async function getGenerationData() {
      try {
        const res = await getGenerationConsumption();
        console.log(res.data, 'dash res of gene')
        const arr = res.data.generation_consumption.data.map(d => ({
          // console.log(d)
          time: d.time,
          generation: d.generation_kw,
          consumption: d.consumption_kw,
        }));
        setGenCon(arr);
      } catch (err) {
        console.error('Failed to load GenerationConsumption data', err);
        setError('Failed to load GenerationConsumption data, please try again later.');
      } finally {
        setLoading(false);
      }
    }
    getGenerationData();    
    // get charging sessions
    async function getGenAndConData() {
      try {
        const res = await getChargingSessions();
        console.log(res.data, 'dash res of gene')
        const arr = res.data.charging_sessions.data.map(d => ({
          time: d.time,
          sessions: d.session_count,
          energy: d.energy_kwh,
        }));
        setCharging(arr);
      } catch (err) {
        console.error('Failed to load GenerationConsumption data', err);
        setError('Failed to load GenerationConsumption data, please try again later.');
      } finally {
        setLoading(false);
      }
    }
    getGenAndConData(); 

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
        setError('加载站点利用率数据失败');
      } finally {
        setLoading(false);
      }
    }
    getUtilisation()
  }, []);
  const lineOption = useCallback(
    () => ({
      tooltip: { trigger: "axis" },
      legend: { data: ["Generation", "Consumption"] },
      // xAxis: { type: "category", data: genCon.map((d) => d.time) },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        axisLabel: {
          formatter: (ts: number) => {
            const d = new Date(ts);
            return d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
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
          data: genCon.map(d => [new Date(d.time).getTime(), d.generation]),
        },
        {
          name: 'Consumption',
          type: 'line',
          smooth: true,
          data: genCon.map(d => [new Date(d.time).getTime(), d.consumption]),
        }
      ]
    }),
    [genCon]
  );

  const barOption = useCallback(
    () => ({
      tooltip: { trigger: "axis" },
      legend: { data: ["Sessions", "Energy"] },
      xAxis: {
        type: 'time',
        axisLabel: {
          formatter: (ts: number) => {
            const d = new Date(ts);
            return d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
          }
        }
      },
      yAxis: [
        { type: "value", name: "Sessions" },
        { type: "value", name: "Energy (kWh)" },
      ],
      series: [
        {
          name:'Sessions',
          type:'bar',
          yAxisIndex:0,
          data: charging.map(d => [new Date(d.time).getTime(), d.sessions])
        },
        {
          name:'Energy',
          type:'bar',
          yAxisIndex:1,
          data: charging.map(d => [new Date(d.time).getTime(), d.energy])
        }
      ]
    }),
    [charging]
  );

  const heatOption = useCallback(() => {
    const data: [number, number, number][] = [];
    utilisation.forEach((row, s) => row.forEach((val, h) => data.push([h, s, val])));
    return {
      tooltip: {
        position: "top",
        formatter: (p: any) => `Station ${p.value[1]}\n${p.value[0]}:00 – ${(p.value[2] * 100).toFixed(0)}%`,
      },
      xAxis: { type: "category", data: Array.from({ length: 24 }, (_, i) => `${i}:00`), splitArea: { show: true } },
      yAxis: { type: "category", data: utilisation.map((_, i) => `S${i}`), splitArea: { show: true } },
      visualMap: { min: 0, max: 1, calculable: true, orient: "horizontal", left: "center", bottom: 15 },
      series: [{ name: "Utilisation", type: "heatmap", data, label: { show: false } }],
    };
  }, [utilisation]);
  return (
    <div className="dash-container">
      {/* Top full‑width chart */}
      <div className="dash-card">
        <h3 className="dash-card-title">Grid Load vs Generation</h3>
        <ReactECharts option={lineOption()} style={{ height: 400 }} />
      </div>

      {/* Bottom two‑column area */}
      <div className="dash-bottom-row">
        <div className="dash-card">
          <h3 className="dash-card-title">Charging Sessions &amp; Energy Delivered</h3>
          <ReactECharts option={barOption()} style={{ height: 360 }} />
        </div>
        <div className="dash-card">
          <h3 className="dash-card-title">Station-level Utilisation</h3>
          <ReactECharts option={heatOption()} style={{ height: 360 }} />
        </div>
      </div>
    </div>
  );
}