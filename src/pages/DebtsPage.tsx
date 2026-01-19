import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { DebtCard } from '@/components/cards/DebtCard';
import { Button } from '@/components/ui/button';
import { mockDebts, mockAthletes } from '@/data/mockData';
import { Plus, Filter, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type DebtFilter = 'all' | 'pending' | 'overdue' | 'paid';

export function DebtsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [filter, setFilter] = useState<DebtFilter>('all');

  const userDebts = isAdmin 
    ? mockDebts 
    : mockDebts.filter(d => d.athleteId === user?.id);

  const filteredDebts = userDebts.filter(debt => {
    if (filter === 'all') return true;
    if (filter === 'pending') return debt.status === 'pending';
    if (filter === 'overdue') return debt.status === 'overdue';
    if (filter === 'paid') return debt.status === 'paid';
    return true;
  });

  const filterOptions: { value: DebtFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'pending', label: 'Pendentes' },
    { value: 'overdue', label: 'Vencidos' },
    { value: 'paid', label: 'Pagos' },
  ];

  const totalPending = userDebts
    .filter(d => d.status !== 'paid')
    .reduce((sum, d) => sum + d.amount, 0);

  const getAthleteName = (athleteId: string) => {
    return mockAthletes.find(a => a.id === athleteId)?.name || 'Desconhecido';
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isAdmin ? "Gestão Financeira" : "Minhas Pendências"}
        description={isAdmin ? "Gerencie as dívidas dos atletas" : "Visualize seus débitos com o clube"}
        action={isAdmin && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <Users className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Criar em Massa</span>
              <span className="sm:hidden">Em Massa</span>
            </Button>
            <Button variant="gradient" size="sm" className="w-full sm:w-auto">
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Nova Dívida</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </div>
        )}
      />

      {/* Summary Card */}
      <div className={cn(
        "p-4 sm:p-6 rounded-xl mb-4 sm:mb-6 border",
        totalPending > 0 
          ? "bg-warning/10 border-warning/20" 
          : "bg-success/10 border-success/20"
      )}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
              {isAdmin ? 'Total em Aberto' : 'Seu Saldo Devedor'}
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">
              R$ {totalPending.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {userDebts.filter(d => d.status !== 'paid').length} pendência(s)
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        {filterOptions.map(option => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={cn(
              "px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap",
              filter === option.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Debts List */}
      {isAdmin ? (
        <div className="space-y-3 sm:space-y-4">
          {filteredDebts.map(debt => (
            <div key={debt.id} className="p-3 sm:p-4 rounded-xl bg-card border border-border">
              <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm sm:text-base text-foreground truncate">{debt.description}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Atleta: {getAthleteName(debt.athleteId)}
                  </p>
                </div>
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 sm:py-1 rounded-full flex-shrink-0",
                  debt.status === 'paid' && "bg-success/10 text-success",
                  debt.status === 'pending' && "bg-warning/10 text-warning",
                  debt.status === 'overdue' && "bg-destructive/10 text-destructive"
                )}>
                  {debt.status === 'paid' ? 'Pago' : debt.status === 'pending' ? 'Pendente' : 'Vencido'}
                </span>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Vencimento: {format(debt.dueDate, "dd/MM/yyyy", { locale: ptBR })}
                </p>
                <p className="text-base sm:text-lg font-bold text-foreground">
                  R$ {debt.amount.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDebts.map(debt => (
            <DebtCard key={debt.id} debt={debt} />
          ))}
        </div>
      )}

      {filteredDebts.length === 0 && (
        <div className="p-12 rounded-xl bg-card border border-border text-center">
          <p className="text-muted-foreground">Nenhuma dívida encontrada</p>
        </div>
      )}
    </div>
  );
}
