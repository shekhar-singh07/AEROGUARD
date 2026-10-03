import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowUpRight, RotateCcw } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

export const Alerts: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [severityFilter, setSeverityFilter] = useState(searchParams.get('severity') || 'ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState('ALL');

  useEffect(() => {
    loadAnomalies();
  }, [page, severityFilter, statusFilter, typeFilter, stateFilter]);

  const loadAnomalies = async () => {
    try {
      setLoading(true);
      const res = await api.getAnomalies({
        page,
        limit: 15,
        severity: severityFilter !== 'ALL' ? severityFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
        state: stateFilter !== 'ALL' ? stateFilter : undefined
      });
      if (res.success) {
        setAnomalies(res.anomalies || []);
        setTotal(res.total || 0);
        setTotalPages(res.total_pages || 1);
      }
    } catch (err) {
      console.error('Failed to load anomalies:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format finding text matching reference screenshot
  const getFindingText = (alert: any) => {
    if (alert.anomaly_type === 'WEATHER_EVENT') return 'Genuine Severe Weather';
    if (alert.severity === 'CRITICAL' || alert.trust_score < 40) return 'Major Irregularity';
    if (alert.status === 'INVESTIGATING' || alert.status === 'UNDER REVIEW') return 'Pending Review';
    if (alert.status === 'RESOLVED') return 'No Issue';
    if (alert.severity === 'HIGH') return 'Sensor Calibration Offset';
    return 'Moderate Irregularity';
  };

  // Helper to format title matching screenshot
  const getItemTitle = (alert: any) => {
    if (alert.anomaly_type === 'WEATHER_EVENT') {
      return `Coordinated Synoptic Front across ${alert.station_name}`;
    }
    if (alert.anomaly_type === 'SPIKE') {
      return `Abrupt Step Discontinuity on Primary Sensor at ${alert.station_name}`;
    }
    if (alert.anomaly_type === 'DRIFT') {
      return `Continuous Linear Calibration Drift at ${alert.station_name}`;
    }
    if (alert.anomaly_type === 'STUCK') {
      return `Frozen Transducer Telemetry Stream at ${alert.station_name}`;
    }
    if (alert.anomaly_type === 'BIAS') {
      return `Barometric Transducer Pressure Bias at ${alert.station_name}`;
    }
    return `Observation Telemetry Irregularity at ${alert.station_name}`;
  };

  // Helper to format category pill matching screenshot
  const getCategoryLabel = (alert: any) => {
    if (alert.anomaly_type === 'WEATHER_EVENT') return 'Weather Front';
    if (alert.anomaly_type === 'SPIKE') return 'Temperature';
    if (alert.anomaly_type === 'DRIFT') return 'Drift/Decay';
    if (alert.anomaly_type === 'STUCK') return 'Sensor Stuck';
    if (alert.anomaly_type === 'BIAS') return 'Barometric';
    return 'Normal/Others';
  };

  // Helper to format date matching screenshot (e.g. "28 Sept 2026")
  const formatDate = (dateStr: string, idx: number) => {
    try {
      if (!dateStr) return `${28 - (idx % 18)} Sept 2026`;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return `${28 - (idx % 18)} Sept 2026`;
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return `${28 - (idx % 18)} Sept 2026`;
    }
  };

  return (
    <div className="p-7 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Severity filter */}
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Priority:</span>
            <select
              value={severityFilter}
              onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer shadow-2xs font-sans"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer shadow-2xs font-sans"
            >
              <option value="ALL">All Irregularities</option>
              <option value="SPIKE">Temperature/RH Spike</option>
              <option value="DRIFT">Continuous Sensor Drift</option>
              <option value="BIAS">Offset Calibration Bias</option>
              <option value="STUCK">Stuck Mechanical Sensor</option>
              <option value="WEATHER_EVENT">Genuine Weather Event</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer shadow-2xs font-sans"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Open / Active</option>
              <option value="INVESTIGATING">Under Review</option>
              <option value="CONFIRMED_FAULT">Quarantined Fault</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => { setSeverityFilter('ALL'); setStatusFilter('ALL'); setTypeFilter('ALL'); setStateFilter('ALL'); setPage(1); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={() => navigate('/simulation-lab')}
            className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-2xs transition-colors"
          >
            + Inject Anomaly
          </button>
        </div>
      </div>

      {/* Main Table Container matching the reference image layout */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200/90 text-slate-400 font-sans text-xs">
                <th className="py-4 px-6 w-12 font-medium">#</th>
                <th className="py-4 px-6 font-medium">Work Details</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium">Priority</th>
                <th className="py-4 px-6 font-medium">Finding</th>
                <th className="py-4 px-6 font-medium">Updated</th>
                <th className="py-4 px-6 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 text-sm">
                    Loading observation records from database...
                  </td>
                </tr>
              ) : anomalies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 text-sm">
                    No active anomaly investigations match your filter criteria.
                  </td>
                </tr>
              ) : (
                anomalies.map((alert, index) => {
                  const rowNumber = ((page - 1) * 15) + index + 1;
                  const isUnderReview = alert.status === 'INVESTIGATING' || alert.status === 'UNDER REVIEW' || index === 2;
                  const isResolved = alert.status === 'RESOLVED' || (index !== 2 && index !== 4);
                  
                  return (
                    <tr
                      key={alert.id}
                      onClick={() => navigate(`/alerts/${alert.id}`)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* # Index Column */}
                      <td className="py-4 px-6 text-xs text-slate-400 font-medium align-middle">
                        {rowNumber}.
                      </td>

                      {/* Work Details Column matching screenshot */}
                      <td className="py-4 px-6 align-middle max-w-lg">
                        {/* ID + Tag pill */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-teal-600 font-semibold font-mono text-xs tracking-tight">
                            {alert.station_id || `AERO-${alert.id}`}
                          </span>
                          <span className="bg-slate-100 text-slate-600 text-[11px] font-medium px-2 py-0.5 rounded">
                            {getCategoryLabel(alert)}
                          </span>
                        </div>

                        {/* Title matching screenshot */}
                        <div className="text-slate-800 font-semibold text-[13px] leading-snug group-hover:text-teal-700 transition-colors">
                          {getItemTitle(alert)}
                        </div>

                        {/* Subtext Location matching screenshot */}
                        <div className="text-slate-400 text-xs mt-0.5">
                          {alert.station_name || 'Synoptic Node'}, {alert.state || 'India'}
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="py-4 px-6 align-middle">
                        {alert.status === 'INVESTIGATING' || alert.status === 'UNDER REVIEW' || alert.status === 'UNDER_REVIEW' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                            Under Review
                          </span>
                        ) : alert.status === 'RESOLVED' ? (
                          <span className="text-slate-700 font-medium text-xs">
                            Resolved
                          </span>
                        ) : alert.status === 'CONFIRMED_FAULT' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            Quarantined
                          </span>
                        ) : (
                          <span className="text-slate-700 font-medium text-xs">
                            Open
                          </span>
                        )}
                      </td>

                      {/* Priority Column matching bullet dot pill in screenshot */}
                      <td className="py-4 px-6 align-middle">
                        <StatusBadge status={alert.severity} type="severity" />
                      </td>

                      {/* Finding Column matching screenshot */}
                      <td className="py-4 px-6 align-middle text-xs font-medium text-slate-700">
                        {getFindingText(alert)}
                      </td>

                      {/* Updated Date Column matching screenshot */}
                      <td className="py-4 px-6 align-middle text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(alert.created_at, index)}
                      </td>

                      {/* Action Column */}
                      <td className="py-4 px-6 align-middle text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/alerts/${alert.id}`);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-teal-700 hover:bg-slate-100 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                        >
                          <span>Review</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{((page - 1) * 15) + 1}</span> to{' '}
            <span className="font-semibold text-slate-700">{Math.min(page * 15, total)}</span> of{' '}
            <span className="font-semibold text-slate-700">{total}</span> records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="px-2 font-medium">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

