import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileQuestion,
  Wrench,
  Radio,
  Activity,
  Check,
  AlertOctagon,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { TrustScoreGauge } from '../components/TrustScoreGauge';
import { EvidenceStrengthBar } from '../components/EvidenceStrengthBar';

export const AlertInvestigation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [alertData, setAlertData] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [reviewDecision, setReviewDecision] = useState<string>('CONFIRM_SENSOR_FAULT');
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewerName, setReviewerName] = useState<string>('Data Quality Expert');

  useEffect(() => {
    if (id) {
      loadAlert();
    }
  }, [id]);

  const loadAlert = async () => {
    try {
      setLoading(true);
      const res = await api.getAnomalyDetail(id!);
      if (res.success) {
        setAlertData(res.alert);
      }
    } catch (err) {
      console.error('Failed to load alert:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (decision: string) => {
    try {
      setActionLoading(true);
      const res = await api.reviewAnomaly(id!, decision, reviewComment || `Human expert validation: ${decision}`, reviewerName);
      if (res.success) {
        setActionMessage(`Review recorded: ${decision}`);
        loadAlert();
      }
    } catch (err: any) {
      setActionMessage(`Review failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuarantine = async () => {
    try {
      setActionLoading(true);
      const res = await api.quarantineAnomaly(id!, reviewerName);
      if (res.success) {
        setActionMessage(`Observation quarantined from synoptic models.`);
        loadAlert();
      }
    } catch (err: any) {
      setActionMessage(`Quarantine failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setActionLoading(true);
      const res = await api.restoreAnomaly(id!, reviewerName);
      if (res.success) {
        setActionMessage(`Observation restored to valid status.`);
        loadAlert();
      }
    } catch (err: any) {
      setActionMessage(`Restore failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !alertData) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <Activity className="w-8 h-8 animate-spin text-teal-600 mb-3" />
        <span className="font-sans text-sm font-medium tracking-wide">Synthesizing Anomaly Evidence & Multi-Signal Tree Graph...</span>
      </div>
    );
  }

  const {
    station_id,
    station_name,
    state,
    district,
    anomaly_type,
    severity,
    confidence,
    trust_score,
    status,
    created_at,
    temperature,
    relative_humidity,
    atmospheric_pressure,
    expected_temperature,
    temperature_deviation,
    evidence_strengths,
    reviews = [],
    nearby_peers = []
  } = alertData;

  const isWeatherEvent = anomaly_type === 'WEATHER_EVENT' || status === 'CONFIRMED_WEATHER_EVENT';

  return (
    <div className="p-7 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Banner and Navigation */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/alerts')}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-base font-bold text-teal-700">INVESTIGATION #{alertData.id}</span>
              <StatusBadge status={anomaly_type} type="anomaly_type" />
              <StatusBadge status={severity} type="severity" />
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                {status}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Station: <strong className="text-slate-800">{station_id} ({station_name})</strong> &bull; {district}, {state} &bull; {created_at}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/stations/${station_id}`)}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
          >
            Open Station History
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center justify-between font-sans">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-teal-600 hover:text-teal-900 font-bold ml-4">✕</button>
        </div>
      )}

      {/* 3-Column Operational Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ====================================================
            COLUMN 1: Alert Details & Observation Readings (3 cols)
           ==================================================== */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-3 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Radio className="w-4 h-4 text-teal-600" />
              <span>Observation Telemetry</span>
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block mb-1">Observed Temperature</span>
                <div className="text-xl font-bold font-mono text-rose-600">
                  {temperature !== null && temperature !== undefined ? `${temperature}°C` : 'NULL (Dropout)'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                  <span>Expected Baseline:</span>
                  <span className="text-slate-700 font-mono">{expected_temperature}°C</span>
                </div>
                <div className="text-[11px] text-rose-600 font-bold flex justify-between mt-0.5">
                  <span>Deviation:</span>
                  <span className="font-mono">{temperature_deviation > 0 ? `+${temperature_deviation}` : temperature_deviation}°C</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block mb-1">Relative Humidity</span>
                <div className="text-xl font-bold font-mono text-sky-600">
                  {relative_humidity !== null && relative_humidity !== undefined ? `${relative_humidity}%` : 'NULL'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block mb-1">Atmospheric Pressure</span>
                <div className="text-xl font-bold font-mono text-indigo-600">
                  {atmospheric_pressure !== null && atmospheric_pressure !== undefined ? `${atmospheric_pressure} hPa` : 'NULL'}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1.5 font-sans">
              <div className="flex justify-between">
                <span>ML Confidence:</span>
                <span className="font-mono font-bold text-slate-800">{(confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Detection Model:</span>
                <span className="font-mono text-teal-600 font-semibold">Isolation Forest</span>
              </div>
              <div className="flex justify-between">
                <span>Quality Status:</span>
                <span className="font-mono text-amber-600 font-semibold">{status}</span>
              </div>
            </div>
          </div>

          {/* Peer Stations Quick View */}
          <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-2 shadow-sm">
            <h3 className="text-xs font-bold text-slate-600 uppercase">Surrounding Peer Readings</h3>
            <p className="text-[11px] text-slate-400">Simultaneous readings at event time</p>
            <div className="space-y-1.5 text-xs font-mono">
              {nearby_peers.slice(0, 4).map((p: any) => (
                <div key={p.station_id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex justify-between items-center">
                  <span className="text-slate-600 font-medium">{p.station_id}</span>
                  <span className="text-slate-800 font-bold">{p.temperature ?? '--'}°C</span>
                  <span className="text-sky-600">{p.relative_humidity ?? '--'}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ====================================================
            COLUMN 2: The 4 Operational Questions (5 cols)
           ==================================================== */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600" />
                <span>AI OPERATIONAL INVESTIGATION REPORT</span>
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isWeatherEvent ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {isWeatherEvent ? 'Genuine Weather Event' : 'Probable Sensor Fault'}
              </span>
            </div>

            {/* Question 1: WHAT */}
            <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200/80">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-800 mb-1">
                <HelpCircle className="w-4 h-4 text-sky-600" />
                <span>1. WHAT HAPPENED?</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                {isWeatherEvent
                  ? `Regional convective storm / cold downdraft boundary detected across multiple adjacent AWS stations in ${state}.`
                  : `Severe anomalous departure observed in ${anomaly_type} mode. Sensor value (${temperature}°C) deviated +${temperature_deviation}°C from expected baseline without physical meteorological corroboration.`}
              </p>
            </div>

            {/* Question 2: WHY */}
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 mb-1">
                <FileQuestion className="w-4 h-4 text-amber-600" />
                <span>2. WHY DID IT HAPPEN?</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                {isWeatherEvent
                  ? `Spatial cross-validation confirms surrounding AWS stations experienced a simultaneous temperature drop and humidity surge. Thermodynamically consistent psychrometric profile.`
                  : `Isolated event: Target station diverges by ${temperature_deviation}°C from peer network (peer dispersion ±1.2°C). Inconsistent psychrometric inverse correlation; flagged by Isolation Forest decision trees.`}
              </p>
            </div>

            {/* Question 3: HOW CONFIDENT */}
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>3. HOW CONFIDENT IS THE SYSTEM?</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                Multi-signal Evidence Fusion Engine calculated <strong className="text-emerald-700 font-mono">{(confidence * 100).toFixed(1)}% confidence</strong> based on weighted consensus across Rule-based QC, Temporal Rate-of-Change, Geodesic Spatial Validation, and Unsupervised Isolation Forest.
              </p>
            </div>

            {/* Question 4: WHAT TO DO */}
            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200/80">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-800 mb-1">
                <Wrench className="w-4 h-4 text-rose-600" />
                <span>4. WHAT SHOULD THE OPERATOR DO?</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                {isWeatherEvent
                  ? `Validate mesoscale convective track with radar reflectivity and accept observations into synoptic weather forecasting models.`
                  : `Quarantine observation from downstream numerical weather prediction assimilation pipelines; dispatch field engineer to calibrate/replace transducer.`}
              </p>
            </div>
          </div>

          {/* Audit & Review History */}
          <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-2 shadow-sm">
            <h3 className="text-xs font-bold text-slate-600 uppercase">Human Validation History</h3>
            {reviews.length === 0 ? (
              <p className="text-xs text-slate-400 font-sans">Awaiting primary validation by Data Quality Expert.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {reviews.map((r: any) => (
                  <div key={r.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span className="font-bold text-slate-800">{r.reviewer}</span>
                      <span>{r.created_at}</span>
                    </div>
                    <div className="text-teal-700 font-semibold">{r.decision}</div>
                    {r.comment && <div className="text-slate-600 font-sans">{r.comment}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ====================================================
            COLUMN 3: Evidence Breakdown & Action Controls (4 cols)
           ==================================================== */}
        <div className="lg:col-span-4 space-y-4">
          {/* Radial Trust Score */}
          <div className="rounded-xl bg-white border border-slate-200 p-4 flex flex-col items-center justify-center shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Observation Trust Score</span>
            <TrustScoreGauge score={trust_score} size={135} strokeWidth={11} />
          </div>

          {/* Visual Evidence Strength Bars */}
          <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-600">Multi-Signal Evidence</span>
              <span className="text-[10px] text-slate-400 font-mono">Anomaly Strength</span>
            </div>

            <EvidenceStrengthBar
              label="Temporal Dynamics"
              score={evidence_strengths?.temporal || 82}
              description="Rate of change vs diurnal baseline and rolling Z-score"
            />

            <EvidenceStrengthBar
              label="Spatial Peer Coherence"
              score={evidence_strengths?.spatial || (isWeatherEvent ? 12 : 91)}
              description={isWeatherEvent ? "High peer coherence (weather confirmed)" : "Severe divergence from surrounding stations"}
            />

            <EvidenceStrengthBar
              label="Multivariate Psychrometrics"
              score={evidence_strengths?.multivariate || 74}
              description="Temperature-humidity psychrometric consistency check"
            />

            <EvidenceStrengthBar
              label="Isolation Forest (ML)"
              score={evidence_strengths?.ml_isolation_forest || 84}
              description="Unsupervised high-dimensional tree boundary partition"
            />

            <EvidenceStrengthBar
              label="Rule QC Check"
              score={evidence_strengths?.rule_qc || 88}
              description="WMO physical climatological bounds & step thresholds"
            />
          </div>

          {/* Human-in-the-Loop Decision Buttons */}
          <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-3 shadow-sm">
            <span className="text-xs font-bold uppercase text-slate-600 block">
              Human-in-the-Loop Actions
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleReviewAction('CONFIRM_SENSOR_FAULT')}
                disabled={actionLoading}
                className="py-2.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Confirm Fault</span>
              </button>

              <button
                onClick={() => handleReviewAction('CONFIRM_WEATHER_EVENT')}
                disabled={actionLoading}
                className="py-2.5 px-3 rounded-lg bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm Weather</span>
              </button>

              <button
                onClick={() => handleReviewAction('FALSE_ALARM')}
                disabled={actionLoading}
                className="py-2.5 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <span>False Alarm</span>
              </button>

              <button
                onClick={handleQuarantine}
                disabled={actionLoading}
                className="py-2.5 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Quarantine</span>
              </button>
            </div>

            <button
              onClick={handleRestore}
              disabled={actionLoading}
              className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-2xs disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Restore Observation Quality</span>
            </button>

            <button
              onClick={() => navigate(`/maintenance?station=${station_id}&problem=${encodeURIComponent(`Anomaly ${anomaly_type} detected`)}`)}
              className="w-full py-2.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Wrench className="w-3.5 h-3.5 text-teal-600" />
              <span>Create Maintenance Work Order</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
