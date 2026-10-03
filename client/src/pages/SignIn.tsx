import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  Radio,
  Cpu,
  Layers,
  Sparkles,
  KeyRound
} from 'lucide-react';
import { UserRole } from '../types';

interface SignInProps {
  onSignInSuccess?: (user: { email: string; role: UserRole; name: string; division: string }) => void;
}

export const SignIn: React.FC<SignInProps> = ({ onSignInSuccess }) => {
  const navigate = useNavigate();

  // Form State
  const [email, setEmail] = useState('admin@aeroguard.gov.in');
  const [password, setPassword] = useState('••••••••••••');
  const [role, setRole] = useState<UserRole>('Network Administrator');
  const [division, setDivision] = useState('IMD HQ — Mausam Bhawan, New Delhi');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1-Click Demo Profiles for SIH Judges and Evaluators
  const demoProfiles = [
    {
      label: 'Network Admin',
      email: 'admin@aeroguard.gov.in',
      role: 'Network Administrator' as UserRole,
      division: 'IMD HQ — Mausam Bhawan, New Delhi',
      desc: 'National oversight & policy',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
    },
    {
      label: 'AWS Operator',
      email: 'operator.delhi@imd.gov.in',
      role: 'AWS Network Operator' as UserRole,
      division: 'RMC New Delhi (Northern Synoptic Grid)',
      desc: 'Real-time telemetry & triage',
      badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/30'
    },
    {
      label: 'Field Engineer',
      email: 'field.mumbai@imd.gov.in',
      role: 'Maintenance Engineer' as UserRole,
      division: 'RMC Mumbai (Western Region)',
      desc: 'Sensor calibration & work orders',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    },
    {
      label: 'Meteorologist / QC',
      email: 'qc.scientist@imd.gov.in',
      role: 'Meteorologist / Data Quality Expert' as UserRole,
      division: 'National Climate Center, Pune',
      desc: 'Synoptic coherence & WMO audit',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
    }
  ];

  const handleApplyProfile = (p: typeof demoProfiles[0]) => {
    setEmail(p.email);
    setRole(p.role);
    setDivision(p.division);
    setPassword('AeroGuard@2026');
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid departmental email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your authentication passkey.');
      return;
    }

    setLoading(true);

    // Simulate authentication verification
    setTimeout(() => {
      setLoading(false);
      const displayName =
        role === 'Network Administrator'
          ? 'System Administrator'
          : role === 'AWS Network Operator'
          ? 'Shift Duty Operator'
          : role === 'Maintenance Engineer'
          ? 'Senior Field Specialist'
          : 'Lead Quality Meteorologist';

      const userData = {
        email,
        role,
        name: displayName,
        division
      };

      // Save to localStorage for persistence
      localStorage.setItem('aeroguard_auth', JSON.stringify(userData));

      if (onSignInSuccess) {
        onSignInSuccess(userData);
      }

      setSuccessMsg(`Welcome, ${displayName}. Telemetry access granted.`);
      setTimeout(() => {
        navigate('/');
      }, 600);
    }, 800);
  };

  return (
    <div className="min-h-screen w-full bg-[#081220] flex flex-col justify-between font-sans relative overflow-hidden select-none">
      {/* Background Decorative Meteorological Mesh & Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-2xl" />
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }} 
        />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 px-8 py-5 flex items-center justify-between border-b border-slate-800/80 bg-[#081220]/80 backdrop-blur-md">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-sm">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-lg font-mono text-white">AEROGUARD</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans tracking-wide">
              Observe. Validate. Trust. Act.
            </p>
          </div>
        </div>

        {/* National Emblem & Jurisdiction badge */}
        <div className="hidden sm:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-400 font-mono font-semibold">National Synoptic Mesh</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">1,248 Stations Live</span>
          </div>

          <button
            onClick={() => navigate('/')}
            className="text-xs text-slate-400 hover:text-teal-400 transition-colors flex items-center gap-1 font-medium"
          >
            <span>Skip to Live Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Split Section */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16">
        
        {/* Left Column: Platform Intelligence & Synoptic Highlights */}
        <div className="w-full lg:w-1/2 space-y-6 text-left">
          {/* Government & Hackathon Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700">
              <Building2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Ministry of Earth Sciences &bull; IMD</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 font-mono">
              Smart India Hackathon 2026
            </span>
          </div>

          {/* Headline */}
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-sans text-white tracking-tight leading-tight">
              AI-Powered AWS Observation Quality &amp; Sensor Intelligence
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 font-sans leading-relaxed">
              Turning raw automatic weather station observations into trusted, explainable and actionable meteorological intelligence.
            </p>
          </div>

          {/* Key Metric Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/90 shadow-sm">
              <div className="text-xl font-bold font-mono text-teal-400">1,248</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Synoptic AWS Nodes</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/90 shadow-sm">
              <div className="text-xl font-bold font-mono text-emerald-400">99.4%</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Trust Score Accuracy</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/90 shadow-sm">
              <div className="text-xl font-bold font-mono text-sky-400">15 min</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Real-time Inference</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/90 shadow-sm">
              <div className="text-xl font-bold font-mono text-cyan-400">WMO-8</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Standard Compliant</div>
            </div>
          </div>

          {/* Feature List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <div className="p-1 rounded bg-teal-500/10 text-teal-400 mt-0.5 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-xs text-slate-300 leading-snug">
                <strong className="text-white font-medium">Multi-Layered Spatial &amp; Temporal Physics Checks:</strong> Instant differentiation between genuine extreme weather fronts and sensor hardware transducer failure.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1 rounded bg-teal-500/10 text-teal-400 mt-0.5 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-xs text-slate-300 leading-snug">
                <strong className="text-white font-medium">Explainable AI Anomaly Engine:</strong> Six-factor evidence breakdown with transparent sensor drift decay forecasting and automated technician work orders.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Sign In Card */}
        <div className="w-full lg:w-[480px]">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-7 sm:p-8 relative">
            
            {/* Form Title */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 font-sans tracking-tight">
                      Sign In to Console
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      National AWS Quality Monitoring System
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  SECURE AUTH
                </span>
              </div>
            </div>

            {/* Quick Demo Role Selector (Judges & Evaluators) */}
            <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200/90">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>1-Click Demo Profiles (For SIH Evaluation)</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {demoProfiles.map((p) => {
                  const isSelected = role === p.role;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleApplyProfile(p)}
                      className={`text-left p-2 rounded-lg border text-xs transition-all ${
                        isSelected
                          ? 'bg-teal-50/80 border-teal-500 text-teal-900 shadow-2xs font-semibold'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="font-semibold text-xs leading-tight flex items-center justify-between">
                        <span>{p.label}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5 font-normal">
                        {p.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error or Success Alerts */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Departmental Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Departmental Email / Gov ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@imd.gov.in"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 text-slate-800 transition-colors bg-white font-sans"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Security Passkey / Password
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('For the SIH evaluation demo, select any 1-click profile above. Default password has been configured.')}
                    className="text-[11px] text-teal-600 hover:text-teal-800 font-medium transition-colors"
                  >
                    Forgot Key?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter security key"
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 text-slate-800 transition-colors bg-white font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Operational Role Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Operational Role Assignment
                </label>
                <div className="relative">
                  <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 text-slate-800 transition-colors bg-white font-sans cursor-pointer appearance-none"
                  >
                    <option value="Network Administrator">Network Administrator</option>
                    <option value="AWS Network Operator">AWS Network Operator</option>
                    <option value="Maintenance Engineer">Maintenance Engineer</option>
                    <option value="Meteorologist / Data Quality Expert">Meteorologist / Data Quality Expert</option>
                  </select>
                </div>
              </div>

              {/* Regional Division */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Regional Meteorological Center (RMC)
                </label>
                <div className="relative">
                  <Radio className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 text-slate-800 transition-colors bg-white font-sans cursor-pointer appearance-none"
                  >
                    <option value="IMD HQ — Mausam Bhawan, New Delhi">IMD HQ — Mausam Bhawan, New Delhi</option>
                    <option value="RMC New Delhi (Northern Synoptic Grid)">RMC New Delhi (Northern Region)</option>
                    <option value="RMC Mumbai (Western Region)">RMC Mumbai (Western Region)</option>
                    <option value="RMC Chennai (Southern Region)">RMC Chennai (Southern Region)</option>
                    <option value="RMC Kolkata (Eastern Region)">RMC Kolkata (Eastern Region)</option>
                    <option value="RMC Guwahati (North-Eastern Region)">RMC Guwahati (North-East Region)</option>
                    <option value="National Climate Center, Pune">National Climate Center, Pune</option>
                  </select>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                  />
                  <span className="text-xs text-slate-600 font-sans">
                    Remember this secure terminal
                  </span>
                </label>

                <span className="text-[11px] text-slate-400 font-mono">
                  TLS 1.3 Active
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </span>
                ) : (
                  <>
                    <span>Sign In to Operational Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Compliance Footer inside card */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>Restricted Government Access</span>
              <span className="font-mono">MoES / IMD &bull; Level-3 Auth</span>
            </div>
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="relative z-10 px-8 py-4 border-t border-slate-800/80 bg-[#081220]/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          <span>&copy; 2026 AEROGUARD &bull; Smart India Hackathon &bull; Ministry of Earth Sciences (IMD)</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
          <span>WMO-No. 8 Standardized</span>
          <span>&bull;</span>
          <span>ISO/IEC 27001 Certified Security</span>
          <span>&bull;</span>
          <span className="text-teal-400 font-mono">v1.0.0-PROD</span>
        </div>
      </footer>
    </div>
  );
};

export default SignIn;
