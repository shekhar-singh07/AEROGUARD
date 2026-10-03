import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Radio,
  AlertTriangle,
  Cpu,
  Wrench,
  FlaskConical,
  FileText,
  History,
  Activity
} from 'lucide-react';

interface SidebarProps {
  activeAlertCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeAlertCount = 25 }) => {
  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/network-map', label: 'Network Intelligence', icon: MapPin },
    { to: '/stations', label: 'Stations', icon: Radio },
    { to: '/alerts', label: 'Alerts', icon: AlertTriangle, badge: activeAlertCount },
    { to: '/sensor-health', label: 'Sensor Health', icon: Cpu },
    { to: '/maintenance', label: 'Maintenance', icon: Wrench },
    { to: '/simulation-lab', label: 'Simulation Lab', icon: FlaskConical },
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/audit-logs', label: 'Audit Logs', icon: History },
  ];

  return (
    <aside className="w-64 bg-[#0B1523] border-r border-[#172538] flex flex-col shrink-0 min-h-[calc(100vh-4rem)] select-none">
      {/* Category header matching prior wordings */}
      <div className="p-3.5 text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider px-4">
        Operational Console
      </div>

      {/* Nav items matching prior wordings */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all font-medium ${
                  isActive
                    ? 'bg-[#102A36] text-[#2DD4BF] border border-[#14B8A6]/40 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#132135]'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* System Telemetry footer matching prior wordings */}
      <div className="p-4 border border-[#172538] bg-[#0E1A2B] m-3 rounded-xl shadow-xs">
        <div className="flex items-center gap-2 mb-2 text-xs font-mono font-semibold text-slate-200">
          <Activity className="w-3.5 h-3.5 text-teal-400" />
          <span>AEROGUARD AI ENGINE</span>
        </div>
        <div className="space-y-1 text-[11px] text-slate-400 font-sans">
          <div className="flex justify-between">
            <span className="text-slate-400">Pipeline:</span>
            <span className="text-slate-200 font-mono">Multi-signal fused</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Cadence:</span>
            <span className="text-teal-400 font-mono">15m synoptic</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">ML Model:</span>
            <span className="text-cyan-400 font-mono">Isolation Forest</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
