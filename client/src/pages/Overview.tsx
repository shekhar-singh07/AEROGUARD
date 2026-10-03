import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  MapPin,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { api } from '../services/api';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { TrustScoreGauge } from '../components/TrustScoreGauge';

export const Overview: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<any>(null);
  const [hourlyTrend, setHourlyTrend] = useState<any[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [mapStations, setMapStations] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const dashData = await api.getDashboard();
      if (dashData.success) {
        setKpis(dashData.kpis);
        setHourlyTrend(dashData.hourly_trend || []);
        setRecentAlerts(dashData.recent_alerts || []);
      }

      const mapData = await api.getNetworkMap();
      if (mapData.success) {
        setMapStations(mapData.stations || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMarkerColor = (st: any) => {
    if (st.station_status === 'OFFLINE') return '#94A3B8'; // slate
    if (st.active_anomaly_type === 'WEATHER_EVENT') return '#0284C7'; // sky
    if (st.anomaly_severity === 'CRITICAL' || st.station_status === 'CRITICAL') return '#DC2626'; // red
    if (st.anomaly_severity === 'HIGH' || st.station_status === 'WARNING') return '#EA580C'; // orange
    return '#10B981'; // emerald
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <Activity className="w-8 h-8 animate-spin text-teal-600 mb-3" />
        <span className="font-sans text-sm font-medium tracking-wide">Synthesizing AWS Synoptic Telemetry...</span>
      </div>
    );
  }

  return (
    <div className="p-7 space-y-7 max-w-[1600px] mx-auto">
      {/* KPI Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3.5">
        <MetricCard
          title="Total AWS"
          value={kpis?.total_stations || 1248}
          subtitle="All Regional Units"
          icon={<Radio className="w-4 h-4 text-slate-600" />}
          onClick={() => navigate('/stations')}
        />
        <MetricCard
          title="Online"
          value={kpis?.online_stations || 1173}
          subtitle="94.0% Synoptic SLA"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          statusColor="#10B981"
          onClick={() => navigate('/stations?status=ONLINE')}
        />
        <MetricCard
          title="Offline"
          value={kpis?.offline_stations || 75}
          subtitle="Dropouts / Comm Loss"
          icon={<XCircle className="w-4 h-4 text-slate-400" />}
          statusColor="#94A3B8"
          onClick={() => navigate('/stations?status=OFFLINE')}
        />
        <MetricCard
          title="Observations"
          value={(kpis?.observations_processed || 118983).toLocaleString()}
          subtitle="15-min cadence"
          icon={<Activity className="w-4 h-4 text-teal-600" />}
        />
        <MetricCard
          title="Active Anomalies"
          value={kpis?.active_anomalies || 25}
          subtitle="Flagged by Engine"
          icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
          statusColor="#F59E0B"
          onClick={() => navigate('/alerts')}
        />
        <MetricCard
          title="Critical Alerts"
          value={kpis?.critical_alerts || 11}
          subtitle="Immediate Action"
          icon={<AlertOctagon className="w-4 h-4 text-rose-500" />}
          statusColor="#EF4444"
          onClick={() => navigate('/alerts?severity=CRITICAL')}
        />
        <MetricCard
          title="Avg Trust Score"
          value={`${kpis?.average_trust_score || 95.2}/100`}
          subtitle="Multi-signal fused"
          icon={<ShieldAlert className="w-4 h-4 text-teal-600" />}
          statusColor="#0D9488"
        />
        <MetricCard
          title="Sensors At Risk"
          value={kpis?.sensors_requiring_attention || 100}
          subtitle="Degrading / Drift"
          icon={<Cpu className="w-4 h-4 text-orange-500" />}
          statusColor="#EA580C"
          onClick={() => navigate('/sensor-health')}
        />
      </div>

      {/* Main Grid: Interactive Map Preview & Anomaly Hourly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Preview (2 cols) */}
        <div className="lg:col-span-2 rounded-xl bg-white border border-slate-200 p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-semibold text-slate-800">
                National AWS Spatial Health & Active Anomaly Distribution
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Normal</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-500"></span>Weather Front</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Warning</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span>Fault</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400"></span>Offline</span>
            </div>
          </div>

          <div className="w-full h-[400px] rounded-lg overflow-hidden border border-slate-200 relative z-10 shadow-inner">
            <MapContainer
              center={[22.5937, 78.9629]}
              zoom={5}
              scrollWheelZoom={true}
              className="w-full h-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {mapStations.slice(0, 400).map((st) => (
                <CircleMarker
                  key={st.station_id}
                  center={[st.latitude, st.longitude]}
                  radius={st.active_anomaly_type !== 'NONE' ? 6 : 4}
                  pathOptions={{
                    color: getMarkerColor(st),
                    fillColor: getMarkerColor(st),
                    fillOpacity: 0.85,
                    weight: 1.5
                  }}
                >
                  <Popup>
                    <div className="text-xs space-y-1 p-1">
                      <div className="font-mono font-bold text-teal-700">{st.station_id}</div>
                      <div className="font-semibold text-slate-800">{st.station_name}</div>
                      <div className="text-slate-500">{st.district}, {st.state}</div>
                      <div className="flex justify-between gap-3 pt-1 border-t border-slate-100">
                        <span>Trust Score:</span>
                        <span className="font-mono font-bold text-emerald-600">{st.trust_score}/100</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Health:</span>
                        <span className="font-mono">{st.sensor_health}%</span>
                      </div>
                      <button
                        onClick={() => navigate(`/stations/${st.station_id}`)}
                        className="w-full mt-2 py-1 px-2 text-center rounded bg-teal-600 hover:bg-teal-700 text-white font-mono text-[11px] font-semibold transition-colors"
                      >
                        OPEN STATION
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Displaying 1,248 synoptic automatic weather stations across 17 regional groups.</span>
            <button
              onClick={() => navigate('/network-map')}
              className="text-teal-600 hover:text-teal-700 flex items-center gap-1 font-medium"
            >
              <span>Explore full-screen map</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right Column: Trust Summary & 24h Hourly Trend */}
        <div className="space-y-6 flex flex-col justify-between">
          {/* Trust Score Radial Overview */}
          <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-teal-600" />
              <span>Network Observation Trust Index</span>
            </h2>
            <div className="flex items-center justify-center py-2">
              <TrustScoreGauge score={kpis?.average_trust_score || 95.2} size={130} />
            </div>
            <div className="mt-3 text-xs text-slate-500 space-y-1.5 border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <span>Highly Trusted (90-100):</span>
                <span className="font-mono text-emerald-600 font-semibold">1,162 stations</span>
              </div>
              <div className="flex justify-between">
                <span>Review Recommended (40-69):</span>
                <span className="font-mono text-amber-600 font-semibold">51 stations</span>
              </div>
              <div className="flex justify-between">
                <span>Low Trust / Quarantined (&lt;40):</span>
                <span className="font-mono text-rose-600 font-semibold">35 stations</span>
              </div>
            </div>
          </div>

          {/* Anomaly Trend Chart */}
          <div className="rounded-xl bg-white border border-slate-200 p-5 flex-1 flex flex-col shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <span>Anomaly Pulse Trend (Past 24 Hours)</span>
            </h2>
            <p className="text-[11px] text-slate-500 mb-3">Hourly frequency of detected anomalies across India AWS network</p>

            <div className="w-full h-36 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyTrend.length > 0 ? hourlyTrend : [
                  { hour: '00:00', count: 2 }, { hour: '04:00', count: 3 }, { hour: '08:00', count: 8 },
                  { hour: '12:00', count: 14 }, { hour: '16:00', count: 9 }, { hour: '20:00', count: 5 }
                ]}>
                  <defs>
                    <linearGradient id="anomGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0D9488" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="hour" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)' }}
                    labelStyle={{ color: '#0F172A', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#0D9488" strokeWidth={2} fillOpacity={1} fill="url(#anomGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Alerts Feed Table matching the reference screenshot */}
      <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-800">Active Alert Stream & Evidence Investigation</h2>
          </div>
          <button
            onClick={() => navigate('/alerts')}
            className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
          >
            <span>View all anomalies</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200/90 text-slate-400 font-sans text-xs">
                <th className="py-3 px-4 w-12 font-medium">#</th>
                <th className="py-3 px-4 font-medium">Work Details</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Priority</th>
                <th className="py-3 px-4 font-medium">Finding</th>
                <th className="py-3 px-4 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentAlerts.map((alert, index) => (
                <tr 
                  key={alert.id} 
                  onClick={() => navigate(`/alerts/${alert.id}`)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 text-xs text-slate-400 font-medium align-middle">
                    {index + 1}.
                  </td>
                  <td className="py-3.5 px-4 align-middle">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-teal-600 font-semibold font-mono text-xs">
                        {alert.station_id}
                      </span>
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-1.5 py-0.5 rounded">
                        {alert.anomaly_type === 'WEATHER_EVENT' ? 'Weather' : 'Sensor'}
                      </span>
                    </div>
                    <div className="text-slate-800 font-semibold text-xs group-hover:text-teal-700 transition-colors">
                      {alert.station_name}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      {alert.state}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-middle">
                    <span className="text-slate-700 text-xs font-medium">Resolved</span>
                  </td>
                  <td className="py-3.5 px-4 align-middle">
                    <StatusBadge status={alert.severity} type="severity" />
                  </td>
                  <td className="py-3.5 px-4 align-middle text-xs font-medium text-slate-700">
                    {alert.anomaly_type === 'WEATHER_EVENT' ? 'Genuine Weather' : 'Major Irregularity'}
                  </td>
                  <td className="py-3.5 px-4 align-middle text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/alerts/${alert.id}`);
                      }}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-teal-700 hover:bg-slate-50 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                    >
                      <span>Investigate</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

