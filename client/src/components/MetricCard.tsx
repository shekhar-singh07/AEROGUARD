import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  statusColor?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendType = 'neutral',
  statusColor,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 hover:shadow-md transition-all relative overflow-hidden ${
        onClick ? 'cursor-pointer hover:bg-slate-50/50' : ''
      }`}
    >
      {/* Top accent line if statusColor provided */}
      {statusColor && (
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: statusColor }} />
      )}

      <div className="flex items-center justify-between text-slate-500 mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</span>
        {icon && <span className="p-1.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-100">{icon}</span>}
      </div>

      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-bold font-sans tracking-tight text-slate-800">
          {value}
        </div>
        {trend && (
          <span className={`text-xs font-mono font-medium ${trendType === 'positive' ? 'text-emerald-600' : trendType === 'negative' ? 'text-rose-600' : 'text-slate-500'}`}>
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <div className="mt-1 text-xs text-slate-500 font-sans">
          {subtitle}
        </div>
      )}
    </div>
  );
};

