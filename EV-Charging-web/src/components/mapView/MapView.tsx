import { useEffect, useState, useRef, useMemo } from 'react';
import { parseISO, format } from 'date-fns';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw/dist/leaflet.draw.js';
import { MapContainer, TileLayer, Marker, CircleMarker, Popup, FeatureGroup, GeoJSON } from 'react-leaflet';
import { getMapMarkers, EVMarker } from './../../api/map';
import { useAppDispatch } from '../../hooks';
import { setAvailableConnectorTypes, setPowerLimits } from './../../store/mapSlice';
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
  const { currentLocationId, locations, isCustomRegionEnabled, connectorTypes, powerRange } =
    useAppSelector(s => s.map);
  const { timePoint } = useAppSelector(s => s.time);
  // store regionGeoJson
  const [regionGeoJson, setRegionGeoJson] = useState<GeoJSON.Geometry | null>(null);
  // control legend
  const [isLegendOpen, setLegendOpen] = useState(true);
  // when isCustomRegionEnabled = false, Clear polygons from the map
  const featureGroupRef = useRef<L.FeatureGroup<any> | null>(null);
  // use for api
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // store makers from backend
  const [markers, setMarkers] = useState<EVMarker[]>([]);
  const dispatch = useAppDispatch();
  const displayedMarkers = useMemo(() => {
    return markers.filter(m => {
      if (connectorTypes.length === 0) return true;
      console.log(m, 'm')
      const markerTypes = m.popupInfo.type
        .split(/[,&/]/)
        .map(t => t.trim());

      return markerTypes.some(t => connectorTypes.includes(t));
    });
  }, [markers, connectorTypes]);
  // 当用户画完一个矩形时
  /** 处理绘制完成事件 —— 只会收到矩形（Polygon） */
  const _onCreated = (e: any) => {
    const layer = e.layer;
    const feature = layer.toGeoJSON() as GeoJSON.Feature<
      GeoJSON.Polygon,
      GeoJSON.GeoJsonProperties
    >;
    const geometry = feature.geometry;

    // 保证只保留一个绘制区域
    if (featureGroupRef.current) {
      const fg = featureGroupRef.current as any;
      fg.clearLayers();
      fg.addLayer(layer);
    }

    setRegionGeoJson(geometry);
  };

  // // User deletes an existing polygon
  const _onDeleted = () => {
    setRegionGeoJson(null);
    setMarkers([]); // clear all ev charging
  };

  // if isCustomRegionEnabled = false, clear the drawing layer and set polygonGeoJson to null
  useEffect(() => {
    if (!isCustomRegionEnabled) {
      if (featureGroupRef.current) {
        featureGroupRef.current.clearLayers();
      }
      setRegionGeoJson(null);
    }
  }, [isCustomRegionEnabled]);

  // request data of mock when isCustomRegionEnabled = false
  useEffect(() => {
    // if (isCustomRegionEnabled) return;
    if (!timePoint || !currentLocationId || isCustomRegionEnabled) {
      setMarkers([]);
      console.log('currentTime or currentLocationId is empty')
      return;
    }
    setLoading(true);
    setError(null);
    async function getMarkersData() {
      try {
        const isoTime = new Date(timePoint.replace(' ', 'T'))
          .toISOString()
          // .slice(0, 10);
          .slice(0, 19) + 'Z';
        // const isoTime = new Date(timePoint).toISOString().slice(0, 10);
        const res = await getMapMarkers(currentLocationId, isoTime);
        // mock
        // const res = await getMapMarkers();
        console.log(res, isoTime, res.data, 'map.res')
        // const key = timePoint.includes(' ')
        //   ? `${timePoint.replace(' ', 'T')}:00Z`
        //   : timePoint;
        let pts = res.data[isoTime] || [];
        console.log(pts, 'pts')
        // console.log('pts', res.data, timePoint)
        setMarkers(pts);
        const types = Array.from(new Set(pts.map(p => p.popupInfo.type))).sort();
        console.log(types, 'types')
        const powers = pts.map(p => p.power_kW);
        const minPower = Math.min(...powers);
        const maxPower = Math.max(...powers);
        dispatch(setAvailableConnectorTypes(types));
        // dispatch(setPowerLimits([minPower, maxPower]));
      } catch (err) {
        console.error('Failed to load charging post data', err);
        setError('Failed to load charging post data, please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (!isCustomRegionEnabled) {
      getMarkersData();
    }
  }, [isCustomRegionEnabled, currentLocationId, timePoint]);

  // request data of mock when isCustomRegionEnabled = true
  useEffect(() => {
    if (isCustomRegionEnabled && regionGeoJson && timePoint) {
      console.log('request data with regionGeoJson')
      // 把 { geometry: polygonGeoJson, date: currentTime } 发给后端
        // 若启用自定义区域并已绘制多边形，则过滤
        // if (isCustomRegionEnabled && polygonGeoJson) {
          // TODO: 引入 turf.booleanPointInPolygon 进行空间过滤
          // pts = pts.filter(pt => booleanPointInPolygon(L.latLng(pt.lat, pt.lon), polygonGeoJson));
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
  }, [isCustomRegionEnabled, regionGeoJson, timePoint]);

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
        {/* —— 自定义区域绘制 —— */}
        {isCustomRegionEnabled && (
          <FeatureGroup ref={featureGroupRef}>
            <EditControl
              position="topright"
              onCreated={_onCreated}
              onDeleted={_onDeleted}
              draw={{
                rectangle: { shapeOptions: { color: '#f357a1', weight: 4 } },
                circle: false,
                circlemarker: false,
                marker: false,
                polyline: false,
                polygon: false,
              }}
              edit={{
                featureGroup: featureGroupRef.current!, // 初次渲染时可能是 null，库内部会在下一帧拿到
                remove: true,
              }}
            />
          </FeatureGroup>
        )}

        {/* —— 绘制完成后回显矩形 —— */}
        {regionGeoJson && (
          <GeoJSON data={regionGeoJson} style={{ color: 'blue', weight: 2, fillOpacity: 0.1 }} />
        )}
        {displayedMarkers.map((marker) => {
          const { lat, lon, power_kW, popupInfo } = marker;
          const radius = power_kW <= 50 ? 4 : power_kW <= 150 ? 8 : 10;

          const statusColor =
            popupInfo.status === 'AVAILABLE'
              ? '#059669'
              : popupInfo.status === 'OCCUPIED'
              ? '#B91C1C'
              : '#475569';

          return (
            <CircleMarker
              key={`circle-${lat}-${lon}-${popupInfo.id}`}
              center={[lat, lon]}
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
          {displayedMarkers.map((marker) => {
            const { lat, lon, popupInfo, power_kW } = marker;
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
                key={`marker-${lat}-${lon}-${popupInfo.id}`}
                position={[lat, lon]}
                icon={customIcon}
              >
                <Popup>
                  <div className='station_content' style={{ fontSize: 14, lineHeight: 1.4 }}>
                    <span className='popItem'>ID:</span> {popupInfo.id} <br />
                    <span className='popItem'>Name:</span> {popupInfo.name} <br />
                    {/* <span className='popItem'>Power:</span> {marker.power_kW} kW <br /> */}
                    <span className='popItem'>Type:</span> {marker.popupInfo.type}<br />
                    <span className='popItem'>Status:</span> {popupInfo.status} <br />
                    <span className='popItem'>Last&nbsp;Updated:</span> {format(parseISO(popupInfo.lastUpdated), 'yyyy-MM-dd HH:mm:ss')}
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
          unmountOnExit
        >
          <div className='legend-card'>
            <IconButton
              size="small"
              sx={{ position: 'absolute', top: 4, right: 4, zIndex: 2000 }}
              onClick={() => setLegendOpen(false)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
            {/* <div className='legend-kw'>
              <div className='kw-detail kw-detail-high'>
                high power
              </div>
              <div className='kw-detail kw-detail-mid'>
                mid power
              </div>
              <div className='kw-detail kw-detail-low'>
                low power
              </div>
            </div> */}
            <div className='legend-status'>
              <div className='status-detail available'>
                <span className='status-icon'></span>
                <span className='status-text'>Available</span>
              </div>
              {/* <div className='status-detail charging'>              
                <span className='status-icon'></span>
                <span className='status-text'>Charging</span>
              </div>
              <div className='status-detail paused'>
                <span className='status-icon'></span>
                <span className='status-text'>Paused</span>
              </div> */}
              <div className='status-detail occpuied'>
                <span className='status-icon'></span>
                <span className='status-text'>Occpuied</span>
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
