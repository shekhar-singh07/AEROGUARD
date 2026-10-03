import React from 'react';

interface EvidenceStrengthBarProps {
  label: string;
  score: number; // 0 - 100
  description?: string;
  icon?: React.ReactNode;
}

export const EvidenceStrengthBar: React.FC<EvidenceStrengthBarProps> = ({
  label,
  score,
  description,
  icon
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  let barColor = 'bg-slate-400';
  let badgeText = 'Normal';
  let badgeColor = 'text-slate-600 bg-slate-100 border border-slate-200';

  if (clamped >= 75) {
    barColor = 'bg-rose-500';
    badgeText = 'Severe Anomaly';
    badgeColor = 'text-rose-700 bg-rose-50 border border-rose-200';
  } else if (clamped >= 50) {
    barColor = 'bg-amber-500';
    badgeText = 'Moderate Signal';
    badgeColor = 'text-amber-700 bg-amber-50 border border-amber-200';
  } else if (clamped >= 25) {
    barColor = 'bg-sky-500';
    badgeText = 'Weak Deviation';
    badgeColor = 'text-sky-700 bg-sky-50 border border-sky-200';
  }

  return (
    <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && <span className="text-slate-500">{icon}</span>}
          <span className="text-xs font-semibold text-slate-800">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>
            {badgeText}
          </span>
          <span className="text-xs font-mono font-bold text-slate-800">{clamped}%</span>
        </div>
      </div>

      {/* Progress track */}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>

      {description && (
        <p className="mt-2 text-xs text-slate-500 leading-relaxed font-sans">{description}</p>
      )}
    </div>
  );
};

