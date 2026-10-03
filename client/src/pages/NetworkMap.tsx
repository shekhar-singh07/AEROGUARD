import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import {
  MapPin,
  Search,
  Activity,
  ExternalLink,
  X,
  Compass
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { TrustScoreGauge } from '../components/TrustScoreGauge';

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export const NetworkMap: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState<any[]>([]);
  const [filteredStations, setFilteredStations] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<any | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [anomalyLayer, setAnomalyLayer] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([22.5937, 78.9629]);
  const [mapZoom, setMapZoom] = useState(5);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    try {
      setLoading(true);
      const res = await api.getNetworkMap();
      if (res.success) {
        setStations(res.stations || []);
        setFilteredStations(res.stations || []);
      }
    } catch (err) {
      console.error('Failed to load map data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...stations];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.station_id.toLowerCase().includes(q) ||
        s.station_name.toLowerCase().includes(q) ||
        s.state.toLowerCase().includes(q) ||
        s.district.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'ALL') {
      result = result.filter(s => s.station_status === statusFilter);
    }

    if (anomalyLayer === 'ANOMALIES_ONLY') {
      result = result.filter(s => s.active_anomaly_type !== 'NONE');
    } else if (anomalyLayer === 'WEATHER_EVENTS') {
      result = result.filter(s => s.active_anomaly_type === 'WEATHER_EVENT');
    } else if (anomalyLayer === 'SENSOR_FAULTS') {
      result = result.filter(s => s.active_anomaly_type !== 'NONE' && s.active_anomaly_type !== 'WEATHER_EVENT');
    }

    setFilteredStations(result);
  }, [searchQuery, statusFilter, anomalyLayer, stations]);

  const handleStationClick = (st: any) => {
    setSelectedStation(st);
    setMapCenter([st.latitude, st.longitude]);
    setMapZoom(8);
  };

  const getMarkerColor = (st: any) => {
    if (st.station_status === 'OFFLINE') return '#94A3B8'; // slate
    if (st.active_anomaly_type === 'WEATHER_EVENT') return '#0284C7'; // sky
    if (st.anomaly_severity === 'CRITICAL' || st.station_status === 'CRITICAL') return '#DC2626'; // red
    if (st.anomaly_severity === 'HIGH' || st.station_status === 'WARNING') return '#EA580C'; // orange
    return '#10B981'; // emerald
  };

  return (
    <div className="relative h-[calc(100vh-4.25rem)] w-full flex overflow-hidden">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-3 bg-white/95 backdrop-blur-md border border-slate-200 p-2.5 rounded-xl shadow-lg max-w-2xl">
        <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
          <MapPin className="w-4 h-4 text-teal-600" />
          <span className="text-xs font-bold text-slate-800">AWS SPATIAL INTELLIGENCE</span>
          <span className="text-[11px] text-slate-400 font-mono">({filteredStations.length} / {stations.length})</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter stations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-44 bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-teal-500 font-sans"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          <option value="ONLINE">Online (1,173)</option>
          <option value="OFFLINE">Offline (75)</option>
          <option value="WARNING">Warning</option>
          <option value="CRITICAL">Critical</option>
        </select>

        {/* Layer Selector */}
        <select
          value={anomalyLayer}
          onChange={(e) => setAnomalyLayer(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer"
        >
          <option value="ALL">All Layers</option>
          <option value="ANOMALIES_ONLY">Active Anomalies</option>
          <option value="WEATHER_EVENTS">Genuine Weather Events</option>
          <option value="SENSOR_FAULTS">Probable Sensor Faults</option>
        </select>

        {/* Reset view */}
        <button
          onClick={() => {
            setMapCenter([22.5937, 78.9629]);
            setMapZoom(5);
            setSelectedStation(null);
            setSearchQuery('');
            setStatusFilter('ALL');
            setAnomalyLayer('ALL');
          }}
          className="p-1.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 text-xs transition-colors"
          title="Reset Map Bounds"
        >
          <Compass className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Full-screen Leaflet Map */}
      <div className="flex-1 h-full w-full bg-[#E2E8F0] relative">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <ChangeView center={mapCenter} zoom={mapZoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {filteredStations.map((st) => (
            <CircleMarker
              key={st.station_id}
              center={[st.latitude, st.longitude]}
              radius={st.active_anomaly_type !== 'NONE' ? 7 : (selectedStation?.station_id === st.station_id ? 9 : 4.5)}
              eventHandlers={{
                click: () => handleStationClick(st)
              }}
              pathOptions={{
                color: getMarkerColor(st),
                fillColor: getMarkerColor(st),
                fillOpacity: selectedStation?.station_id === st.station_id ? 1.0 : 0.85,
                weight: selectedStation?.station_id === st.station_id ? 3 : 1.5
              }}
            >
              <Popup>
                <div className="text-xs space-y-1.5 p-1 min-w-[190px]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-teal-700">{st.station_id}</span>
                    <StatusBadge status={st.station_status} size="sm" />
                  </div>
                  <div className="font-semibold text-slate-800">{st.station_name}</div>
                  <div className="text-slate-500">{st.district}, {st.state}</div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[11px]">
                    <span className="text-slate-500">Trust Score:</span>
                    <span className="font-mono font-bold text-emerald-600">{st.trust_score}/100</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Sensor Health:</span>
                    <span className="font-mono font-bold text-slate-700">{st.sensor_health}%</span>
                  </div>

                  {st.active_anomaly_type !== 'NONE' && (
                    <div className="pt-1.5">
                      <StatusBadge status={st.active_anomaly_type} type="anomaly_type" size="sm" />
                    </div>
                  )}

                  <button
                    onClick={() => navigate(`/stations/${st.station_id}`)}
                    className="w-full mt-2 py-1.5 px-3 rounded bg-teal-600 hover:bg-teal-700 text-white font-mono text-xs font-semibold tracking-wider transition-colors shadow-2xs"
                  >
                    OPEN STATION
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Right Drawer: Station Intelligence Inspector */}
      {selectedStation && (
        <div className="absolute top-4 right-4 z-20 w-84 bg-white/95 backdrop-blur-md border border-slate-200 p-5 rounded-2xl shadow-xl space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-xs font-bold text-teal-700">{selectedStation.station_id}</span>
              <h3 className="text-sm font-bold text-slate-800 mt-0.5">{selectedStation.station_name}</h3>
              <p className="text-xs text-slate-500">{selectedStation.district}, {selectedStation.state}</p>
            </div>
            <button
              onClick={() => setSelectedStation(null)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={selectedStation.station_status} />
            {selectedStation.active_anomaly_type !== 'NONE' && (
              <StatusBadge status={selectedStation.active_anomaly_type} type="anomaly_type" />
            )}
          </div>

          {/* Trust Score Radial */}
          <div className="flex items-center justify-center py-1">
            <TrustScoreGauge score={selectedStation.trust_score || 95} size={110} />
          </div>

          {/* Coordinates and Health Metrics */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Coordinates:</span>
              <span className="text-slate-700">{selectedStation.latitude}°N, {selectedStation.longitude}°E</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Sensor Reliability:</span>
              <span className="text-emerald-700 font-bold">{selectedStation.sensor_health}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Last Telemetry:</span>
              <span className="text-slate-700">{selectedStation.last_seen}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => navigate(`/stations/${selectedStation.station_id}`)}
              className="w-full py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-2xs"
            >
              <span>OPEN STATION INTELLIGENCE</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => navigate(`/simulation-lab?station=${selectedStation.station_id}`)}
              className="w-full py-2 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              <span>Simulate Fault On Station</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
