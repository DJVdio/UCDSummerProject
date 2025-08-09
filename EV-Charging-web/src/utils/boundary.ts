// utils/boundary.ts
export type BBox = { minLat: number; maxLat: number; minLon: number; maxLon: number };

export const geoJsonToBBox = (geom: GeoJSON.Polygon | GeoJSON.MultiPolygon): BBox => {
  const acc: BBox = { minLat: Infinity, maxLat: -Infinity, minLon: Infinity, maxLon: -Infinity };
  const push = (lon: number, lat: number) => {
    acc.minLat = Math.min(acc.minLat, lat);
    acc.maxLat = Math.max(acc.maxLat, lat);
    acc.minLon = Math.min(acc.minLon, lon);
    acc.maxLon = Math.max(acc.maxLon, lon);
  };
  if (geom.type === 'Polygon') {
    for (const ring of geom.coordinates) for (const [lon, lat] of ring) push(lon, lat);
  } else {
    for (const poly of geom.coordinates) for (const ring of poly) for (const [lon, lat] of ring) push(lon, lat);
  }
  return acc;
};

export const isBBoxInside = (inner: BBox, outer: BBox) =>
  inner.minLat >= outer.minLat && inner.maxLat <= outer.maxLat &&
  inner.minLon >= outer.minLon && inner.maxLon <= outer.maxLon;

// —— 简易哈弗辛（km）
export const haversineKm = (a: [number, number], b: [number, number]) => {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]), lat2 = toRad(b[0]);
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// —— 兜底的“城市圆”半径（按需补全）
export const CITY_RADIUS_KM: Record<string, number> = {
  Dublin: 20, Cork: 15, Limerick: 12, Galway: 12, // 示例
};

// —— Nominatim 拉城市边界 + 缓存
// 注意：遵守使用规范：提供有效 Referer/UA、限速等（浏览器默认会带 UA/Referer）。:contentReference[oaicite:1]{index=1}
export async function fetchCityBoundaryGeoJSON(city: string, countryCodes = 'ie') {
  const cacheKey = `city-boundary:${city}:${countryCodes}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try { return JSON.parse(cached) as { geom: GeoJSON.Geometry, bbox: BBox }; } catch {}
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&polygon_geojson=1&city=${encodeURIComponent(city)}&countrycodes=${countryCodes}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' }});
  if (!res.ok) return null;
  const arr = await res.json();
  const place = arr?.[0];
  const geom = place?.geojson as GeoJSON.Polygon | GeoJSON.MultiPolygon | undefined;
  if (!geom) return null;

  const bbox = geoJsonToBBox(geom);
  const payload = { geom, bbox };
  localStorage.setItem(cacheKey, JSON.stringify(payload));
  return payload;
}
