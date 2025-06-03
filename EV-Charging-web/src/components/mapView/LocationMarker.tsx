import { useState } from 'react';
import { useMapEvents, Marker, Popup } from 'react-leaflet';
import * as L from 'leaflet'; 

export default function LocationMarker() {
  const [position, setPosition] = useState<L.LatLng | null>(null);

  const map = useMapEvents({
    click() {
      map.locate()
    },
    locationfound(e) {
      setPosition(e.latlng)
      map.flyTo(e.latlng, map.getZoom())
    },
  })

  return position === null ? null : (
    <Marker position={position}>
      <Popup>You are here</Popup>
    </Marker>
  )
}