import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, AlertTriangle, ShieldCheck, Wrench, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

export const SensorHealth: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [degradingSensors, setDegradingSensors] = useState<any[]>([]);
  const [faultFrequency, setFaultFrequency] = useState<any[]>([]);

  useEffect(() => {
    loadSensorHealth();
  }, []);

  const loadSensorHealth = async () => {
    try {
      setLoading(true);
      const res = await api.getSensorHealth();
      if (res.success) {
        setSummary(res.summary);
        setDegradingSensors(res.degrading_sensors || []);
        setFaultFrequency(res.fault_frequency || []);
      }
    } catch (err) {
      console.error('Failed to load sensor health:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !summary) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <Activity className="w-8 h-8 animate-spin text-teal-600 mb-3" />
        <span className="font-sans text-sm font-medium tracking-wide">Synthesizing Network Sensor Reliability Matrices...</span>
      </div>
    );
  }

  const distributionData = [
    { name: 'Healthy', count: summary.healthy, color: '#10B981' },
    { name: 'Watch', count: summary.watch, color: '#0284C7' },
    { name: 'Degrading', count: summary.degrading, color: '#EA580C' },
    { name: 'Critical', count: summary.critical, color: '#DC2626' }
  ];

  return (
    <div className="p-7 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Banner and Navigation */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-teal-600" />
            <span>AWS Network Sensor Health & Degradation Matrix</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous sensor degradation monitoring, mean-time-between-faults (MTBF) tracking, and predictive maintenance triage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/maintenance')}
            className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Open Maintenance Center</span>
          </button>
        </div>
      </div>

      {/* Health Distribution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Healthy Sensors</span>
          <div className="text-2xl font-bold font-sans text-slate-800 mt-1">{summary.healthy}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">90% - 100% Reliability Index</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500"></div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Watch List</span>
          <div className="text-2xl font-bold font-sans text-slate-800 mt-1">{summary.watch}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">75% - 89% Minor Variance</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Degrading Sensors</span>
          <div className="text-2xl font-bold font-sans text-amber-600 mt-1">{summary.degrading}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">40% - 74% Continuous Drift</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500"></div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Critical Transducers</span>
          <div className="text-2xl font-bold font-sans text-rose-600 mt-1">{summary.critical}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">&lt;40% Urgent Replacement</span>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sensor Health Distribution Chart */}
        <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>National Sensor Health Distribution</span>
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">Total sensor count classified across reliability envelopes</p>

          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fault Frequency by Anomaly Type */}
        <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Fault Frequency by Failure Mode</span>
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">Breakdown of recurrent hardware and telemetry failures</p>

          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={faultFrequency}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="anomaly_type" stroke="#94A3B8" fontSize={10} />
                <YAxis stroke="#94A3B8" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)' }}
                />
                <Bar dataKey="count" fill="#0D9488" radius={[4, 4, 0, 0]} name="Total Incidents" />
                <Bar dataKey="critical_count" fill="#EF4444" radius={[4, 4, 0, 0]} name="Critical Severity" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Degrading Sensors Priority Table */}
      <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-rose-500" />
              <span>Sensors Requiring Maintenance Attention</span>
            </h2>
            <p className="text-[11px] text-slate-500">Ranked by lowest health index and recurring anomaly counts</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-sans text-xs">
                <th className="py-3 px-4 font-medium">Station ID</th>
                <th className="py-3 px-4 font-medium">Station Name</th>
                <th className="py-3 px-4 font-medium">State</th>
                <th className="py-3 px-4 font-medium">Health Score</th>
                <th className="py-3 px-4 font-medium">Health Status</th>
                <th className="py-3 px-4 font-medium">Fault Count</th>
                <th className="py-3 px-4 font-medium">Maintenance Priority</th>
                <th className="py-3 px-4 font-medium">Last Fault</th>
                <th className="py-3 px-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {degradingSensors.map((s) => (
                <tr key={s.station_id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-teal-700">{s.station_id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{s.station_name}</td>
                  <td className="py-3 px-4 text-slate-500">{s.state}</td>
                  <td className="py-3 px-4 font-mono font-bold" style={{ color: s.health_score < 40 ? '#DC2626' : s.health_score < 75 ? '#EA580C' : '#10B981' }}>
                    {s.health_score}%
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      s.health_status === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      s.health_status === 'DEGRADING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-sky-50 text-sky-700 border border-sky-200'
                    }`}>
                      {s.health_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-700">{s.fault_count}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={s.maintenance_priority} type="severity" />
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs">{s.last_fault || '--'}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/maintenance?station=${s.station_id}`)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-teal-700 text-xs font-medium transition-colors"
                      >
                        Schedule
                      </button>
                      <button
                        onClick={() => navigate(`/stations/${s.station_id}`)}
                        className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-medium transition-colors"
                      >
                        View
                      </button>
                    </div>
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
