import { useState, useEffect } from 'react';
import { DateTimePicker, LocalizationProvider, DateTimeValidationError } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Box } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { setTimeStart, setTimeEnd } from './../../store/timeSlice';
import { fetchCities, setLocation } from '../../store/mapSlice';
import "./WholeCountryControl.css"

// 这个日期前所有时间都不可被选择
const DAY_MS = 86_400_000;
const MIN_ALLOWED_END = new Date(2025, 5, 20, 0, 0, 0, 0);
const isBeforeDayEnd = (date: Date) => date < MIN_ALLOWED_END;

const MIN_ALLOWED_START = new Date(2025, 5, 19, 0, 0, 0, 0);
const isBeforeDayStart = (date: Date) => date < MIN_ALLOWED_START;

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
    if (newValue < MIN_ALLOWED_START) return;
    const newEnd = new Date(newValue.getTime() + DAY_MS);
    dispatch(setTimeStart(newValue.toISOString()));
  };
  const onEndChange = (newValue: Date | null) => {
    if (!newValue) return;
    if (newValue && newValue > new Date()) return;
    if (newValue < MIN_ALLOWED_END) return;
    dispatch(setTimeEnd(newValue.toISOString()));
  };

  // default 24 hours
  // useEffect(() => {
  //   if (!timeRange.timeStart || !timeRange.timeEnd) {
  //     console.log('is there time?')
  //     const nowTime = new Date();
  //     const oneDayAgo = new Date(nowTime.getTime() - 24 * 60 * 60 * 1000);
  //     console.log(nowTime)
  //     dispatch(
  //       setTimeRange({
  //         timeStart: oneDayAgo.toISOString(),
  //         timeEnd: nowTime.toISOString(),
  //       })
  //     )
  //   }
  // }, [timeRange.timeStart, timeRange.timeEnd, dispatch]);

  return (
    <div className='control-wrapper'>
      <div className='control-content'>
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
                shouldDisableDate={isBeforeDayStart}
                onError={(reason: DateTimeValidationError | null) =>
                  setIsInvalid(reason === 'shouldDisableDate')
                }
                slotProps={{ 
                  textField: { 
                    size: 'small',
                    error: isInvalid,
                    helperText: isInvalid ? `Only ${MIN_ALLOWED_START} are allowed` : '',
                  } 
                }}
              />
              <DateTimePicker
                label="End"
                value={timeRange.timeEnd ? new Date(timeRange.timeEnd) : null}
                onChange={onEndChange}
                minutesStep={1}
                disableFuture
                shouldDisableDate={isBeforeDayEnd}
                onError={(reason: DateTimeValidationError | null) =>
                  setIsInvalid(reason === 'shouldDisableDate')
                }
                slotProps={{ 
                  textField: { 
                    size: 'small',
                    error: isInvalid,
                    helperText: isInvalid ? `Only ${MIN_ALLOWED_END} are allowed` : '',
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
