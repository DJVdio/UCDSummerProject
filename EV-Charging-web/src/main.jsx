import './leaflet-setup'; 
import React from 'react';
import { createRoot } from 'react-dom/client';
// import { StrictMode } from 'react';
import { StyledEngineProvider } from '@mui/material/styles';
import { Provider } from 'react-redux';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './index.css';

import { store } from './store';
import App from './App';  

import L from 'leaflet';
import 'leaflet-draw';

createRoot(document.getElementById('root')).render(
  // <StrictMode>
    <StyledEngineProvider injectFirst>
      <Provider store={store}>
        <App />
      </Provider>
    </StyledEngineProvider>
  // </StrictMode>,
);
