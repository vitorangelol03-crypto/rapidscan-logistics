import React, { useState } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/supervisor/Dashboard';
import { Control } from './pages/supervisor/Control';
import { GroupsAndRoutes } from './pages/supervisor/GroupsAndRoutes';
import { Import } from './pages/supervisor/Import';
import { Employees } from './pages/supervisor/Employees';
import { Settings } from './pages/supervisor/Settings';
import { Scanner } from './pages/operator/Scanner';
import { History } from './pages/operator/History';
import { UserRole } from './types';

const Main: React.FC = () => {
  const { currentUser } = useApp();
  const [page, setPage] = useState<string>('');

  if (!currentUser) {
    return <Login />;
  }

  // Initial page redirect based on role
  if (!page) {
    if (currentUser.role === UserRole.SUPERVISOR) setPage('dashboard');
    else setPage('scanner');
  }

  const renderPage = () => {
    if (currentUser.role === UserRole.SUPERVISOR) {
      switch (page) {
        case 'dashboard': return <Dashboard />;
        case 'control': return <Control />;
        case 'routes': return <GroupsAndRoutes view="monitoring" />;
        case 'groups': return <GroupsAndRoutes view="management" />;
        case 'import': return <Import />;
        case 'employees': return <Employees />;
        case 'clean': return <Settings />;
        case 'reports': return <div className="text-center text-gray-500 mt-20">Relatórios avançados (Placeholder)</div>;
        default: return <Dashboard />;
      }
    } else {
      switch (page) {
        case 'scanner': return <Scanner />;
        case 'history': return <History />;
        default: return <Scanner />;
      }
    }
  };

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      {renderPage()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Main />
    </AppProvider>
  );
};

export default App;