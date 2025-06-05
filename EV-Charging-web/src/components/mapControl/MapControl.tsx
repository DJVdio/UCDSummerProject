import { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch } from '@mui/material';
import {
  LocalizationProvider, 
  DatePicker, 
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { setLocation, setTime, setCustomRegionEnabled } from '../../store/mapSlice';
import './MapControl.css'

export default function MapControl() {
  const dispatch = useAppDispatch();
  const { locations, currentLocationId, currentTime, isCustomRegionEnabled } =
    useAppSelector(s => s.map);
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
    if (currentTime) {
      const d = new Date(currentTime);
      if (!isNaN(d.getTime())) {
        // console.log(d)
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

    // dispatch to Redux
    dispatch(setTime(dateString));
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
