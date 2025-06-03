import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster'
import { useLocation } from 'react-router-dom';
import LocationMarker from './LocationMarker'
import {Icon} from 'leaflet';
import type { LatLngExpression } from 'leaflet';

const CENTER: LatLngExpression = [53.35, -6.26]; // Latitude and longitude of Dublin city centre

export default function MapView() {
  const { key: locationKey } = useLocation(); // setting the only key
  const markers = [
    {
      geocode: [53.36,  -6.27],
      popup: "hello I am popup1"
    },
    {
      geocode: [53.30,  -6.26],
      popup: "hello I am popup2"
    },
    {
      geocode: [53.38,  -6.29],
      popup: "hello I am popup3"
    },
    {
      geocode: [53.31,  -6.24],
      popup: "hello I am popup4"
    },
  ]
  const customIcon = new Icon({
    iconUrl: "",
    iconSize: [38, 38]
  })
  return (
    <MapContainer
      key={locationKey}
      center={CENTER}
      zoom={13}
      scrollWheelZoom // true
      style={{ height: '100vh', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      <MarkerClusterGroup>
      {
        markers.map(marker => (
          <Marker position={marker.geocode as L.LatLngTuple}>
          </Marker>
        ))
      }
      </MarkerClusterGroup>
      <LocationMarker />
    </MapContainer>
  );
}
