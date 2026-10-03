import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FlaskConical,
  Zap,
  Activity,
  ArrowRight,
  Sliders,
  RotateCcw
} from 'lucide-react';
import { api } from '../services/api';
import { TrustScoreGauge } from '../components/TrustScoreGauge';
import { EvidenceStrengthBar } from '../components/EvidenceStrengthBar';
import { StatusBadge } from '../components/StatusBadge';

export const SimulationLab: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Config parameters
  const [stationId, setStationId] = useState(searchParams.get('station') || 'AWS-IND-0001');
  const [parameter, setParameter] = useState('temperature');
  const [faultType, setFaultType] = useState('SPIKE');
  const [severity, setSeverity] = useState('HIGH');
  const [duration, setDuration] = useState(4);
  const [magnitude, setMagnitude] = useState<number | ''>('');

  // Execution state
  const [injecting, setInjecting] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);

  const handleInject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setInjecting(true);
      const res = await api.injectSimulation({
        station_id: stationId,
        parameter,
        fault_type: faultType,
        severity,
        duration_intervals: duration,
        magnitude: magnitude !== '' ? Number(magnitude) : undefined
      });
      if (res.success) {
        setSimulationResult(res);
      }
    } catch (err: any) {
      alert(`Simulation injection failed: ${err.message}`);
    } finally {
      setInjecting(false);
    }
  };

  const handleReset = () => {
    setSimulationResult(null);
    setFaultType('SPIKE');
    setParameter('temperature');
    setSeverity('HIGH');
  };

  return (
    <div className="p-7 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-teal-600" />
            <span>AEROGUARD Anomaly Simulation & Stress-Test Lab</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Controlled physical fault injection and genuine weather front synthesis to validate end-to-end AI detection, evidence fusion, and trust scoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
            Live Synthetic Pipeline
          </span>
        </div>
      </div>

      {/* Main Grid: Form Controls (Left) and Live Detection Pipeline Response (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Injection Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-600" />
                <span>Simulation Configuration</span>
              </h2>
              <button
                onClick={handleReset}
                type="button"
                className="text-slate-400 hover:text-slate-600 text-xs flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            <form onSubmit={handleInject} className="space-y-4 text-xs font-sans">
              {/* Target Station */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Target AWS Station ID</label>
                <input
                  type="text"
                  value={stationId}
                  onChange={(e) => setStationId(e.target.value)}
                  required
                  placeholder="e.g. AWS-IND-0001"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono text-xs focus:outline-none focus:border-teal-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Selected station will receive synthetic telemetry frame.</span>
              </div>

              {/* Anomaly / Fault Type */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Fault / Event Type</label>
                <select
                  value={faultType}
                  onChange={(e) => setFaultType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs focus:outline-none focus:border-teal-500 font-medium"
                >
                  <option value="SPIKE">Temperature/RH Step Spike (Sudden unrealistic change)</option>
                  <option value="DRIFT">Continuous Sensor Drift (Gradual monotonic deviation)</option>
                  <option value="BIAS">Sensor Calibration Bias (Constant offset)</option>
                  <option value="STUCK">Stuck Sensor Reading (Zero natural variance)</option>
                  <option value="DROPOUT">Telemetry Dropout (Null telemetry packet)</option>
                  <option value="MISSING">Missing Parameter Frame</option>
                  <option value="WEATHER_EVENT">Genuine Weather Event (Coordinated regional storm front)</option>
                </select>
              </div>

              {/* Target Parameter */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Meteorological Parameter</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'temperature', label: 'Temperature' },
                    { id: 'relative_humidity', label: 'Humidity' },
                    { id: 'atmospheric_pressure', label: 'Pressure' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setParameter(p.id)}
                      className={`py-2 px-2 rounded-lg text-xs font-medium border transition-colors ${
                        parameter === p.id
                          ? 'bg-teal-50 text-teal-800 border-teal-300 font-semibold shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Fault Severity</label>
                <div className="grid grid-cols-4 gap-2">
                  {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      className={`py-1.5 px-2 rounded-lg text-xs border transition-colors ${
                        severity === sev
                          ? sev === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border-rose-300 font-semibold' :
                            sev === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-300 font-semibold' :
                            sev === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-300 font-semibold' :
                            'bg-slate-100 text-slate-800 border-slate-300 font-semibold'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Magnitude */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Optional Override Magnitude
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={magnitude}
                  onChange={(e) => setMagnitude(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Auto-calculated from severity (e.g. +18.5°C)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={injecting}
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-sans text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                >
                  {injecting ? (
                    <>
                      <Activity className="w-4 h-4 animate-spin" />
                      <span>Executing AI Detection Pipeline...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>INJECT ANOMALY & RUN PIPELINE</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Real-Time Detection Pipeline Output (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {!simulationResult ? (
            <div className="rounded-xl bg-white border border-dashed border-slate-300 p-12 flex flex-col items-center justify-center text-center text-slate-400 h-full min-h-[460px] shadow-sm">
              <FlaskConical className="w-12 h-12 text-slate-400 mb-3" />
              <h3 className="text-sm font-semibold text-slate-700">Awaiting Simulation Injection</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
                Select a station, parameter, and fault mode on the left. When injected, AEROGUARD executes the complete 6-stage ML pipeline and displays the results in real-time.
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-5 shadow-sm animate-fadeIn">
              {/* Result Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${simulationResult.classification === 'GENUINE_WEATHER_EVENT' ? 'bg-cyan-50 text-cyan-600 border border-cyan-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-teal-700">ALERT #{simulationResult.alert_id} GENERATED</span>
                    <h3 className="text-base font-bold text-slate-800">
                      {simulationResult.classification === 'GENUINE_WEATHER_EVENT'
                        ? 'Genuine Regional Weather Event'
                        : 'Probable Sensor Fault'}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={simulationResult.classification} type="anomaly_type" size="md" />
                </div>
              </div>

              {/* Trust Score & Injected Values */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div className="sm:col-span-1 flex justify-center p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <TrustScoreGauge score={simulationResult.trust_score} size={110} />
                </div>

                <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs space-y-1.5">
                  <div className="text-[11px] text-slate-500 font-sans font-semibold">SYNTHESIZED OBSERVATION FRAME</div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Temperature:</span>
                    <span className="text-rose-600 font-bold">{simulationResult.injected_values?.temperature ?? 'NULL'}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Relative Humidity:</span>
                    <span className="text-sky-700 font-bold">{simulationResult.injected_values?.relative_humidity ?? 'NULL'}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Atmospheric Pressure:</span>
                    <span className="text-indigo-700 font-bold">{simulationResult.injected_values?.atmospheric_pressure ?? 'NULL'} hPa</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500">ML Confidence:</span>
                    <span className="text-emerald-700 font-bold">{(simulationResult.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* The 4 Operational Answers */}
              <div className="space-y-2.5 text-xs">
                <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200/80">
                  <span className="text-sky-800 font-semibold block mb-0.5">WHAT HAPPENED?</span>
                  <p className="text-slate-700 font-sans">{simulationResult.four_questions?.what}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
                  <span className="text-amber-800 font-semibold block mb-0.5">WHY DID IT HAPPEN?</span>
                  <p className="text-slate-700 font-sans">{simulationResult.four_questions?.why}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80">
                  <span className="text-rose-800 font-semibold block mb-0.5">RECOMMENDED OPERATOR ACTION:</span>
                  <p className="text-slate-700 font-sans">{simulationResult.four_questions?.action}</p>
                </div>
              </div>

              {/* Visual Evidence Strengths */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <span className="text-xs font-bold uppercase text-slate-600 block">
                  Multi-Signal Evidence Strengths
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <EvidenceStrengthBar
                    label="Temporal Dynamics"
                    score={simulationResult.evidence_strengths?.temporal || 85}
                  />
                  <EvidenceStrengthBar
                    label="Spatial Peer Coherence"
                    score={simulationResult.evidence_strengths?.spatial || 90}
                  />
                  <EvidenceStrengthBar
                    label="Multivariate Profile"
                    score={simulationResult.evidence_strengths?.multivariate || 78}
                  />
                  <EvidenceStrengthBar
                    label="Isolation Forest (ML)"
                    score={simulationResult.evidence_strengths?.ml_isolation_forest || 88}
                  />
                </div>
              </div>

              {/* Action Buttons to Navigate */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => navigate(`/alerts/${simulationResult.alert_id}`)}
                  className="flex-1 py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <span>Investigate In Alert Center</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => navigate(`/stations/${simulationResult.station_id}`)}
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>View Updated Station</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
