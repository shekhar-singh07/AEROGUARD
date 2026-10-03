import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Wrench, Plus, RotateCcw, X } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

export const Maintenance: React.FC = () => {
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [newStationId, setNewStationId] = useState(searchParams.get('station') || 'AWS-IND-0001');
  const [newSensorType, setNewSensorType] = useState('TEMPERATURE');
  const [newProblem, setNewProblem] = useState(searchParams.get('problem') || 'Transducer calibration required following drift anomaly.');
  const [newPriority, setNewPriority] = useState('HIGH');
  const [newEngineer, setNewEngineer] = useState('R. Sharma');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMaintenance();
  }, [statusFilter, priorityFilter]);

  const loadMaintenance = async () => {
    try {
      setLoading(true);
      const res = await api.getMaintenance({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        priority: priorityFilter !== 'ALL' ? priorityFilter : undefined
      });
      if (res.success) {
        setTasks(res.tasks || []);
        setCounts(res.counts);
      }
    } catch (err) {
      console.error('Failed to load maintenance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.createMaintenance({
        station_id: newStationId,
        sensor_type: newSensorType,
        problem: newProblem,
        priority: newPriority,
        assigned_engineer: newEngineer
      });
      if (res.success) {
        setShowModal(false);
        loadMaintenance();
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (taskId: number, newStatus: string) => {
    try {
      await api.updateMaintenance(taskId, { status: newStatus });
      loadMaintenance();
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const engineersList = [
    'R. Sharma (North Region)',
    'A. Verma (West Region)',
    'P. Nair (South Region)',
    'S. Chatterjee (East Region)',
    'K. Reddy (Central Region)',
    'V. Patel (Gujarat Zone)'
  ];

  return (
    <div className="p-7 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-teal-600" />
            <span>AWS Hardware Maintenance & Work Order Console</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dispatch, engineer allocation, and audit tracking for sensor calibration, telemetry recovery, and field inspections.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Work Order</span>
        </button>
      </div>

      {/* KPI Status Row */}
      {counts && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-500 font-bold uppercase">Open Work Orders</span>
            <div className="text-2xl font-bold font-sans text-rose-600 mt-1">{counts.open}</div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-500 font-bold uppercase">Under Investigation</span>
            <div className="text-2xl font-bold font-sans text-amber-600 mt-1">{counts.investigating}</div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-500 font-bold uppercase">Field Scheduled</span>
            <div className="text-2xl font-bold font-sans text-sky-700 mt-1">{counts.scheduled}</div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-500 font-bold uppercase">Resolved</span>
            <div className="text-2xl font-bold font-sans text-emerald-600 mt-1">{counts.resolved}</div>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => { setStatusFilter('ALL'); setPriorityFilter('ALL'); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 text-xs font-medium transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Maintenance Tasks Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-sans text-xs">
                <th className="py-3 px-4 font-medium">Order ID</th>
                <th className="py-3 px-4 font-medium">Station ID</th>
                <th className="py-3 px-4 font-medium">Station Name</th>
                <th className="py-3 px-4 font-medium">Sensor Type</th>
                <th className="py-3 px-4 font-medium">Diagnostic Problem</th>
                <th className="py-3 px-4 font-medium">Priority</th>
                <th className="py-3 px-4 font-medium">Assigned Engineer</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Created</th>
                <th className="py-3 px-4 text-right font-medium">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-teal-700">#{task.id}</td>
                  <td className="py-3 px-4 font-mono text-slate-800 font-semibold">{task.station_id}</td>
                  <td className="py-3 px-4 text-slate-600">{task.station_name}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{task.sensor_type}</td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{task.problem}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={task.priority} type="severity" />
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">{task.assigned_engineer}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      task.status === 'OPEN' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      task.status === 'INVESTIGATING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      task.status === 'SCHEDULED' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                      'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs">{task.created_at}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {task.status !== 'SCHEDULED' && task.status !== 'RESOLVED' && (
                        <button
                          onClick={() => handleUpdateStatus(task.id, 'SCHEDULED')}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-teal-700 text-xs font-medium transition-colors"
                        >
                          Schedule
                        </button>
                      )}
                      {task.status !== 'RESOLVED' && (
                        <button
                          onClick={() => handleUpdateStatus(task.id, 'RESOLVED')}
                          className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-medium transition-colors"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for creating a new work order */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Dispatch Maintenance Work Order</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Target Station ID</label>
                <input
                  type="text"
                  value={newStationId}
                  onChange={(e) => setNewStationId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Sensor Subsystem</label>
                <select
                  value={newSensorType}
                  onChange={(e) => setNewSensorType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-teal-500"
                >
                  <option value="TEMPERATURE">Temperature (RTD Pt100)</option>
                  <option value="HUMIDITY">Relative Humidity (Capacitive)</option>
                  <option value="PRESSURE">Barometric Pressure (Piezoresistive)</option>
                  <option value="WIND">Anemometer & Wind Vane</option>
                  <option value="TELEMETRY">Telemetry & Power Unit</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Diagnostic Problem Statement</label>
                <textarea
                  value={newProblem}
                  onChange={(e) => setNewProblem(e.target.value)}
                  rows={3}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Severity / Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-teal-500"
                  >
                    <option value="CRITICAL">Critical (Immediate SLA)</option>
                    <option value="HIGH">High (24h)</option>
                    <option value="MEDIUM">Medium (48h)</option>
                    <option value="LOW">Low (Scheduled Cycle)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Assigned Field Engineer</label>
                  <select
                    value={newEngineer}
                    onChange={(e) => setNewEngineer(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-teal-500"
                  >
                    {engineersList.map(eng => (
                      <option key={eng} value={eng}>{eng}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-2xs transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Dispatching...' : 'Dispatch Work Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
