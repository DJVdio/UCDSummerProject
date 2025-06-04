import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster'
// import { useLocation } from 'react-router-dom';
import { useAppSelector } from '../../hooks';
import {Icon} from 'leaflet';
import type { LatLngExpression } from 'leaflet';
// import markerPng from './../../assets/marker.png';

// const customIcon = new Icon({
//   iconUrl: markerPng,
//   iconSize: [38, 38],
//   iconAnchor: [19, 38],
// });

interface PopupInfo {
  id: string;
  name: string;
  description: string;
  status: string;
  lastUpdated: string;
}

interface EVMarker {
  lat: number;
  lng: number;
  popupInfo: {
    id: string;
    name: string;
    description: string;
    status: string;
    lastUpdated: string;
  };
}

// DEMO data, marker depends on date
const mockMarkersByDate: Record<string, EVMarker[]> = {
  '2025-06-01': [
    {
      lat: 53.355,
      lng: -6.266,
      popupInfo: {
        id: 'A-001',
        name: 'station A',
        description: 'xxxxx',
        status: 'available',
        lastUpdated: '2025-06-01 08:15',
      },
    },
    {
      lat: 53.354,
      lng: -6.264,
      popupInfo: {
        id: 'B-001',
        name: 'location B',
        description: 'xxxxxxxx',
        status: 'occupied',
        lastUpdated: '2025-06-02 10:42',
      },
    },
    {
      lat: 53.356,
      lng: -6.268,
      popupInfo: {
        id: 'C-001',
        name: 'location C',
        description: 'xxxxxxx',
        status: 'offline',
        lastUpdated: '2025-06-02 09:20',
      },
    },
    {
      lat: 53.353,
      lng: -6.265,
      popupInfo: {
        id: 'D-001',
        name: 'location D',
        description: 'xxxxxxxx',
        status: 'available',
        lastUpdated: '2025-06-03 07:55',
      },
    },
  ],
};

export default function MapView() {
  // const { key: locationKey } = useLocation(); // setting the only key
  const { currentLocationId, currentTime, locations } =
    useAppSelector(s => s.map);
  // store makers from backend
  const [markers, setMarkers] = useState<EVMarker[]>([]);

  useEffect(() => {
    if (!currentTime) {
      setMarkers([]);
      console.log('currentTime is empty')
      return;
    }

    // request data of mock
    const dataForDate = mockMarkersByDate[currentTime] ?? [];
    setMarkers(dataForDate);
  }, [currentTime]);
  const center: LatLngExpression =
  locations.find((loc) => loc.id === currentLocationId)?.center ?? [0, 0];
  return (
    <MapContainer
      key={`${currentLocationId}-${currentTime}`}
      center={center as LatLngExpression}
      zoom={13}
      scrollWheelZoom // true
      style={{ height: '100vh', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      <MarkerClusterGroup>
        {markers.map((m) => (
          <Marker
            key={`${m.lat}-${m.lng}-${m.popupInfo.id}`}
            position={[m.lat, m.lng] as LatLngExpression}
          >
            <Popup>
              <div>
                <strong>ID:</strong> {m.popupInfo.id} <br />
                <strong>Name:</strong> {m.popupInfo.name} <br />
                <strong>Description:</strong> {m.popupInfo.description} <br />
                <strong>Status:</strong> {m.popupInfo.status} <br />
                <strong>Last Updated:</strong> {m.popupInfo.lastUpdated}
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
