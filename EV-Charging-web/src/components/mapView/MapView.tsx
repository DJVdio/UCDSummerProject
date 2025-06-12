import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, CircleMarker, Popup, FeatureGroup, GeoJSON } from 'react-leaflet';
import { getMapMarkers, EVMarker } from './../../api/map';
import { Fade, IconButton, Fab } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MarkerClusterGroup from 'react-leaflet-cluster'
import { EditControl } from 'react-leaflet-draw';
import { useAppSelector } from '../../hooks';
import {Icon} from 'leaflet';
import type { LatLngExpression } from 'leaflet';
import markerPng from './../../assets/marker.png';
import './MapView.css'

const customIcon = new Icon({
  iconUrl: markerPng,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
});

export default function MapView() {
  // const { key: locationKey } = useLocation(); // setting the only key
  const { currentLocationId, locations, isCustomRegionEnabled } =
    useAppSelector(s => s.map);
  const { timePoint } = useAppSelector(s => s.time);
  // store GeoJSON Polygon
  const [polygonGeoJson, setPolygonGeoJson] = useState<GeoJSON.Geometry | null>(null);
  // control legend
  const [isLegendOpen, setLegendOpen] = useState(true);
  // when isCustomRegionEnabled = false, Clear polygons from the map
  const featureGroupRef = useRef<L.FeatureGroup<any> | null>(null);
  // use for api
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // store makers from backend
  const [markers, setMarkers] = useState<EVMarker[]>([]);

  // // 当用户画完一个多边形或者矩形时
  const _onCreated = (e: any) => {
    const layer = e.layer;
    // Leaflet 的 layer.toGeoJSON() 一定会返回一个 Feature 对象
    const feature = layer.toGeoJSON() as GeoJSON.Feature<GeoJSON.Polygon, GeoJSON.GeoJsonProperties>;
    const geometry = feature.geometry;

    // 先把以前的 shape 清掉（可选逻辑）
    if (featureGroupRef.current) {
      const fg = featureGroupRef.current as any;
      fg.clearLayers();
      fg.addLayer(layer);
    }

    // 更新到 state
    setPolygonGeoJson(geometry);
  }

  // // User deletes an existing polygon
  const _onDeleted = () => {
    setPolygonGeoJson(null);
    setMarkers([]); // clear all ev charging
  };

  // if isCustomRegionEnabled = false, clear the drawing layer and set polygonGeoJson to null
  useEffect(() => {
    if (!isCustomRegionEnabled) {
      // clear all polygon
      if (featureGroupRef.current) {
        featureGroupRef.current.clearLayers();
      }
      setPolygonGeoJson(null);
    }
  }, [isCustomRegionEnabled]);

  // request data of mock when isCustomRegionEnabled = false
  useEffect(() => {
    if (!timePoint || !currentLocationId) {
      setMarkers([]);
      console.log('currentTime or currentLocationId is empty')
      return;
    }
    setLoading(true);
    setError(null);
    async function getMarkersData() {
      try {
        const res = await getMapMarkers();
        // Processing timePoint format (e.g. ‘2025-06-01 18:15’ to ISO)
        // const key = timePoint.includes(' ')
        //   ? `${timePoint.replace(' ', 'T')}:00Z`
        //   : timePoint;
        let pts = res.data[timePoint] || [];
        // console.log('pts', res.data, timePoint)
        setMarkers(pts);
      } catch (err) {
        console.error('Failed to load charging post data', err);
        setError('Failed to load charging post data, please try again later.');
      } finally {
        setLoading(false);
      }
    }

    getMarkersData();
  }, [isCustomRegionEnabled, currentLocationId, timePoint]);

  // request data of mock when isCustomRegionEnabled = true
  useEffect(() => {
    if (isCustomRegionEnabled && polygonGeoJson && timePoint) {
      // 把 { geometry: polygonGeoJson, date: currentTime } 发给后端
        // 若启用自定义区域并已绘制多边形，则过滤
        // if (isCustomRegionEnabled && polygonGeoJson) {
          // TODO: 引入 turf.booleanPointInPolygon 进行空间过滤
          // pts = pts.filter(pt => booleanPointInPolygon(L.latLng(pt.lat, pt.lng), polygonGeoJson));
        // }
      // const dataForDate = mockMarkersByDate[timePoint] ?? [];
      // TODO: 用 turf.booleanPointInPolygon 之类的方法筛一遍
      // const filtered = dataForDate.filter(pt => booleanPointInPolygon(point, polygonGeoJson));
      // setMarkers(filtered);

      // demo 暂时先不做空间过滤，直接返回所有
      // setMarkers(dataForDate);
    } else {
      console.log('err in request data of mock when isCustomRegionEnabled = false')
    }
  }, [isCustomRegionEnabled, polygonGeoJson, timePoint]);

  // current location
  const center: LatLngExpression =
  locations.find((loc) => loc.id === currentLocationId)?.center ?? [0, 0];

  return (
    <div className='map-wrapper'>
      <MapContainer
        key={`${currentLocationId}-${timePoint}`}
        center={center as LatLngExpression}
        zoom={13}
        scrollWheelZoom // true
        style={{ height: '100vh', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        {/* —— 如果自定义区域功能打开，就放一个可编辑的 FeatureGroup + EditControl —— */}
        {/* {isCustomRegionEnabled && (
          <FeatureGroup ref={featureGroupRef}>
            {featureGroupRef.current && (
              <EditControl
                position="topright"
                onCreated={_onCreated}
                onDeleted={_onDeleted}
                draw={{
                  rectangle: false,
                  circle: false,
                  circlemarker: false,
                  marker: false,
                  polyline: false,
                  polygon: {
                    allowIntersection: false,
                    showArea: false,
                    shapeOptions: { color: '#f357a1', weight: 4 },
                  },
                }}
                edit={{
                  featureGroup: featureGroupRef.current,
                  remove: true,
                }}
              />
            )}
          </FeatureGroup>
        )} */}
        {/** —— 如果用户画了 polygon，把它再渲染一次 —— **/}
        {/* {polygonGeoJson && (
          <GeoJSON
            data={polygonGeoJson}
            style={{ color: 'blue', weight: 2, fillOpacity: 0.1 }}
          />
        )} */}
        {markers.map((marker) => {
          const { lat, lng, power_kW, popupInfo } = marker;
          const radius = power_kW <= 50 ? 4 : power_kW <= 150 ? 8 : 10;

          const statusColor =
            popupInfo.status === 'available'
              ? '#00FF00'
              : popupInfo.status === 'occupied'
              ? '#FF4500'
              : '#000000';

          return (
            <CircleMarker
              key={`circle-${lat}-${lng}-${popupInfo.id}`}
              center={[lat, lng]}
              radius={radius}
              pathOptions={{
                color: statusColor,
                weight: 3,
                fillOpacity: 1,
              }}
            />
          );
        })}
        <MarkerClusterGroup>
          {markers.map((marker) => {
            const { lat, lng, popupInfo, power_kW } = marker;
            // size of png 
            const iconWidth = 30;
            const iconHeight = 30;

            const radius = power_kW <= 50 ? 4 : power_kW <= 150 ? 8 : 10;

            const anchorX = iconWidth / 2;
            const anchorY = iconHeight - (radius/2);

            const customIcon = new Icon({
              iconUrl: markerPng,
              iconSize: [iconWidth, iconHeight],
              iconAnchor: [anchorX, anchorY],
            });
            return (
              <Marker
                key={`marker-${lat}-${lng}-${popupInfo.id}`}
                position={[lat, lng]}
                icon={customIcon}
              >
                <Popup>
                  <div style={{ fontSize: 14, lineHeight: 1.4 }}>
                    <strong>ID:</strong> {popupInfo.id} <br />
                    <strong>Name:</strong> {popupInfo.name} <br />
                    <strong>Power:</strong> {marker.power_kW} kW <br />
                    <strong>Type:</strong> {marker.connectorType}<br />
                    <strong>Status:</strong> {popupInfo.status} <br />
                    <strong>Last&nbsp;Updated:</strong> {popupInfo.lastUpdated}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
      {/* —— show suggest —— */}
      <div className='legend-content'>
        <Fade
          in={isLegendOpen}
        >
          <div className='legend-card'>
            <IconButton
              size="small"
              sx={{ position: 'absolute', top: 4, right: 4, zIndex: 2000 }}
              onClick={() => setLegendOpen(false)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
            <div className='legend-kw'>
              <div className='kw-detail'> &lt; 50 KW low power </div>
              <div className='kw-detail'>50–150 kW mid-power </div>
              <div className='kw-detail'>&gt; 150 kW high power</div>
            </div>
            <div className='legend-status'>
              <div className='status-detail available'>
                <span className='status-icon'></span>
                <span className='status-text'>Available</span>
              </div>
              <div className='status-detail occupied'>              
                <span className='status-icon'></span>
                <span className='status-text'>Occupied</span>
              </div>
              <div className='status-detail offline'>
                <span className='status-icon'></span>
                <span className='status-text'>Offline</span>
              </div>
            </div>
          </div>
        </Fade>
        {!isLegendOpen && (
          <Fab
            size="small"
            color="primary"
            aria-label="show legend"
            className='button-fab'
            onClick={() => setLegendOpen(true)}
          >
            <InfoOutlinedIcon />
          </Fab>
        )}
      </div>
    </div>
  );
}
