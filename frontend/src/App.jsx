import React, { useEffect, useState } from 'react';
import { AuthRoleProvider, useAuthRole } from './context/AuthRoleContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import WebsiteHomePage from './pages/WebsiteHomePage';

import DashboardHome from './pages/DashboardHome';
import GisMapPage from './pages/GisMapPage';
import RepositoryPage from './pages/RepositoryPage';
import SemanticSearchPage from './pages/SemanticSearchPage';
import PolicySimulationPage from './pages/PolicySimulationPage';
import ResearchAssistantPage from './pages/ResearchAssistantPage';
import AnalyticsPage from './pages/AnalyticsPage';
import IntelligenceCenterPage from './pages/IntelligenceCenterPage';

function AppContent() {
  const { user, loading, login, permissions } = useAuthRole();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [route, setRoute] = useState(window.location.pathname || '/');
  const [preloadedSearchQuery, setPreloadedSearchQuery] = useState('');
  const [selectedDistrictForSim, setSelectedDistrictForSim] = useState(1);
  const [selectedDocIdsForAssistant, setSelectedDocIdsForAssistant] = useState([1, 2, 3]);

  const navigate = (next) => { window.history.pushState({}, '', next); setRoute(next); window.scrollTo(0, 0); };

  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname || '/');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (user && route !== '/app') navigate('/app');
  }, [user, route]);

  if (loading) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading BhoomiIntel…</div>;
  }

  if (!user && route !== '/login') return <WebsiteHomePage onSignIn={() => navigate('/login')} onExplore={() => document.getElementById('platform')?.scrollIntoView({ behavior: 'smooth' })} />;
  if (!user) return <LoginPage onLogin={(nextUser) => { login(nextUser); navigate('/app'); }} onBack={() => navigate('/')} />;

  const handleSelectDistrictForSim = (districtId) => {
    if (!permissions.canRunSimulations) return;
    setSelectedDistrictForSim(districtId);
    setActiveTab('simulator');
  };

  const handlePreloadSearchQuery = (query) => {
    setPreloadedSearchQuery(query);
    setActiveTab('search');
  };

  const handleSelectDocsForAssistant = (docIds) => {
    setSelectedDocIdsForAssistant(docIds);
    setActiveTab('assistant');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <div className="flex-1 flex flex-row">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardHome setActiveTab={setActiveTab} onSelectDistrictForSim={handleSelectDistrictForSim} />
          )}
          {activeTab === 'gis-map' && (
            <GisMapPage onSelectDistrictForSim={handleSelectDistrictForSim} setActiveTab={setActiveTab} />
          )}
          {activeTab === 'repository' && (
            <RepositoryPage setActiveTab={setActiveTab} onPreloadSearchQuery={handlePreloadSearchQuery} onSelectDocsForAssistant={handleSelectDocsForAssistant} />
          )}
          {activeTab === 'search' && <SemanticSearchPage preloadedQuery={preloadedSearchQuery} setActiveTab={setActiveTab} />}
          {activeTab === 'simulator' && <PolicySimulationPage preselectedDistrictId={selectedDistrictForSim} setActiveTab={setActiveTab} />}
          {activeTab === 'assistant' && <ResearchAssistantPage preselectedDocIds={selectedDocIdsForAssistant} setActiveTab={setActiveTab} />}
          {activeTab === 'analytics' && <AnalyticsPage />}
          {activeTab === 'intelligence' && <IntelligenceCenterPage />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthRoleProvider>
      <AppContent />
    </AuthRoleProvider>
  );
}
