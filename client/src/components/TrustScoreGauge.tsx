import React from 'react';

interface TrustScoreGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showDetails?: boolean;
  onClick?: () => void;
}

export const TrustScoreGauge: React.FC<TrustScoreGaugeProps> = ({
  score,
  size = 120,
  strokeWidth = 10,
  showDetails = true,
  onClick
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const offset = circumference - (clampedScore / 100) * circumference;

  let color = '#10B981'; // emerald
  let statusText = 'HIGHLY TRUSTED';
  let statusBg = 'text-emerald-700 bg-emerald-50 border-emerald-200';

  if (clampedScore < 40) {
    color = '#EF4444'; // red
    statusText = 'LOW TRUST / QUARANTINE';
    statusBg = 'text-rose-700 bg-rose-50 border-rose-200';
  } else if (clampedScore < 70) {
    color = '#F59E0B'; // amber
    statusText = 'REVIEW RECOMMENDED';
    statusBg = 'text-amber-700 bg-amber-50 border-amber-200';
  } else if (clampedScore < 90) {
    color = '#0284C7'; // sky
    statusText = 'TRUSTED';
    statusBg = 'text-sky-700 bg-sky-50 border-sky-200';
  }

  return (
    <div 
      className={`flex flex-col items-center justify-center p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm ${onClick ? 'cursor-pointer hover:border-slate-300 transition-all' : ''}`}
      onClick={onClick}
    >
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold font-sans tracking-tight" style={{ color }}>
            {clampedScore}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">/ 100</span>
        </div>
      </div>

      {showDetails && (
        <div className="mt-2 text-center">
          <span className={`inline-block px-2.5 py-0.5 text-[11px] font-medium rounded-full border ${statusBg}`}>
            {statusText}
          </span>
          <p className="text-[10px] text-slate-400 mt-1">Multi-signal fused trust</p>
        </div>
      )}
    </div>
  );
};

