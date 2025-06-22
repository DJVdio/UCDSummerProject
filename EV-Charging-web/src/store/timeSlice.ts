import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const DAY_MS = 24 * 60 * 60 * 1_000;
interface TimeRange {
  timeStart: string; // ISO: "2025-06-01T08:00"
  timeEnd:   string; // ISO
}

interface TimeState {
  timeRange: TimeRange; // time range for chart
  timePoint: string;    // time point for map
  // timeAnchor: 'timeStart' | 'timeEnd';
}

const nowTime = new Date();
const initialPoint = nowTime.toISOString();
const initialState: TimeState = {
  timePoint: initialPoint,
  timeRange: { timeStart: new Date(nowTime.getTime() - DAY_MS).toISOString(), timeEnd: initialPoint },
};
// const initialState: TimeState = {
//   timeRange: { timeStart: '', timeEnd: '' },
//   timePoint: '',
//   // timeAnchor: 'timeStart',
// };

const timeSlice = createSlice({
  name: 'time',
  initialState,
  reducers: {
    setTimePoint(state, action: PayloadAction<string>) {
      state.timePoint = action.payload;
      const time = new Date(action.payload).getTime();
      state.timeRange = {
        timeStart: new Date(time - DAY_MS).toISOString(),
        timeEnd: action.payload,
      };
    },
  },
});
export const { setTimePoint } = timeSlice.actions;
export default timeSlice.reducer;