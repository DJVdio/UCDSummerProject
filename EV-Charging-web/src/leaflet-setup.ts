// src/leaflet-setup.ts
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

(window as any).L = L;              // 供 UMD 插件扩展

// 先样式，再脚本
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';      // 会给 window.L 挂 MarkerClusterGroup

import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';               // 同理依赖 window.L
