import MapView from "./../../components/mapView/MapView";
import MapControl from "./../../components/mapControl/MapControl"

import './Location.css'

export default function Location() {
  return (
    <div className="home_page">
      <MapControl />
      <MapView />
    </div>
  );
}
