import { useState, useEffect } from 'react';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Box } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { setTimeRange, setTimePoint } from './../../store/timeSlice';
import { setLocation } from '../../store/mapSlice';
import "./ChartControl.css"

export default function TimeRangeController() {
  const dispatch = useAppDispatch();
  const { timeRange, timePoint } = useAppSelector(s => s.time);
  const { locations, currentLocationId, isCustomRegionEnabled } =
    useAppSelector(s => s.map);

  // select city
  const handleLocationChange = (locId: string) => {
    dispatch(setLocation(locId));
  };
  // DateTimePickers update
  const onStartChange = (date: Date | null) => {
    if (!date) return;
    dispatch(setTimeRange({ timeStart: date.toISOString(), timeEnd: timeRange.timeEnd }));
    dispatch(setTimePoint(date.toISOString()));
  };
  const onEndChange = (date: Date | null) => {
    if (!date) return;
    dispatch(setTimeRange({ timeStart: timeRange.timeStart, timeEnd: date.toISOString() }));
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
  // Slider（假设最多查 30 天，可把刻度映射到时间戳）
  // const onSliderChange = (_: any, [startTs, endTs]: number[]) => {
  //   dispatch(
  //     setTimeRange({
  //       timeStart: new Date(startTs).toISOString(),
  //       timeEnd: new Date(endTs).toISOString(),
  //     }),
  //   );
  // };

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
                slotProps={{ textField: { size: 'small' } }}
              />
              <DateTimePicker
                label="End"
                value={timeRange.timeEnd ? new Date(timeRange.timeEnd) : null}
                onChange={onEndChange}
                minutesStep={1}
                disableFuture
                slotProps={{ textField: { size: 'small' } }}
              />
            </Box>

            {/* 可选：一个直观的范围滑块 */}
            {/* <Slider
              sx={{ mt: 3 }}
              value={[
                timeRange.timeStart ? Date.parse(timeRange.timeStart) : 0,
                timeRange.timeEnd ? Date.parse(timeRange.timeEnd) : 0,
              ]}
              min={Date.parse('2025-06-01T00:00')}
              max={Date.parse('2025-06-08T23:59')}
              step={5 * 60 * 1000} // 5 min
              onChange={onSliderChange}
              valueLabelDisplay="off"
            /> */}
          </LocalizationProvider>
        </div>
      </div>
    </div>
  );
}
