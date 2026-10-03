import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Shield, RefreshCw, UserCheck, Bell, LogOut } from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  userEmail?: string;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  onRefresh,
  isRefreshing = false,
  userEmail,
  onSignOut
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/stations?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-5 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.02)] select-none">
      {/* Brand & Title */}
      <div className="flex items-center gap-4">
        <div 
          onClick={() => navigate('/')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-600 group-hover:border-teal-400 group-hover:bg-teal-100/50 transition-all shadow-2xs">
            <Shield className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-lg font-mono text-slate-800">
                AEROGUARD
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-sans tracking-wide">
              Observe. Validate. Trust. Act.
            </p>
          </div>
        </div>

        {/* Live Stream Telemetry Indicator */}
        <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-200 text-xs text-slate-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-emerald-600 font-semibold">15-min Synoptic Feed</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-mono">1,248 AWS Active</span>
        </div>
      </div>

      {/* Center Search Bar */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search AWS Station ID, Name, State, or District..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors font-sans"
          />
        </div>
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh Real-time Synoptic Data"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        )}

        {/* Alerts shortcut */}
        <button
          onClick={() => navigate('/alerts')}
          className="relative p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all"
          title="Active Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500"></span>
        </button>

        {/* Role Switcher */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <UserCheck className="w-4 h-4 text-teal-600 hidden sm:block" />
          <select
            value={currentRole}
            onChange={(e) => onRoleChange(e.target.value as UserRole)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer shadow-2xs font-sans"
          >
            <option value="AWS Network Operator">AWS Network Operator</option>
            <option value="Maintenance Engineer">Maintenance Engineer</option>
            <option value="Meteorologist / Data Quality Expert">Meteorologist / Data Quality Expert</option>
            <option value="Network Administrator">Network Administrator</option>
          </select>
        </div>

        {/* Sign Out Button */}
        <div className="flex items-center pl-2 border-l border-slate-200">
          <button
            onClick={() => {
              if (onSignOut) {
                onSignOut();
              } else {
                localStorage.removeItem('aeroguard_auth');
                navigate('/login');
              }
            }}
            title="Sign out of console"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
