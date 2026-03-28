import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { OverviewPanel } from './components/dashboard/OverviewPanel';
import { AnomalyPanel } from './components/dashboard/AnomalyPanel';
import { ActionsPanel } from './components/dashboard/ActionsPanel';
import { AIInsightsPanel } from './components/dashboard/AIInsightsPanel';
import { SavingsPanel } from './components/dashboard/SavingsPanel';
import { SettingsPanel } from './components/dashboard/SettingsPanel';
import { LandingPage } from './components/landing/LandingPage';
import { LoginPage } from './pages/Auth/LoginPage';
import { SignupPage } from './pages/Auth/SignupPage';

type PageType = 'landing' | 'login' | 'signup' | 'dashboard';

function DashboardRoutes() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <OverviewPanel />;
      case 'anomalies': return <AnomalyPanel />;
      case 'insights': return <AIInsightsPanel />;
      case 'actions': return <ActionsPanel />;
      case 'savings': return <SavingsPanel />;
      case 'settings': return <SettingsPanel />;
      default: return <OverviewPanel />;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
}

function AppContent({ currentPage, setCurrentPage }: { currentPage: PageType; setCurrentPage: (page: PageType) => void }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Route based on authentication and current page
  if (!user) {
    if (currentPage === 'login') {
      return <LoginPage onNavigate={setCurrentPage} />;
    }
    if (currentPage === 'signup') {
      return <SignupPage onNavigate={setCurrentPage} />;
    }
    return <LandingPage onNavigate={setCurrentPage} />;
  }

  // User is authenticated, show dashboard
  return <DashboardRoutes />;
}

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('landing');

  return (
    <AuthProvider>
      <AppContent currentPage={currentPage} setCurrentPage={setCurrentPage} />
    </AuthProvider>
  );
}

export default App;
