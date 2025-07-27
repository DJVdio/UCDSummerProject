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
  connectorTypes: string[]; // charging station
  powerRange: [number, number];
  availableConnectorTypes: string[];
  powerLimits: [number, number]; // 20 - 200
}

const initialState: MapState = {
  currentLocationId: 'dublin',
  // currentTime: new Date().toISOString().split('T')[0], // form of date: 'YYYY-MM-DD'
  locations: [
    { id: 'dublin', label: 'Dublin', center: [53.35, -6.26] },
    { id: 'cork',   label: 'Cork',   center: [51.898, -8.4756] },
    { id: 'galway', label: 'Galway', center: [53.2707, -9.0568] },
  ],
  isCustomRegionEnabled: false,
  loading: false,
  connectorTypes: [], 
  powerRange: [20, 200],
  availableConnectorTypes: [],
  powerLimits: [20, 200],
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
    // 用户选择的连接器类型
    setConnectorTypes(state, action: PayloadAction<string[]>) {
      state.connectorTypes = action.payload;
    },

    // 动态设置可用连接器类型（由接口数据生成） 
    setAvailableConnectorTypes(state, action: PayloadAction<string[]>) {
      state.availableConnectorTypes = action.payload;
      // 如果当前选中的类型在新列表里不存在，需要重置已选列表
      state.connectorTypes = state.connectorTypes.filter(t => action.payload.includes(t));
    },
    setPowerLimits(state, action: PayloadAction<[number, number]>) {
      state.powerLimits = action.payload;
      // 边界变化时保证当前选中范围在边界内
      const [min, max] = action.payload;
      let [curMin, curMax] = state.powerRange;
      curMin = Math.max(curMin, min);
      curMax = Math.min(curMax, max);
      if (curMin > curMax) {
        curMin = min;
        curMax = max;
      }
      state.powerRange = [curMin, curMax];
    },

    setPowerRange(state, action: PayloadAction<[number, number]>) {
      state.powerRange = action.payload;
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

export const {
  setLocation,
  setCustomRegionEnabled,
  setConnectorTypes, 
  setPowerRange, 
  setAvailableConnectorTypes,
  setPowerLimits,
} = mapSlice.actions;
export default mapSlice.reducer;
