import { useState, useEffect, useRef } from 'react';
import { FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch, Checkbox, ListItemText, SelectChangeEvent } from '@mui/material';
import {
  LocalizationProvider, 
  DateTimePicker,
  DateTimeValidationError,
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAppDispatch, useAppSelector } from './../../hooks';
import { setTimeEnd } from './../../store/timeSlice';
import { fetchCities, setLocation, setCustomRegionEnabled, setConnectorTypes, setPowerRange } from './../../store/mapSlice';
import './MapControl.css'

const MIN_ALLOWED = new Date(2025, 5, 20, 0, 0, 0, 0);
const isBeforeDay = (date: Date) => date < MIN_ALLOWED;

export default function MapControl() {
  const dispatch = useAppDispatch();
  const { 
    locations,
    currentLocationId,
    isCustomRegionEnabled,
    availableConnectorTypes,
    powerLimits,
    connectorTypes,
    powerRange,
  } =
    useAppSelector(s => s.map);
  const { timePoint } = useAppSelector(s => s.time);
  console.log(availableConnectorTypes, 'availableConnectorTypes');
  const [selectedDate, setSelectedDate, ] = useState<Date | null>(null);
  // date invalid
  const [isInvalid, setIsInvalid] = useState(false);
  const safeLimits: [number, number] =
    (Array.isArray(powerLimits) && powerLimits.length === 2 &&
     Number.isFinite(Number(powerLimits[0])) && Number.isFinite(Number(powerLimits[1])))
    ? [Number(powerLimits[0]), Number(powerLimits[1])]
    : [20, 200];
  const ranges = [
  { label: `All`, value: safeLimits },
  { label: '22–50 kW',   value: [22, 50] as [number, number] },
  { label: '51–150 kW',  value: [51, 150] as [number, number] },
  { label: '151–200 kW', value: [151, 200] as [number, number] },
];

  // users could choose geographic location
  const clickCustomRegionToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setCustomRegionEnabled(event.target.checked));
  };

  // select city
  const handleLocationChange = (locId: string) => {
    dispatch(setLocation(locId));
  };
  // 类型选择
  const handleConnectorChange = (e: SelectChangeEvent<string[]>) => {
    const val = e.target.value as string[];
    dispatch(setConnectorTypes(val));
  };
  // 功率选择
  const handlePowerChange = (e: SelectChangeEvent<string>) => {
  const next = JSON.parse(e.target.value) as [number, number];
  console.log(next, 'next')
  dispatch(setPowerRange(next));
};
  useEffect(() => {
    dispatch(fetchCities());
  }, [dispatch]);

  useEffect(() => {
    if (!timePoint) {
      console.log('is there time?')
      const now = new Date();
      setSelectedDate(now);

      // const pad = (n: number) => n.toString().padStart(2, '0');
      // const dateString =
      //   `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
      //   `${pad(now.getHours())}:${pad(now.getMinutes())}`;

      // dispatch(setTimeEnd(dateString));
      dispatch(setTimeEnd(now.toISOString()));
    } else {
      const d = new Date(timePoint);
      if (!isNaN(d.getTime())) {
        // console.log(d)
        setSelectedDate(d);
      }
    }
  }, [timePoint, dispatch]);

  // select date
  const handleDateChange = (newValue: Date | null) => {
    if (!newValue || isNaN(newValue.getTime())) return;
    if (newValue && newValue > new Date()) return;
    if (newValue < MIN_ALLOWED) return;
    // setSelectedDate(newValue);

    // // Convert the Date to the string format required by the backend.
    // // Assume that the backend requires ‘YYYY-MM-DD’; if need hours, minutes, and seconds, use date.toISOString().
    // const year = newValue.getFullYear();
    // const month = String(newValue.getMonth() + 1).padStart(2, '0');
    // const day = String(newValue.getDate()).padStart(2, '0');
    // const hours = String(newValue.getHours()).padStart(2, '0');
    // const minutes = String(newValue.getMinutes()).padStart(2, '0');
    // const dateString = `${year}-${month}-${day} ${hours}:${minutes}`;

    // // dispatch to Redux
    // dispatch(setTimeEnd(dateString));
    console.log(newValue.toISOString(), 'newValue')
    setSelectedDate(newValue);
    dispatch(setTimeEnd(newValue.toISOString()));
  };

  return (
    <div className='control-wrapper'>
      <div className='control-content'>
        <div className='location-content'>
          {/* —— Location Select —— */}
          <FormControl size="small" className="location-select select-box">
            <InputLabel
              id="location-label"
              // if isCustomRegionEnabled is true, set color of Label is gray
              style={{ color: isCustomRegionEnabled ? 'rgba(0, 0, 0, 0.38)' : undefined }}
            >
              Location
            </InputLabel>
            <Select
              labelId="location-label"
              label="Location"
              value={currentLocationId}
              onChange={e => handleLocationChange(e.target.value as string)}
              disabled={isCustomRegionEnabled}
            >
              {locations.map(location => (
                <MenuItem key={location.id} value={location.id}>
                  {location.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" className="type-select select-box">
            <InputLabel id="connector-label">Type</InputLabel>
            <Select
              labelId="connector-label"
              multiple
              value={connectorTypes}
              onChange={handleConnectorChange}
              renderValue={selected => (selected as string[]).join(', ')}
            >
              {availableConnectorTypes.map(type => (
                <MenuItem key={type} value={type}>
                  <Checkbox checked={connectorTypes.includes(type)} />
                  <ListItemText primary={type} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* 功率下拉框 */}
          <FormControl size="small" className="select-box">
            <InputLabel id="power-label">Power</InputLabel>
            <Select
              labelId="power-label"
              label="Power"
              // Select 的 value 是字符串，使用 JSON 序列化当前区间
              value={JSON.stringify(powerRange)}
              onChange={handlePowerChange}
            >
              {ranges.map(r => (
                <MenuItem key={r.label} value={JSON.stringify(r.value)}>
                  <ListItemText primary={r.label} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* —— Use Custom Region Switch —— */}
          <FormControlLabel
            control={
              <Switch
                checked={isCustomRegionEnabled}
                onChange={clickCustomRegionToggle}
                size="medium"
                sx={{
                  "& .MuiSwitch-switchBase": {
                    "&.Mui-checked": {
                      "& + .MuiSwitch-track": {
                        backgroundColor: "green",
                      },
                    },
                  },
                  "& .MuiSwitch-thumb": {
                    backgroundColor: "secondary.dark",
                  },
                  "& .MuiSwitch-track": {
                    backgroundColor: "black",
                    opacity: 0.1,
                  },
                }}
              />
            }
            label="Use Custom Region"
            className="custom-region-switch"
          />
        </div>
        {/* —— DatePicker —— */}
        <div className="date-picker-box">
          {/* <Typography variant="caption">Select Date</Typography> */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Time picker"
              value={selectedDate}
              onChange={handleDateChange}
              disableFuture
              closeOnSelect
              shouldDisableDate={isBeforeDay}
              onError={(reason: DateTimeValidationError | null) =>
                setIsInvalid(reason === 'shouldDisableDate')
              }
              slotProps={{
                textField: {
                  size: 'small',
                  variant: 'outlined',
                  error: isInvalid,
                  helperText: isInvalid ? `Only ${MIN_ALLOWED} are allowed` : '',
                  style: {
                    padding: '6px 8px',
                    fontSize: '0.875rem',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                  },
                },
              }}
              minutesStep={1}
            />
          </LocalizationProvider>
        </div>
      </div>
    </div>
  );
}
