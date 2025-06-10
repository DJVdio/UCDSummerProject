import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { LatLngExpression } from 'leaflet';
import { getAllCities, CityApiItem } from './../api/map';

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
  loading: boolean;
  error?: string;
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
  loading: false,
};

export const fetchCities = createAsyncThunk<
  LocationOption[],
  void,
  { rejectValue: string }
>('map/fetchCities', async (_, { rejectWithValue }) => {
  try {
    const res = await getAllCities();
    console.log(res, 'res')
    if (res.code !== 200) {
      return rejectWithValue(res.message || 'Server error');
    }
    // console.log(res.data, 'res.data')
    // 转成前端需要的字段
    return res.data.map(
      (item: CityApiItem): LocationOption => ({
        id:     item.city_id,
        label:  item.label,
        center: item.center,
      })
    );
  } catch (err) {
    return rejectWithValue((err as Error).message);
  }
})

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
  extraReducers: (builder) => {
    builder
      .addCase(fetchCities.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchCities.fulfilled, (state, action: PayloadAction<LocationOption[]>) => {
        state.loading = false;
        state.locations = action.payload;
      })
      .addCase(fetchCities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'get city list fail';
      });
  },
});

export const { setLocation, setCustomRegionEnabled } = mapSlice.actions;
export default mapSlice.reducer;
