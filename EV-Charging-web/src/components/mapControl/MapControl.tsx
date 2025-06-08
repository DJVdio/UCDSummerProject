import { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch } from '@mui/material';
import {
  LocalizationProvider, 
  DateTimePicker,
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { setTimePoint } from '../../store/timeSlice';
import { setLocation, setCustomRegionEnabled } from '../../store/mapSlice';
import './MapControl.css'

export default function MapControl() {
  const dispatch = useAppDispatch();
  const { locations, currentLocationId, isCustomRegionEnabled } =
    useAppSelector(s => s.map);
    const { timePoint } = useAppSelector(s => s.time);
  // console.log(locations, currentLocationId, currentTime);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // users could choose geographic location
  const clickCustomRegionToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setCustomRegionEnabled(event.target.checked));
  };

  // select city
  const handleLocationChange = (locId: string) => {
    dispatch(setLocation(locId));
  };

  useEffect(() => {
    if (!timePoint) {
      console.log('is there time?')
      const now = new Date();
      setSelectedDate(now);

      const pad = (n: number) => n.toString().padStart(2, '0');
      const dateString =
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
        `${pad(now.getHours())}:${pad(now.getMinutes())}`;

      dispatch(setTimePoint(dateString));
    } else {
      const d = new Date(timePoint);
      if (!isNaN(d.getTime())) {
        // console.log(d)
        setSelectedDate(d);
      }
    }
  }, [timePoint]);

  // select date
  const handleDateChange = (date: Date | null) => {
    if (!date || isNaN(date.getTime())) return;
    setSelectedDate(date);

    // Convert the Date to the string format required by the backend.
    // Assume that the backend requires ‘YYYY-MM-DD’; if need hours, minutes, and seconds, use date.toISOString().
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const dateString = `${year}-${month}-${day} ${hours}:${minutes}`;

    // dispatch to Redux
    dispatch(setTimePoint(dateString));
  };

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

          {/* —— Use Custom Region Switch —— */}
          {/* <FormControlLabel
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
          /> */}
        </div>
        {/* —— DatePicker —— */}
        <div className="date-picker-box">
          {/* <Typography variant="caption">Select Date</Typography> */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            {/* <DatePicker
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
            /> */}
            <DateTimePicker
              label="Time picker"
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
              // minutesStep 选1 代表可以选任意分钟；如果想每5分钟一档就写 5
              minutesStep={1}
            />
          </LocalizationProvider>
        </div>
      </div>
    </div>
  );
}
