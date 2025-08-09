import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const DAY_MS = 24 * 60 * 60 * 1_000;
const MONTH_MS = 30 * DAY_MS;
 
interface TimeRange {
  timeStart: string; // ISO: "2025-06-01T08:00"
  timeEnd:   string; // ISO
}

interface TimeState {
  timeRange: TimeRange; // time range for chart
  timePoint: string;    // time point for map
}

const nowTime = new Date();
const initialPoint = nowTime.toISOString();
const initialState: TimeState = {
  timePoint: initialPoint,
  timeRange: { timeStart: new Date(nowTime.getTime() - DAY_MS).toISOString(), timeEnd: initialPoint },
};
const toIso = (v: string) => {
  const s = v.includes('T') ? v : v.replace(' ', 'T');
  return new Date(s).toISOString();
};
const clampRange = (startMs: number, endMs: number) => {
  let diff = endMs - startMs;

  if (diff < DAY_MS) { // 少于 1 天 → 拉长到 1 天
    endMs = startMs + DAY_MS;
  } else if (diff > MONTH_MS) { // 超过 30 天 → 收缩到 30 天
    endMs = startMs + MONTH_MS;
  }
  return { startMs, endMs };
}

const timeSlice = createSlice({
  name: 'time',
  initialState,
  reducers: {
    /* —— 一次性设置完整区间 —— */
    setTimeRange(state, { payload }: PayloadAction<TimeRange>) {
      const startMs = new Date(payload.timeStart).getTime();
      const endMs = new Date(payload.timeEnd).getTime();
      const { startMs: s, endMs: e } = clampRange(startMs, endMs);

      state.timeRange = {
        timeStart: new Date(s).toISOString(),
        timeEnd: new Date(e).toISOString(),
      };
      state.timePoint = state.timeRange.timeEnd; // 地图锚点始终指向 end
    },
    /* —— 只改 start —— */
    setTimeStart(state, { payload }: PayloadAction<string>) {
      const startMs = new Date(payload).getTime();
      const endMs = new Date(state.timeRange.timeEnd).getTime();
      const { startMs: s, endMs: e } = clampRange(startMs, endMs);

      state.timeRange.timeStart = new Date(s).toISOString();
      state.timeRange.timeEnd = new Date(e).toISOString();
      state.timePoint = state.timeRange.timeEnd;
    },
    /* —— 只改 end —— */
    setTimeEnd(state, { payload }: PayloadAction<string>) {
      const endIso = toIso(payload);           // 原始用户选择
      const endMs = new Date(endIso).getTime();
      const startMs = new Date(state.timeRange.timeStart).getTime();
      const { startMs: s, endMs: e } = clampRange(startMs, endMs);

      state.timeRange.timeStart = new Date(s).toISOString();
      state.timeRange.timeEnd   = new Date(e).toISOString();

      // 关键：timePoint 用原始 end（不跟随夹紧后的 e）
      state.timePoint = endIso;
    },
  },
});
export const { setTimeRange, setTimeStart, setTimeEnd } = timeSlice.actions;
export default timeSlice.reducer;