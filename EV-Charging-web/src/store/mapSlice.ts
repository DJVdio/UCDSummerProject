import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { LatLngExpression } from 'leaflet';

interface LocationOption {
  id: string;
  label: string;
  center: LatLngExpression;
}

interface MapState {
  currentLocationId: string;
  // currentTime: string;
  locations: LocationOption[];
  isCustomRegionEnabled: boolean;
}

const initialState: MapState = {
  currentLocationId: 'dublin',
  // currentTime: new Date().toISOString().split('T')[0], // form of date: 'YYYY-MM-DD'
  locations: [
    { id: 'dublin', label: 'dublin', center: [53.35, -6.26] },
    { id: 'cork',   label: 'cork',   center: [51.898, -8.4756] },
    { id: 'galway', label: 'galway', center: [53.2707, -9.0568] },
  ],
  isCustomRegionEnabled: false,
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setLocation(state, action: PayloadAction<string>) {
      state.currentLocationId = action.payload;
    },

    setCustomRegionEnabled(state, action: PayloadAction<boolean>) {
      state.isCustomRegionEnabled = action.payload;
    },
  },
});

export const { setLocation, setCustomRegionEnabled } = mapSlice.actions;
export default mapSlice.reducer;
