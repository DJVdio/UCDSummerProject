import { useEffect, useState, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts/core";
import { MapChart } from "echarts/charts";
import {
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components";
import ErrorSnackbar from '../../components/ErrorSnackbar/ErrorSnackbar';

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
  name: string;
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
        const mapped: CountyDatum[] = resp.data.map((d: WholeCountryMapRow) => {
          const n = Number(d.charging_station_count);
          return {
            name: d.label,
            value: Number.isFinite(n) ? n : 0,
          };
        });
        setData(mapped);
      } catch (e: any) {
        const msg = !navigator.onLine
          ? 'The network seems to be disconnected, please check the network connection.'
          : (e?.message ?? 'Failed to load Data, please try again later.');
        setError(msg);        
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const option: EChartsOption = useMemo(() => {
    const values = data.map(d => (Number.isFinite(d.value) ? d.value : 0));
    const max = values.length ? Math.max(1, ...values) : 1;

    return {
      tooltip: {
        trigger: "item",
        formatter: (p: any) => {
          const { name, value } = p;
          const v = Number.isFinite(value) ? value : 0;
          return `${name}<br/>Charging stations: ${v}`;
        },
      },
      visualMap: {
        type: "continuous",
        min: 0,
        max,
        left: "left",
        orient: "vertical",
        text: ["More", "Less"],
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
            formatter: (p: any) => `${p.name}\n${Number.isFinite(p.value) ? p.value : 0}`,
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
      <ErrorSnackbar
        error={error}
        onClose={() => setError(null)}
      />
    </div>
  );
}
