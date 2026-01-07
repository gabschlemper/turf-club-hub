import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginPage } from './LoginPage';
import { DashboardPage } from './DashboardPage';
import { EventsPage } from './EventsPage';
import { AttendancePage } from './AttendancePage';
import { DebtsPage } from './DebtsPage';
import { TeamFinancesPage } from './TeamFinancesPage';
import { AthletesPage } from './AthletesPage';
import { Sidebar } from '@/components/layout/Sidebar';

const Index = () => {
  const { isAuthenticated, user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'events':
        return <EventsPage />;
      case 'attendance':
        return <AttendancePage />;
      case 'debts':
        return <DebtsPage />;
      case 'team-finances':
        return <TeamFinancesPage />;
      case 'athletes':
        return user?.role === 'admin' ? <AthletesPage /> : <DashboardPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="ml-64 p-8">
        {renderPage()}
      </main>
    </div>
  );
};

export default Index;
