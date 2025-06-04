import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { LatLngExpression } from 'leaflet';

interface LocationOption {
  id: number;
  label: string;
  center: LatLngExpression;
}

interface MapState {
  currentLocationId: number;
  currentTime: string;
  locations: LocationOption[];
}

const initialState: MapState = {
  currentLocationId: 1,
  currentTime: new Date().toISOString().split('T')[0], // form of date: 'YYYY-MM-DD'
  locations: [
    { id: 1, label: 'dublin', center: [53.35, -6.26] },
    { id: 2,   label: 'cork',   center: [51.898, -8.4756] },
    { id: 3, label: 'galway', center: [53.2707, -9.0568] },
  ],
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setLocation(state, action: PayloadAction<number>) {
      state.currentLocationId = action.payload;
    },
    setTime(state, action: PayloadAction<string>) {
      state.currentTime = action.payload;
    },
  },
});

export const { setLocation, setTime } = mapSlice.actions;
export default mapSlice.reducer;
