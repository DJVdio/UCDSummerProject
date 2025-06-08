import { createSlice, PayloadAction } from '@reduxjs/toolkit';
interface TimeRange {
  timeStart: string; // ISO: "2025-06-01T08:00"
  timeEnd:   string; // ISO
}

interface TimeState {
  timeRange: TimeRange; // time range for chart
  timePoint: string;    // time point for map
  timeAnchor: 'timeStart' | 'timeEnd';
}

const initialState: TimeState = {
  timeRange: { timeStart: '', timeEnd: '' },
  timePoint: '',
  timeAnchor: 'timeStart',
};

const timeSlice = createSlice({
  name: 'time',
  initialState,
  reducers: {
    setTimePoint(state, action: PayloadAction<string>) {
      state.timePoint = action.payload;
      if (state.timeAnchor === 'timeStart') {
        state.timeRange.timeStart = action.payload;
      } else {
        state.timeRange.timeEnd = action.payload;
      }
    },
    setTimeRange(state, action: PayloadAction<TimeRange>) {
      state.timeRange = action.payload;
      state.timePoint =
        state.timeAnchor === 'timeStart'
          ? action.payload.timeStart
          : action.payload.timeEnd;
    },
    setAnchor(state, action: PayloadAction<'timeStart' | 'timeEnd'>) {
      state.timeAnchor = action.payload;
      // change timePoint
      state.timePoint =
        action.payload === 'timeStart'
          ? state.timeRange.timeStart
          : state.timeRange.timeEnd;
    },
  },
});
export const { setTimeRange, setAnchor, setTimePoint } = timeSlice.actions;
export default timeSlice.reducer;