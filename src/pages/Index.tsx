import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginPage } from './LoginPage';
import { DashboardPage } from './DashboardPage';
import { EventsPage } from './EventsPage';
import { AthletesPage } from './AthletesPage';
import { AttendancePage } from './AttendancePage';
import { FrequencyPage } from './FrequencyPage';
import TrainingConfirmationPage from './TrainingConfirmationPage';
import RotationPage from './RotationPage';
import AuditsPage from './AuditsPage';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Loader2, Menu } from 'lucide-react';

const Index = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'events':
        return <EventsPage />;
      case 'athletes':
        return user?.role === 'admin' ? <AthletesPage /> : <DashboardPage />;
      case 'attendance':
        return <AttendancePage />;
      case 'frequency':
        return <FrequencyPage />;
      case 'training-confirmation':
        return <TrainingConfirmationPage />;
      case 'rotation':
        return <RotationPage />;
      case 'audits':
        return user?.role === 'admin' ? <AuditsPage /> : <DashboardPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-30">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="bg-background shadow-md"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        {renderPage()}
      </main>
    </div>
  );
};

export default Index;
