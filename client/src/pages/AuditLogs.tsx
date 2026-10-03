import React, { useEffect, useState } from 'react';
import { History, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export const AuditLogs: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs(100);
      if (res.success) {
        setLogs(res.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-7 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <History className="w-4 h-4 text-teal-600" />
            <span>Operational Audit Trail & System Event Logs</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable chronological audit log of human-in-the-loop decisions, sensor quarantines, simulation triggers, and work orders.
          </p>
        </div>

        <button
          onClick={loadAuditLogs}
          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-sans text-xs">
                <th className="py-3 px-4 font-medium">Log ID</th>
                <th className="py-3 px-4 font-medium">Timestamp (IST)</th>
                <th className="py-3 px-4 font-medium">User / Operator</th>
                <th className="py-3 px-4 font-medium">Action Executed</th>
                <th className="py-3 px-4 font-medium">Entity Type</th>
                <th className="py-3 px-4 font-medium">Target Entity ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    Loading audit trail from database...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    No audit records registered yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">#{log.id}</td>
                    <td className="py-3 px-4 text-slate-500">{log.timestamp}</td>
                    <td className="py-3 px-4 text-slate-800 font-semibold">{log.user_id}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.action.includes('QUARANTINE') ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        log.action.includes('SIMULATION') || log.action.includes('INJECT') ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        log.action.includes('CONFIRM') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{log.entity_type}</td>
                    <td className="py-3 px-4 font-mono text-teal-700 font-medium">{log.entity_id}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
