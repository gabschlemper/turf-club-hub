import { Wallet, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DebtCard } from './DebtCard';
import { useMyDebts } from '@/hooks/useDebts';

export function AthleteDebtView() {
  const { debts, isLoading, totalOpen, totalPaid } = useMyDebts();

  const openDebts = debts.filter(d => !d.paid_at);
  const paidDebts = debts.filter(d => d.paid_at);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className={openDebts.length > 0 ? "border-amber-500/30 bg-amber-500/5" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Em Aberto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold tabular-nums ${openDebts.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
              R$ {totalOpen.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {openDebts.length} {openDebts.length === 1 ? 'pendência' : 'pendências'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {paidDebts.length} {paidDebts.length === 1 ? 'pagamento' : 'pagamentos'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Debt List */}
      <Tabs defaultValue="open" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="open" className="gap-2">
            <Wallet className="w-4 h-4" />
            Em Aberto ({openDebts.length})
          </TabsTrigger>
          <TabsTrigger value="paid" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Pagas ({paidDebts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="mt-4 space-y-3">
          {openDebts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Wallet className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  Você não possui dívidas em aberto
                </p>
              </CardContent>
            </Card>
          ) : (
            openDebts.map(debt => (
              <DebtCard key={debt.id} debt={debt} />
            ))
          )}
        </TabsContent>

        <TabsContent value="paid" className="mt-4 space-y-3">
          {paidDebts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  Nenhum pagamento registrado
                </p>
              </CardContent>
            </Card>
          ) : (
            paidDebts.map(debt => (
              <DebtCard key={debt.id} debt={debt} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
