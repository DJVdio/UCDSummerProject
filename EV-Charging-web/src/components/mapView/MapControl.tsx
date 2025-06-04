import { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Slider, Typography } from '@mui/material';
import {
  LocalizationProvider, 
  DatePicker, 
  TimePicker,
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { setLocation, setTime } from '../../store/mapSlice';
import './MapControl.css'

export default function MapControl() {
  const dispatch = useAppDispatch();
  const { locations, currentLocationId, currentTime } =
    useAppSelector(s => s.map);
  console.log(locations, currentLocationId, currentTime);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (currentTime) {
      const d = new Date(currentTime);
      if (!isNaN(d.getTime())) {
        setSelectedDate(d);
      }
    }
  }, [currentTime]);
  // select date
  const handleDateChange = (date: Date | null) => {
    if (!date || isNaN(date.getTime())) return;
    setSelectedDate(date);

    // Convert the Date to the string format required by the backend.
    // Assume that the backend requires ‘YYYY-MM-DD’; if need hours, minutes, and seconds, use date.toISOString().
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    // 立刻 dispatch 到 Redux
    dispatch(setTime(dateString));
  };
  return (
    <div className='control-wrapper'>
      <div className='control-content'>
        {/* —— Location Select —— */}
        <FormControl size="small" className='location-select'>
          <InputLabel id="location-label">Location</InputLabel>
          <Select
            labelId="location-label"
            label="Location"
            value={currentLocationId}
            onChange={e => dispatch(setLocation(e.target.value as number))}
          >
            {locations.map(location => (
              <MenuItem key={location.id} value={location.id}>
                {location.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* —— DatePicker —— */}
        <div className="date-picker-box">
          {/* <Typography variant="caption">Select Date</Typography> */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Date"
              value={selectedDate}
              onChange={handleDateChange}
              slotProps={{
                textField: {
                  size: 'small',
                  variant: 'outlined',
                  style: {
                    padding: '6px 8px',
                    fontSize: '0.875rem',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                  },
                },
              }}
            />
          </LocalizationProvider>
        </div>
      </div>
    </div>
  );
}
