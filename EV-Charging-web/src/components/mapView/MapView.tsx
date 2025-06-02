// MapView.jsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

function MapView() {
  return (
    <MapContainer
      center={[51.505, -0.09]}
      zoom={13}
      style={{ height: '100vh', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      <Marker position={[51.505, -0.09]}>
        <Popup>你好，React Leaflet!</Popup>
      </Marker>
    </MapContainer>
  );
}

export default MapView;
