import { Debt } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface DebtCardProps {
  debt: Debt;
}

export function DebtCard({ debt }: DebtCardProps) {
  const statusConfig = {
    paid: { 
      icon: CheckCircle, 
      bg: 'bg-success/10', 
      text: 'text-success', 
      border: 'border-success/20',
      label: 'Pago' 
    },
    pending: { 
      icon: Clock, 
      bg: 'bg-warning/10', 
      text: 'text-warning', 
      border: 'border-warning/20',
      label: 'Pendente' 
    },
    overdue: { 
      icon: AlertCircle, 
      bg: 'bg-destructive/10', 
      text: 'text-destructive', 
      border: 'border-destructive/20',
      label: 'Vencido' 
    },
  };

  const config = statusConfig[debt.status];
  const Icon = config.icon;

  return (
    <div className={cn(
      "p-5 rounded-xl bg-card border transition-all duration-200 hover:shadow-md animate-fade-in",
      config.border
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{debt.description}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Vencimento: {format(debt.dueDate, "dd/MM/yyyy", { locale: ptBR })}
          </p>
        </div>
        <span className={cn(
          "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full",
          config.bg, config.text
        )}>
          <Icon className="w-3.5 h-3.5" />
          {config.label}
        </span>
      </div>
      
      <div className="flex items-end justify-between mt-4 pt-4 border-t border-border">
        <span className="text-sm text-muted-foreground">Valor</span>
        <span className={cn(
          "text-2xl font-bold",
          debt.status === 'paid' ? 'text-muted-foreground line-through' : 'text-foreground'
        )}>
          R$ {debt.amount.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
