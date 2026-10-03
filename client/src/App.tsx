import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { UserRole } from './types';

// Pages
import { Overview } from './pages/Overview';
import { NetworkMap } from './pages/NetworkMap';
import { Stations } from './pages/Stations';
import { StationDetail } from './pages/StationDetail';
import { Alerts } from './pages/Alerts';
import { AlertInvestigation } from './pages/AlertInvestigation';
import { SensorHealth } from './pages/SensorHealth';
import { Maintenance } from './pages/Maintenance';
import { SimulationLab } from './pages/SimulationLab';
import { Reports } from './pages/Reports';
import { AuditLogs } from './pages/AuditLogs';
import { SignIn } from './pages/SignIn';

const AppContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [currentRole, setCurrentRole] = useState<UserRole>('AWS Network Operator');
  const [userEmail, setUserEmail] = useState<string>('operator@aeroguard.gov.in');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load saved session if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('aeroguard_auth');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.role) setCurrentRole(parsed.role);
        if (parsed.email) setUserEmail(parsed.email);
      }
    } catch {
      // fallback to default
    }
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleSignOut = () => {
    localStorage.removeItem('aeroguard_auth');
    navigate('/login');
  };

  const handleSignInSuccess = (user: { email: string; role: UserRole }) => {
    setCurrentRole(user.role);
    setUserEmail(user.email);
  };

  // If on login or signin route, render full-screen authentication portal
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/signin';

  if (isAuthRoute) {
    return <SignIn onSignInSuccess={handleSignInSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      {/* Top Control Navbar */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        userEmail={userEmail}
        onSignOut={handleSignOut}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Main Sidebar */}
        <Sidebar />

        {/* Dynamic Content Body */}
        <main key={refreshKey} className="flex-1 overflow-y-auto bg-[#F8FAFC] min-h-[calc(100vh-4rem)]">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/network-map" element={<NetworkMap />} />
            <Route path="/stations" element={<Stations />} />
            <Route path="/stations/:id" element={<StationDetail />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/alerts/:id" element={<AlertInvestigation />} />
            <Route path="/sensor-health" element={<SensorHealth />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/simulation-lab" element={<SimulationLab />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            {/* Fallback to Overview */}
            <Route path="*" element={<Overview />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
