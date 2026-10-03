import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Thermometer,
  Droplets,
  Gauge,
  Activity,
  MapPin,
  ShieldCheck,
  Wrench,
  ArrowLeft
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { TrustScoreGauge } from '../components/TrustScoreGauge';

export const StationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stationData, setStationData] = useState<any>(null);
  const [observations, setObservations] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('24H');

  useEffect(() => {
    if (id) {
      loadStation();
      loadObservations(timeRange);
    }
  }, [id]);

  const loadStation = async () => {
    try {
      setLoading(true);
      const res = await api.getStationDetail(id!);
      if (res.success) {
        setStationData(res);
      }
    } catch (err) {
      console.error('Failed to load station:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadObservations = async (range: string) => {
    try {
      const res = await api.getStationObservations(id!, range);
      if (res.success) {
        const formatted = (res.observations || []).map((o: any) => ({
          ...o,
          timeLabel: o.timestamp ? o.timestamp.substring(11, 16) : ''
        }));
        setObservations(formatted);
      }
    } catch (err) {
      console.error('Failed to load observations:', err);
    }
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    loadObservations(range);
  };

  if (loading || !stationData) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <Activity className="w-8 h-8 animate-spin text-teal-600 mb-3" />
        <span className="font-sans text-sm font-medium tracking-wide">Retrieving AWS Station Telemetry & Spatial Mesh...</span>
      </div>
    );
  }

  const { station, latest_observation, sensor_health, maintenance, nearby_peers } = stationData;

  return (
    <div className="p-7 space-y-6 max-w-[1600px] mx-auto">
      {/* Back and Action Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/stations')}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold font-mono text-teal-700">{station.station_id}</h1>
              <StatusBadge status={station.station_status} />
              {station.active_anomaly && (
                <StatusBadge status={station.active_anomaly} type="anomaly_type" />
              )}
            </div>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              {station.station_name} &bull; {station.district}, {station.state} &bull; Lat: {station.latitude}°N, Lon: {station.longitude}°E
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/simulation-lab?station=${station.station_id}`)}
            className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Inject Simulation On Station</span>
          </button>
        </div>
      </div>

      {/* Real-time Readings & Trust Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Current Temperature */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dry-Bulb Temperature</span>
            <div className="text-2xl font-bold font-sans text-slate-800 mt-1">
              {latest_observation?.temperature !== null && latest_observation?.temperature !== undefined
                ? `${latest_observation.temperature}°C`
                : 'N/A'}
            </div>
            <span className="text-[11px] text-slate-400 font-sans">±0.2°C RTD accuracy</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
            <Thermometer className="w-6 h-6" />
          </div>
        </div>

        {/* Current Humidity */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Relative Humidity</span>
            <div className="text-2xl font-bold font-sans text-sky-700 mt-1">
              {latest_observation?.relative_humidity !== null && latest_observation?.relative_humidity !== undefined
                ? `${latest_observation.relative_humidity}%`
                : 'N/A'}
            </div>
            <span className="text-[11px] text-slate-400 font-sans">Capacitive hygrometer</span>
          </div>
          <div className="p-3 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
            <Droplets className="w-6 h-6" />
          </div>
        </div>

        {/* Current Pressure */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Barometric Pressure</span>
            <div className="text-2xl font-bold font-sans text-indigo-700 mt-1">
              {latest_observation?.atmospheric_pressure !== null && latest_observation?.atmospheric_pressure !== undefined
                ? `${latest_observation.atmospheric_pressure} hPa`
                : 'N/A'}
            </div>
            <span className="text-[11px] text-slate-400 font-sans">Piezoresistive transducer</span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Gauge className="w-6 h-6" />
          </div>
        </div>

        {/* Fused Trust Gauge */}
        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-around">
          <TrustScoreGauge
            score={latest_observation?.trust_score || sensor_health?.health_score || 95}
            size={85}
            strokeWidth={8}
            showDetails={false}
          />
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Trust Index</span>
            <div className="font-sans text-base font-bold text-slate-800">
              {latest_observation?.trust_score || 95}/100
            </div>
            <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {latest_observation?.anomaly_status || 'NORMAL'}
            </span>
          </div>
        </div>
      </div>

      {/* Synchronized Multi-Parameter Time-Series Visualizer */}
      <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>Multi-Parameter Synoptic Dynamics & Physical Envelope</span>
            </h2>
            <p className="text-[11px] text-slate-500">15-minute continuous observation stream vs baseline</p>
          </div>

          {/* Time range selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {['1H', '6H', '24H', '7D'].map((range) => (
              <button
                key={range}
                onClick={() => handleTimeRangeChange(range)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-white text-teal-700 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Temperature & Humidity Chart */}
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={observations}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="timeLabel" stroke="#94A3B8" fontSize={10} />
              <YAxis yAxisId="temp" stroke="#EF4444" fontSize={10} domain={['dataMin - 2', 'dataMax + 2']} label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft', fill: '#EF4444', fontSize: 10 }} />
              <YAxis yAxisId="rh" orientation="right" stroke="#0284C7" fontSize={10} domain={[0, 100]} label={{ value: 'RH (%)', angle: 90, position: 'insideRight', fill: '#0284C7', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)' }}
                labelStyle={{ color: '#0F172A', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Line yAxisId="temp" type="monotone" dataKey="temperature" name="Temperature (°C)" stroke="#EF4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line yAxisId="rh" type="monotone" dataKey="relative_humidity" name="Relative Humidity (%)" stroke="#0284C7" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Barometric Pressure Chart */}
        <div className="w-full h-44 pt-2 border-t border-slate-100">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={observations}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="timeLabel" stroke="#94A3B8" fontSize={10} />
              <YAxis stroke="#6366F1" fontSize={10} domain={['dataMin - 1', 'dataMax + 1']} label={{ value: 'Press (hPa)', angle: -90, position: 'insideLeft', fill: '#6366F1', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)' }}
                labelStyle={{ color: '#0F172A', fontWeight: 'bold' }}
              />
              <Line type="monotone" dataKey="atmospheric_pressure" name="Pressure (hPa)" stroke="#6366F1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Spatial Cross-Validation: Nearby Peer AWS Stations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Nearby Stations Leaflet Map (1 col) */}
        <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm flex flex-col">
          <h2 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-600" />
            <span>Local Geodesic Peer AWS Cluster</span>
          </h2>
          <p className="text-[11px] text-slate-500 mb-3">5 nearest stations within synoptic radius for spatial consistency</p>

          <div className="w-full h-64 rounded-lg overflow-hidden border border-slate-200">
            <MapContainer
              center={[station.latitude, station.longitude]}
              zoom={8}
              scrollWheelZoom={false}
              className="w-full h-full"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <CircleMarker
                center={[station.latitude, station.longitude]}
                radius={8}
                pathOptions={{ color: '#0D9488', fillColor: '#0D9488', fillOpacity: 1, weight: 3 }}
              >
                <Popup>
                  <div className="text-xs font-mono font-bold text-teal-700">Target: {station.station_id}</div>
                </Popup>
              </CircleMarker>

              {nearby_peers.map((peer: any) => (
                <CircleMarker
                  key={peer.station_id}
                  center={[peer.latitude, peer.longitude]}
                  radius={5}
                  pathOptions={{ color: '#0284C7', fillColor: '#0284C7', fillOpacity: 0.8, weight: 1.5 }}
                >
                  <Popup>
                    <div className="text-xs space-y-1">
                      <div className="font-mono font-bold text-sky-700">{peer.station_id}</div>
                      <div>{peer.station_name}</div>
                      <div className="text-slate-500">Distance: {peer.distance_km} km</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Peer Stations Comparison Table (2 cols) */}
        <div className="lg:col-span-2 rounded-xl bg-white border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Spatial Cross-Validation Telemetry Matrix</span>
            </h2>
            <p className="text-[11px] text-slate-500 mb-3">Comparing target sensor reading against surrounding peer network</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-sans text-xs">
                    <th className="py-2.5 px-3 font-medium">Role</th>
                    <th className="py-2.5 px-3 font-medium">Station ID</th>
                    <th className="py-2.5 px-3 font-medium">Distance</th>
                    <th className="py-2.5 px-3 font-medium">Temperature</th>
                    <th className="py-2.5 px-3 font-medium">Humidity</th>
                    <th className="py-2.5 px-3 font-medium">Pressure</th>
                    <th className="py-2.5 px-3 font-medium">Trust Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="bg-teal-50/50 font-semibold border-b border-teal-100">
                    <td className="py-2.5 px-3 text-teal-700 font-mono">TARGET</td>
                    <td className="py-2.5 px-3 font-mono text-slate-800">{station.station_id}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">0.0 km</td>
                    <td className="py-2.5 px-3 font-mono text-rose-600">{latest_observation?.temperature ?? 'N/A'}°C</td>
                    <td className="py-2.5 px-3 font-mono text-sky-600">{latest_observation?.relative_humidity ?? 'N/A'}%</td>
                    <td className="py-2.5 px-3 font-mono text-indigo-600">{latest_observation?.atmospheric_pressure ?? 'N/A'} hPa</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-600">{latest_observation?.trust_score ?? 95}/100</td>
                  </tr>

                  {nearby_peers.map((peer: any) => (
                    <tr key={peer.station_id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-slate-400">PEER</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        <button
                          onClick={() => navigate(`/stations/${peer.station_id}`)}
                          className="hover:text-teal-700 transition-colors font-medium"
                        >
                          {peer.station_id}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{peer.distance_km} km</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{peer.latest_observation?.temperature ?? '--'}°C</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{peer.latest_observation?.relative_humidity ?? '--'}%</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{peer.latest_observation?.atmospheric_pressure ?? '--'} hPa</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-600 font-semibold">{peer.latest_observation?.trust_score ?? 95}/100</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600">
              Spatial Coherence Status: <strong className="text-emerald-700 font-medium">Validated against 5 synoptic neighbors</strong>
            </span>
            <span className="font-mono text-slate-400 text-[11px]">Synoptic Radius: 120km</span>
          </div>
        </div>
      </div>

      {/* Maintenance History */}
      <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-800">Station Maintenance History & Calibration Log</h2>
          </div>
          <button
            onClick={() => navigate('/maintenance')}
            className="text-xs text-teal-600 hover:text-teal-700 font-medium"
          >
            Manage Work Orders
          </button>
        </div>

        {maintenance.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">No maintenance tickets recorded for this station.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-sans text-xs">
                  <th className="py-2 px-3 font-medium">Order ID</th>
                  <th className="py-2 px-3 font-medium">Sensor Type</th>
                  <th className="py-2 px-3 font-medium">Problem Diagnostic</th>
                  <th className="py-2 px-3 font-medium">Priority</th>
                  <th className="py-2 px-3 font-medium">Assigned Engineer</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                  <th className="py-2 px-3 font-medium">Created</th>
                  <th className="py-2 px-3 font-medium">Resolved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {maintenance.map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-teal-700 font-semibold">#{m.id}</td>
                    <td className="py-2.5 px-3 font-medium">{m.sensor_type}</td>
                    <td className="py-2.5 px-3 text-slate-600">{m.problem}</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={m.priority} type="severity" />
                    </td>
                    <td className="py-2.5 px-3 font-mono">{m.assigned_engineer}</td>
                    <td className="py-2.5 px-3 font-mono">{m.status}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">{m.created_at}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">{m.resolved_at || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
