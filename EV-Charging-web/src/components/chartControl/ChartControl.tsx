import { useState, useEffect } from 'react';
import { DateTimePicker, LocalizationProvider, DateTimeValidationError } from '@mui/x-date-pickers';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Box } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { setTimeRange, setTimePoint } from './../../store/timeSlice';
import { fetchCities, setLocation } from '../../store/mapSlice';
import "./ChartControl.css"

const MIN_ALLOWED = new Date(2025, 5, 20, 0, 0, 0, 0);
const isBeforeDay = (date: Date) => date < MIN_ALLOWED;

export default function TimeRangeController() {
  const dispatch = useAppDispatch();
  const { timeRange, timePoint } = useAppSelector(s => s.time);
  const { locations, currentLocationId, isCustomRegionEnabled } =
    useAppSelector(s => s.map);
  const [isInvalid, setIsInvalid] = useState(false);

  // select city
  const handleLocationChange = (locId: string) => {
    dispatch(setLocation(locId));
  };

  useEffect(() => {
    dispatch(fetchCities());
  }, [dispatch]);

  // DateTimePickers update
  const onStartChange = (newValue: Date | null) => {
    if (!newValue) return;
    if (newValue && newValue > new Date()) return;
    if (newValue < MIN_ALLOWED) return;
    dispatch(setTimeRange({ timeStart: newValue.toISOString(), timeEnd: timeRange.timeEnd }));
    dispatch(setTimePoint(newValue.toISOString()));
  };
  const onEndChange = (newValue: Date | null) => {
    if (!newValue) return;
    if (newValue && newValue > new Date()) return;
    if (newValue < MIN_ALLOWED) return;
    dispatch(setTimeRange({ timeStart: timeRange.timeStart, timeEnd: newValue.toISOString() }));
  };

  useEffect(() => {
    if (!timeRange.timeStart || !timeRange.timeEnd) {
      console.log('is there time?')
      const nowTime = new Date();
      const oneDayAgo = new Date(nowTime.getTime() - 24 * 60 * 60 * 1000);
      console.log(nowTime)
      dispatch(
        setTimeRange({
          timeStart: oneDayAgo.toISOString(),
          timeEnd: nowTime.toISOString(),
        })
      )
    }
  }, [timeRange.timeStart, timeRange.timeEnd, dispatch]);

  return (
    <div className='control-wrapper'>
      <div className='control-content'>
        <div className='location-content'>
          {/* —— Location Select —— */}
          <FormControl size="small" className="location-select">
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
        </div>
        {/* —— DatePicker —— */}
        <div className="date-picker-box">
          {/* <Typography variant="caption">Select Date</Typography> */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box display="flex" gap={2} alignItems="center">
              <DateTimePicker
                label="Start"
                value={timeRange.timeStart ? new Date(timeRange.timeStart) : null}
                onChange={onStartChange}
                minutesStep={1}
                disableFuture
                shouldDisableDate={isBeforeDay}
                onError={(reason: DateTimeValidationError | null) =>
                  setIsInvalid(reason === 'shouldDisableDate')
                }
                slotProps={{ 
                  textField: { 
                    size: 'small',
                    error: isInvalid,
                    helperText: isInvalid ? `Only ${MIN_ALLOWED} are allowed` : '',
                  } 
                }}
              />
              <DateTimePicker
                label="End"
                value={timeRange.timeEnd ? new Date(timeRange.timeEnd) : null}
                onChange={onEndChange}
                minutesStep={1}
                disableFuture
                shouldDisableDate={isBeforeDay}
                onError={(reason: DateTimeValidationError | null) =>
                  setIsInvalid(reason === 'shouldDisableDate')
                }
                slotProps={{ 
                  textField: { 
                    size: 'small',
                    error: isInvalid,
                    helperText: isInvalid ? `Only ${MIN_ALLOWED} are allowed` : '',
                  } 
                }}
              />
            </Box>
          </LocalizationProvider>
        </div>
      </div>
    </div>
  );
}
