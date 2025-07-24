
import { useEffect, useState, useCallback } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts/core";
import { MapChart } from "echarts/charts";
import {
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

import irelandCounties from "./../../assets/ireland.json"; // ← 你的 GeoJSON

echarts.use([MapChart, TooltipComponent, VisualMapComponent, CanvasRenderer]);
echarts.registerMap("ireland-counties", irelandCounties as any);

interface CountyDatum {
  name: string;   // “Dublin” 等，必须与 GeoJSON properties.name 匹配
  value: number;  // 业务量
}

export default function IrelandCityMapView() {
  const [data, setData] = useState<CountyDatum[]>([]);

  /* 拉取业务数据，可替换为真实接口 */
  useEffect(() => {
    setData([
      { name: "Dublin", value: 13150 },
      { name: "Cork", value: 8200 },
      { name: "Galway", value: 5400 },
      { name: "Limerick", value: 4100 },
      { name: "Waterford", value: 2800 },
      // …其余 27 个郡
    ]);
  }, []);

  /* ECharts 配置保持可读性，用 useCallback 避免重复计算 */
  const option = useCallback(() => {
    const max = Math.max(...data.map((d) => d.value), 1);

    return {
      tooltip: {
        trigger: "item",
        formatter: ({ name, value }: any) =>
          `${name}<br/>业务量: ${value ?? "—"}`,
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
          name: "Ireland Counties",
          roam: false,
          label: {
            show: true,
            fontSize: 10,
            color: "#111",
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

  return (
    <div className="dash-card">
      <div className="dash-card-title">Ireland – County Business Volume</div>
      <ReactECharts option={option()} style={{ height: 550 }} />
    </div>
  );
}
