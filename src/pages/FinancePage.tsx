import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminDebtView } from '@/components/finance/AdminDebtView';
import { AdminExpenseView } from '@/components/finance/AdminExpenseView';
import { AthleteDebtView } from '@/components/finance/AthleteDebtView';
import { FinanceReportPanel } from '@/components/finance/FinanceReportPanel';

export default function FinancePage() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Finanças" description="Visualize suas pendências financeiras com o clube" />
        <AthleteDebtView />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Finanças" description="Gerencie entradas, saídas e relatórios do clube" />
      <Tabs defaultValue="income" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="income">Entradas</TabsTrigger>
          <TabsTrigger value="expense">Saídas</TabsTrigger>
          <TabsTrigger value="report">Relatório</TabsTrigger>
        </TabsList>
        <TabsContent value="income" className="mt-0"><AdminDebtView /></TabsContent>
        <TabsContent value="expense" className="mt-0"><AdminExpenseView /></TabsContent>
        <TabsContent value="report" className="mt-0"><FinanceReportPanel /></TabsContent>
      </Tabs>
    </div>
  );
}
