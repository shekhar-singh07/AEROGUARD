import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'station' | 'severity' | 'alert_status' | 'anomaly_type' | 'trust';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'station', size = 'sm' }) => {
  const norm = (status || '').toUpperCase();
  const padding = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs font-semibold';

  // Station status
  if (type === 'station') {
    if (norm === 'ONLINE') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${padding} bg-emerald-50 text-emerald-700 border border-emerald-200`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          ONLINE
        </span>
      );
    }
    if (norm === 'OFFLINE') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${padding} bg-slate-100 text-slate-600 border border-slate-200`}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          OFFLINE
        </span>
      );
    }
    if (norm === 'WARNING') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${padding} bg-amber-50 text-amber-700 border border-amber-200`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          WARNING
        </span>
      );
    }
    if (norm === 'CRITICAL') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${padding} bg-rose-50 text-rose-700 border border-rose-200`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
          CRITICAL
        </span>
      );
    }
  }

  // Priority / Severity matching reference image (• High, • Critical, • Medium)
  if (type === 'severity') {
    if (norm === 'CRITICAL') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${padding} bg-[#FEF2F2] text-[#DC2626] border border-[#FEE2E2]`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]"></span>
          Critical
        </span>
      );
    }
    if (norm === 'HIGH') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${padding} bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5]`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]"></span>
          High
        </span>
      );
    }
    if (norm === 'MEDIUM') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${padding} bg-[#FFFBEB] text-[#D97706] border border-[#FEF3C7]`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
          Medium
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${padding} bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]`}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
        Low
      </span>
    );
  }

  // Alert Status
  if (type === 'alert_status') {
    if (norm === 'RESOLVED') {
      return <span className="text-slate-700 font-medium text-xs">Resolved</span>;
    }
    if (norm === 'UNDER REVIEW' || norm === 'INVESTIGATING') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
          Under Review
        </span>
      );
    }
    if (norm === 'ACTIVE' || norm === 'OPEN') {
      return <span className="text-slate-700 font-medium text-xs">Open</span>;
    }
    if (norm === 'QUARANTINED' || norm === 'CONFIRMED_FAULT') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          Quarantined
        </span>
      );
    }
    return <span className="text-slate-700 font-medium text-xs">{status}</span>;
  }

  // Anomaly Type / Category pill matching reference image tag
  if (type === 'anomaly_type') {
    if (norm === 'WEATHER_EVENT') {
      return <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium bg-cyan-50 text-cyan-700 border border-cyan-200">Weather Front</span>;
    }
    if (norm === 'SPIKE') {
      return <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">Spike</span>;
    }
    if (norm === 'DRIFT') {
      return <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">Drift</span>;
    }
    if (norm === 'BIAS') {
      return <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">Bias</span>;
    }
    if (norm === 'STUCK') {
      return <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">Stuck Sensor</span>;
    }
    return <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">{norm}</span>;
  }

  // Generic fallback
  return <span className={`inline-flex items-center rounded-full font-medium ${padding} bg-slate-100 text-slate-700 border border-slate-200`}>{norm}</span>;
};

