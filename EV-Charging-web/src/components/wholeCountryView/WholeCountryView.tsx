import { useEffect, useState, useCallback } from "react";
import ReactECharts from "echarts-for-react";
import { Tooltip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useAppSelector } from '../../hooks';
import { getGenerationGridload } from './../../api/chart';
import WholeCountryControl from "./../../components/wholeCountryControl/WholeCountryControl"

import "./WholeCountryView.css"

interface GenerationConsumptionPoint {
  time: string;
  generation: number;
  grid_load: number;
}

dayjs.extend(utc);

const GRID_LOAD_TOOLTIP = `Shows real-time electricity demand and supply across Ireland, sourced from the EirGrid Smart Grid Dashboard. `;

export default function DashboardView() {
  const [genCon, setGenCon] = useState<GenerationConsumptionPoint[]>([]);
  // const { currentLocationId, locations, isCustomRegionEnabled } =
  //   useAppSelector(s => s.map);
  const { currentLocationId, locations, isCustomRegionEnabled } =
    useAppSelector(s => s.map);
  const { timeRange } = useAppSelector(s => s.time);
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

  }, [currentLocationId, timeRange.timeStart, timeRange.timeEnd]);

  const fmtUTC = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
  const lineOption = useCallback(
    () => ({
      tooltip: { trigger: 'axis' },
      legend: { data: ['Generation', 'Grid Load'] },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        axisLabel: {
          formatter: (ts: number) => fmtUTC.format(new Date(ts)),
        },
      },
      yAxis: { type: 'value', name: 'MW' }, // 这里改成 MW，更贴近你的字段
      series: [
        {
          name: 'Generation',
          type: 'line',
          smooth: true,
          data: genCon.map(d => [dayjs.utc(d.time).valueOf(), d.generation]),
        },
        {
          name: 'Grid Load',
          type: 'line',
          smooth: true,
          data: genCon.map(d => [dayjs.utc(d.time).valueOf(), d.grid_load]),
        },
      ],
    }),
    [genCon]
  );

  return (
    <div className="whole-container">
      <div className="whole-card">
        <div className="dash-card-title with-controller">
          <div className="title-left">
            Grid Load vs Generation
            <Tooltip arrow title={GRID_LOAD_TOOLTIP}>
              <InfoOutlinedIcon
                fontSize="small"
                sx={{ cursor: "pointer", color: "text.secondary" }}
              />
            </Tooltip>
          </div>

          {/* 关键：把时间控件移进来，只影响这个图表 */}
          <div className="title-right">
            <WholeCountryControl />
          </div>
        </div>

        {error ? (
          <div className="error-text">{error}</div>
        ) : (
          <ReactECharts
            option={lineOption()}
            style={{ height: 400 }}
            showLoading={loading}
          />
        )}
      </div>
    </div>
  );
}