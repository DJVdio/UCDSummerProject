// IrelandCityMapView.tsx
import { useEffect, useState, useCallback } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts/core";
import { MapChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  VisualMapComponent
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import axios from "axios";

// import "./IrelandCityMapView.css";   // 与之前保持同风格，自己按需扩展

echarts.use([
  MapChart,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer
]);

/** 城市充电量数据 */
export interface CityCharge {
  name: string;          // 与 geoJSON 中的 `properties.name` 保持一致
  value: number;         // 充电量 / 会话数 / 能量，随你定义
}

/** 主组件 */
export default function IrelandCityMapView() {
  const [irelandMapJson, setIrelandMapJson] = useState<any | null>(null);
  const [cityCharges, setCityCharges] = useState<CityCharge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /** 1. 拉取 Ireland geoJSON（仅第一次加载） */
  useEffect(() => {
    async function fetchGeoJson() {
      try {
        // 你可以把 geoJSON 放在 public/geo/ 下，也可改成远端 URL
        const { data } = await axios.get("/geo/ireland.json");
        echarts.registerMap("ireland", data);      // 向 echarts 注册地图
        setIrelandMapJson(data);
      } catch (e) {
        console.error("Failed to load Ireland map", e);
        setError("无法加载地图数据，请稍后重试。");
      }
    }
    fetchGeoJson();
  }, []);

  /** 2. 拉取各城市充电数据（示例用假数据，你可替换为后端接口） */
  useEffect(() => {
    async function fetchChargeData() {
      setLoading(true);
      try {
        /* 
          // 真实接口示例
          const res = await getIrelandCityCharges(startIsoTime, endIsoTime);
          setCityCharges(res.data);
        */

        // ——以下是假数据占位——
        const mock: CityCharge[] = [
          { name: "Dublin",    value: 14500 },
          { name: "Cork",      value: 6200 },
          { name: "Limerick",  value: 5100 },
          { name: "Galway",    value: 4800 },
          { name: "Waterford", value: 2300 },
          { name: "Kilkenny",  value: 1900 },
          { name: "Sligo",     value: 1300 }
        ];
        setCityCharges(mock);
      } catch (e) {
        console.error("Failed to load charge data", e);
        setError("无法加载充电数据，请稍后重试。");
      } finally {
        setLoading(false);
      }
    }
    fetchChargeData();
  }, []);

  /** 3. 生成 echarts option —— 保持与原代码一致的 useCallback 结构 */
  const mapOption = useCallback(() => {
    if (!irelandMapJson) return {};

    return {
      tooltip: {
        trigger: "item",
        formatter: (p: any) =>
          `${p.name}<br/>充电量: ${p.value?.toLocaleString() ?? "N/A"}`
      },
      title: {
        text: "Ireland – City EV Charging",
        left: "center",
        top: 10
      },
      visualMap: {
        min: 0,
        max: Math.max(...cityCharges.map(c => c.value)) || 1,
        left: "left",
        bottom: "5%",
        text: ["高", "低"],
        realtime: false,
        calculable: true,
        inRange: {
          /** 颜色可以自定义；下面用三段式渐变 */
          color: ["#99d18f", "#4db3ff", "#f8c23d"]
        }
      },
      series: [
        {
          type: "map",
          map: "ireland",
          roam: true,
          zoom: 1.2,
          label: {
            show: true,
            fontSize: 10
          },
          emphasis: {
            label: { color: "#000", fontWeight: "bold" },
            itemStyle: { areaColor: "#ffd54f" }
          },
          data: cityCharges
        }
      ]
    };
  }, [irelandMapJson, cityCharges]);

  /** 4. 渲染 */
  if (error) return <div className="dash-error">{error}</div>;
  if (loading) return <div className="dash-loading">Loading…</div>;

  return (
    <div className="dash-container">
      <div className="dash-card">
        <div className="dash-card-title">
          Ireland City Charging
        </div>
        <ReactECharts option={mapOption()} style={{ height: 600 }} />
      </div>
    </div>
  );
}
