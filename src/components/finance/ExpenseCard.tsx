import { format, isPast, isToday } from 'date-fns';
import { Check, Clock, AlertTriangle, MoreVertical, Pencil, Trash2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { parseLocalDate } from '@/lib/dateUtils';
import type { Expense } from '@/hooks/useExpenses';

interface Props {
  expense: Expense;
  onEdit?: (e: Expense) => void;
  onDelete?: (id: string) => void;
  onMarkPaid?: (id: string) => void;
}

export function ExpenseCard({ expense, onEdit, onDelete, onMarkPaid }: Props) {
  const date = parseLocalDate(expense.expense_date);
  const isPaid = !!expense.paid_at;
  const isOverdue = !isPaid && isPast(date) && !isToday(date);

  const badge = isPaid ? (
    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"><Check className="w-3 h-3 mr-1" />Pago</Badge>
  ) : isOverdue ? (
    <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20"><AlertTriangle className="w-3 h-3 mr-1" />Atrasado</Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>
  );

  return (
    <Card className={cn('transition-all duration-200', isPaid && 'opacity-75', isOverdue && 'border-destructive/50')}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 space-y-0.5">
            <p className="text-sm font-semibold text-foreground truncate">{expense.name}</p>
            {expense.description && <p className="text-xs text-muted-foreground line-clamp-2">{expense.description}</p>}
            <p className="text-xs text-muted-foreground">Data: {format(date, 'dd/MM/yy')}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex flex-col items-end gap-0.5">
              <span className={cn('text-base sm:text-lg font-bold tabular-nums whitespace-nowrap',
                isPaid ? 'text-emerald-600 dark:text-emerald-400' : isOverdue ? 'text-destructive' : 'text-foreground')}>
                R$ {Number(expense.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              {badge}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0"><MoreVertical className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isPaid && (
                  <DropdownMenuItem onClick={() => onMarkPaid?.(expense.id)}>
                    <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />Marcar como Pago
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onEdit?.(expense)}><Pencil className="w-4 h-4 mr-2" />Editar</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete?.(expense.id)} className="text-destructive focus:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {isPaid && expense.paid_at && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground">Pago em {format(new Date(expense.paid_at), "dd/MM/yyyy 'às' HH:mm")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
