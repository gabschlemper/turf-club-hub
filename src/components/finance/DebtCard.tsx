import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, Clock, AlertTriangle, MoreVertical, Pencil, Trash2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { DebtWithAthlete, Debt } from '@/hooks/useDebts';
import { parseLocalDate } from '@/lib/dateUtils';

interface DebtCardProps {
  debt: DebtWithAthlete | Debt;
  showAthlete?: boolean;
  showActions?: boolean;
  onEdit?: (debt: DebtWithAthlete | Debt) => void;
  onDelete?: (id: string) => void;
  onMarkPaid?: (id: string) => void;
}

export function DebtCard({ 
  debt, 
  showAthlete = false, 
  showActions = false,
  onEdit,
  onDelete,
  onMarkPaid,
}: DebtCardProps) {
  const dueDate = parseLocalDate(debt.due_date);
  const isPaid = !!debt.paid_at;
  const isOverdue = !isPaid && isPast(dueDate) && !isToday(dueDate);
  const isDueToday = !isPaid && isToday(dueDate);

  const athleteName = 'athletes' in debt && debt.athletes ? debt.athletes.name : null;

  const getStatusBadge = () => {
    if (isPaid) {
      return (
        <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
          <Check className="w-3 h-3 mr-1" />
          Pago
        </Badge>
      );
    }
    if (isOverdue) {
      return (
        <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Vencida
        </Badge>
      );
    }
    if (isDueToday) {
      return (
        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
          <Clock className="w-3 h-3 mr-1" />
          Vence Hoje
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <Clock className="w-3 h-3 mr-1" />
        Em aberto
      </Badge>
    );
  };

  return (
    <Card className={cn(
      "transition-all duration-200",
      isPaid && "opacity-75",
      isOverdue && "border-destructive/50",
      isDueToday && "border-amber-500/50"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            {showAthlete && athleteName && (
              <p className="text-sm font-semibold text-foreground truncate">
                {athleteName}
              </p>
            )}
            <p className={cn(
              "text-sm",
              showAthlete ? "text-muted-foreground" : "font-medium text-foreground"
            )}>
              {debt.description}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Vencimento: {format(dueDate, "dd 'de' MMM, yyyy", { locale: ptBR })}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end gap-1">
              <span className={cn(
                "text-lg font-bold tabular-nums",
                isPaid ? "text-emerald-600 dark:text-emerald-400" : 
                isOverdue ? "text-destructive" : "text-foreground"
              )}>
                R$ {Number(debt.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              {getStatusBadge()}
            </div>

            {showActions && !isPaid && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onMarkPaid?.(debt.id)}>
                    <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
                    Marcar como Pago
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit?.(debt)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(debt.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {isPaid && debt.paid_at && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Pago em {format(new Date(debt.paid_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              {debt.paid_amount && Number(debt.paid_amount) !== Number(debt.amount) && (
                <span className="ml-1">
                  (R$ {Number(debt.paid_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                </span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
