import { useEffect, useState, useRef, useMemo } from 'react';
import { parseISO, format } from 'date-fns';

import { MapContainer, TileLayer, Marker, CircleMarker, Popup, FeatureGroup, GeoJSON } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import MarkerClusterGroup from 'react-leaflet-cluster';

import { Icon, type FeatureGroup as LeafletFeatureGroup, type LatLngExpression } from 'leaflet';

import { getMapMarkers, EVMarker, getMapMarkersByRect } from './../../api/map';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { setAvailableConnectorTypes /*, setPowerLimits*/ } from './../../store/mapSlice';

import { Fade, IconButton, Fab } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import markerPng from './../../assets/marker.png';
import './MapView.css';


const customIcon = new Icon({
  iconUrl: markerPng,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
});

export default function MapView() {
  // const { key: locationKey } = useLocation(); // setting the only key
  const { currentLocationId, locations, isCustomRegionEnabled, connectorTypes, powerLimits, powerRange } =
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
  /** GeoJSON Polygon（矩形）坐标转左上/右下角
   *  GeoJSON 坐标顺序是 [lon, lat]
   */
  const getRectCornersFromPolygon = (polygon: GeoJSON.Polygon) => {
    const ring = polygon.coordinates[0] as [number, number][];
    let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
    for (const [lon, lat] of ring) {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
    }
    return {
      // 左上：西经（minLon），北纬（maxLat）
      topLeft:  { lon: minLon, lat: maxLat },
      // 右下：东经（maxLon），南纬（minLat）
      bottomRight: { lon: maxLon, lat: minLat },
    };
  }

  /** 把 lon/lat 编码成带 SRID(4326) 的 EWKB(HEX) POINT
   *  结构（小端）：1字节byteOrder + 4字节type(0x20000001) + 4字节SRID + 8字节X(lon) + 8字节Y(lat)
   */
  const pointToEwkbHex = (lon: number, lat: number, srid = 4326): string => {
    const buf = new ArrayBuffer(1 + 4 + 4 + 8 + 8);
    const view = new DataView(buf);
    let off = 0;
    view.setUint8(off, 1); off += 1;                 // 1: little-endian
    view.setUint32(off, 0x20000001, true); off += 4; // POINT + SRID flag
    view.setUint32(off, srid, true); off += 4;       // SRID=4326
    view.setFloat64(off, lon, true); off += 8;       // X = lon
    view.setFloat64(off, lat, true);                 // Y = lat
    const bytes = new Uint8Array(buf);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }


  const [minP, maxP] = useMemo(() => {
    if (Array.isArray(powerRange) && powerRange.length === 2) {
      const a = Number(powerRange[0]);
      const b = Number(powerRange[1]);
      if (Number.isFinite(a) && Number.isFinite(b)) return [a, b];
    }
    return [20, 200];
  }, [powerRange]);
  const displayedMarkers = useMemo(() => {
    return markers.filter(m => {
      // 按power rating过滤
      const rating = m?.popupInfo?.power_rating;
      if (typeof rating !== 'number' || !Number.isFinite(rating)) return false;
      const inPowerRange = rating >= minP && rating <= maxP;      
      if (!inPowerRange) return false;
      
      // 按照接口类型过滤
      if (connectorTypes.length === 0) return true;
      console.log(m, 'm')
      const markerTypes = m.popupInfo.type
        .split(/[,&/]/)
        .map(t => t.trim());

      return markerTypes.some(t => connectorTypes.includes(t));
    });
  }, [markers, connectorTypes, minP, maxP]);
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
  // 编辑矩形后也能随时更新
  const _onEdited = (e: any) => {
    e.layers.eachLayer((layer: any) => {
      const feature = layer.toGeoJSON() as GeoJSON.Feature<GeoJSON.Polygon, GeoJSON.GeoJsonProperties>;
      setRegionGeoJson(feature.geometry);
    });
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
        const SEP = /[,&/]/;

        const types = Array.from(new Set(
          pts.flatMap(p =>
            String(p?.popupInfo?.type ?? '')
              .split(SEP)
              .map(t => t.trim())
              .filter(Boolean)
          )
        )).sort();
        // console.log(types, 'types')
        const powers = pts.map(p => p?.popupInfo?.power_rating).filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
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

  // request data when isCustomRegionEnabled = true
  useEffect(() => {
    if (!(isCustomRegionEnabled && regionGeoJson && timePoint && currentLocationId)) {
      return;
    }

    setLoading(true);
    setError(null);

    async function fetchCustomRegionMarkers() {
      try {
        // 与非自定义一致的时间格式化方式
        const isoTime = new Date(timePoint.replace(' ', 'T'))
          .toISOString()
          .slice(0, 19) + 'Z';

        // 取矩形左上/右下角
        const { topLeft, bottomRight } = getRectCornersFromPolygon(regionGeoJson as GeoJSON.Polygon);

        // 组装 EWKB HEX（POINT，带 SRID=4326）
        const location1 = pointToEwkbHex(topLeft.lon, topLeft.lat);           // 左上
        const location2 = pointToEwkbHex(bottomRight.lon, bottomRight.lat);   // 右下

        // 调用后端 /map/cus_map
        const res = await getMapMarkersByRect(currentLocationId, isoTime, location1, location2);
        console.log(res, '/map/cus_map')

        // 兼容两种 data 格式：数组 或 { [datetime]: EVMarker[] }
        let pts: EVMarker[] = Array.isArray((res as any)?.data)
          ? ((res as any).data as EVMarker[])
          : ((res?.data?.[isoTime] as EVMarker[]) ?? []);

        setMarkers(pts);

        // 更新右侧筛选：可用的 connector types
        const SEP = /[,&/]/;
        const types = Array.from(new Set(
          pts.flatMap(p =>
            String(p?.popupInfo?.type ?? '')
              .split(SEP)
              .map(t => t.trim())
              .filter(Boolean)
          )
        )).sort();

        dispatch(setAvailableConnectorTypes(types));
        // 若后端已返回功率的最小/最大值，也可在此更新 setPowerLimits
        // dispatch(setPowerLimits([minPower, maxPower]));
      } catch (err) {
        console.error('Failed to load custom region data', err);
        setError('Failed to load region data, please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchCustomRegionMarkers();
  }, [isCustomRegionEnabled, regionGeoJson, timePoint, currentLocationId, dispatch]);


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
              onEdited={_onEdited}
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
          const { lat, lon, popupInfo } = marker;
          const rating = popupInfo.power_rating;
          const radius = rating <= 80 ? 8 : rating <= 150 ? 12 : 16;
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
            const { lat, lon, popupInfo } = marker;
            // size of png 
            const iconWidth = 30;
            const iconHeight = 30;
            const rating = popupInfo.power_rating;
            const radius = rating <= 80 ? 8 : rating <= 150 ? 12 : 16;

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
                    <span className='popItem'>Power Rating:</span> {popupInfo.power_rating} kW <br />
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
            <div className='legend-kw'>
              <div className='kw-detail kw-detail-high'>
                high power
              </div>
              <div className='kw-detail kw-detail-mid'>
                mid power
              </div>
              <div className='kw-detail kw-detail-low'>
                low power
              </div>
            </div>
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
              <div className='status-detail Occupied'>
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
