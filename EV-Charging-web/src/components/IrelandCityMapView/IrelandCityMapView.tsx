import { useEffect, useState, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts/core";
import { MapChart } from "echarts/charts";
import {
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

import irelandCounties from "./../../assets/ireland.json";
import {
  getWholeCountryMap,
  WholeCountryMapRow,
} from './../../api/chart';
import type { EChartsOption } from "echarts";

echarts.use([MapChart, TooltipComponent, VisualMapComponent, CanvasRenderer]);
echarts.registerMap("ireland-counties", irelandCounties as any);

interface CountyDatum {
  name: string;   // 必须与 GeoJSON properties.name 匹配
  value: number;  // charging_station_count
}

export default function IrelandCityMapView() {
  const [data, setData] = useState<CountyDatum[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await getWholeCountryMap();
        // resp.data: WholeCountryMapRow[]
        const mapped: CountyDatum[] = resp.data.map((d: WholeCountryMapRow) => ({
          name: d.label,                         // ⚠️ 要与 GeoJSON 保持一致
          value: d.charging_station_count,
        }));
        setData(mapped);
      } catch (e: any) {
        setError(e?.message ?? "failed to fetch");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const option: EChartsOption = useMemo(() => {
    const max = Math.max(...data.map((d) => d.value), 1);

    return {
      tooltip: {
        trigger: "item",
        formatter: (p: any) => {
          const { name, value } = p;
          return `${name}<br/>Charging stations: ${value ?? "—"}`;
        },
      },
      visualMap: {
        type: "continuous",
        min: 0,
        max,
        left: "left",
        orient: "vertical",
        text: ["多", "少"],
        calculable: true,
        inRange: { color: ["#b3e5fc", "#0288d1"] },
      },
      series: [
        {
          type: "map",
          map: "ireland-counties",
          name: "Charging Stations",
          roam: false,
          label: {
            show: true,
            fontSize: 10,
            color: "#111",
            formatter: (p: any) => `${p.name}\n${p.value ?? "—"}`,
          },
          emphasis: {
          label: { show: true, fontWeight: "bold" },
            itemStyle: { areaColor: "#ffd54f" },
          },
          data,
        },
      ],
    };
  }, [data]);

  if (loading) {
    return <div className="dash-card">Loading…</div>;
  }
  if (error) {
    return <div className="dash-card text-red-500">Error: {error}</div>;
  }

  return (
    <div className="dash-card">
      <div className="dash-card-title">
        Ireland – County Charging Station Count
      </div>
      <ReactECharts option={option} style={{ height: 550 }} />
    </div>
  );
}
