import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { AdminDebtView } from '@/components/finance/AdminDebtView';
import { AthleteDebtView } from '@/components/finance/AthleteDebtView';

export default function FinancePage() {
  const { isAdmin } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finanças"
        description={isAdmin 
          ? "Gerencie as dívidas e pagamentos dos atletas" 
          : "Visualize suas pendências financeiras com o clube"
        }
      />

      {isAdmin ? <AdminDebtView /> : <AthleteDebtView />}
    </div>
  );
}
