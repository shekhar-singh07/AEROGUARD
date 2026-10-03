import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, ArrowUpRight, RotateCcw } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

export const Stations: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');

  useEffect(() => {
    loadStations();
  }, [page, stateFilter, statusFilter]);

  const loadStations = async () => {
    try {
      setLoading(true);
      const res = await api.getStations({
        page,
        limit: 15,
        search: search.trim() || undefined,
        state: stateFilter !== 'ALL' ? stateFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined
      });
      if (res.success) {
        setStations(res.stations || []);
        setTotal(res.total || 0);
        setTotalPages(res.total_pages || 1);
      }
    } catch (err) {
      console.error('Failed to load stations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadStations();
  };

  const statesList = [
    'ALL', 'Maharashtra', 'Gujarat', 'Rajasthan', 'Karnataka', 'Tamil Nadu',
    'Kerala', 'Andhra Pradesh', 'Telangana', 'Madhya Pradesh', 'Uttar Pradesh',
    'Punjab & Haryana', 'Jammu & Kashmir', 'Himachal & Uttarakhand', 'West Bengal',
    'Odisha', 'Bihar & Jharkhand', 'Assam & Northeast'
  ];

  return (
    <div className="p-7 space-y-6 max-w-[1600px] mx-auto">
      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Station ID, District, State..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-teal-500 shadow-2xs font-sans"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-2xs transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          {/* Region / State */}
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Region:</span>
            <select
              value={stateFilter}
              onChange={(e) => { setStateFilter(e.target.value); setPage(1); }}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer shadow-2xs"
            >
              {statesList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Offline</option>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          {/* Reset Filters */}
          <button
            onClick={() => { setSearch(''); setStateFilter('ALL'); setStatusFilter('ALL'); setPage(1); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Stations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200/90 text-slate-400 font-sans text-xs">
                <th className="py-4 px-6 w-12 font-medium">#</th>
                <th className="py-4 px-6 font-medium">Station Details</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium">Health Rating</th>
                <th className="py-4 px-6 font-medium">Coordinates</th>
                <th className="py-4 px-6 font-medium">Active Anomaly</th>
                <th className="py-4 px-6 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 text-sm">
                    Loading stations from database...
                  </td>
                </tr>
              ) : stations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 text-sm">
                    No stations matched the specified criteria.
                  </td>
                </tr>
              ) : (
                stations.map((st, index) => {
                  const rowNumber = ((page - 1) * 15) + index + 1;
                  return (
                    <tr
                      key={st.station_id}
                      onClick={() => navigate(`/stations/${st.station_id}`)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-6 text-xs text-slate-400 font-medium align-middle">
                        {rowNumber}.
                      </td>

                      <td className="py-4 px-6 align-middle">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-teal-600 font-semibold font-mono text-xs">
                            {st.station_id}
                          </span>
                          <span className="bg-slate-100 text-slate-600 text-[11px] font-medium px-2 py-0.5 rounded">
                            {st.state}
                          </span>
                        </div>
                        <div className="text-slate-800 font-semibold text-[13px] group-hover:text-teal-700 transition-colors">
                          {st.station_name}
                        </div>
                        <div className="text-slate-400 text-xs mt-0.5">
                          {st.district}, India
                        </div>
                      </td>

                      <td className="py-4 px-6 align-middle">
                        <StatusBadge status={st.station_status} />
                      </td>

                      <td className="py-4 px-6 align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${st.sensor_health < 40 ? 'bg-rose-500' : st.sensor_health < 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${st.sensor_health}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs font-semibold text-slate-700">{st.sensor_health}%</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 align-middle font-mono text-xs text-slate-500">
                        {st.latitude.toFixed(2)}°N, {st.longitude.toFixed(2)}°E
                      </td>

                      <td className="py-4 px-6 align-middle">
                        {st.active_anomaly !== 'NONE' ? (
                          <StatusBadge status={st.active_anomaly} type="anomaly_type" />
                        ) : (
                          <span className="text-slate-400 text-xs">None (Nominal)</span>
                        )}
                      </td>

                      <td className="py-4 px-6 align-middle text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/stations/${st.station_id}`);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-teal-700 hover:bg-slate-100 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                        >
                          <span>Open</span>
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
            <span className="font-semibold text-slate-700">{total}</span> stations
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
