import { useState, useMemo } from 'react';
import { Plus, Search, Filter, Wallet, TrendingDown, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ExpenseCard } from './ExpenseCard';
import { ExpenseFormDialog } from './ExpenseFormDialog';
import { useExpenses, type Expense } from '@/hooks/useExpenses';

export function AdminExpenseView() {
  const { expenses, isLoading, createExpense, updateExpense, markAsPaid, deleteExpense } = useExpenses();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [payId, setPayId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return expenses.filter((e) => {
      const match = e.name.toLowerCase().includes(q) || (e.description ?? '').toLowerCase().includes(q);
      if (!match) return false;
      const isPaid = !!e.paid_at;
      const isOverdue = !isPaid && new Date(e.expense_date) < new Date();
      if (statusFilter === 'paid') return isPaid;
      if (statusFilter === 'pending') return !isPaid;
      if (statusFilter === 'overdue') return isOverdue;
      return true;
    });
  }, [expenses, search, statusFilter]);

  const stats = useMemo(() => {
    const pending = expenses.filter((e) => !e.paid_at);
    const paid = expenses.filter((e) => e.paid_at);
    const overdue = pending.filter((e) => new Date(e.expense_date) < new Date());
    return {
      totalPending: pending.reduce((s, e) => s + Number(e.amount), 0),
      totalPaid: paid.reduce((s, e) => s + Number(e.paid_amount ?? e.amount), 0),
      pendingCount: pending.length,
      paidCount: paid.length,
      overdueCount: overdue.length,
    };
  }, [expenses]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className={stats.pendingCount > 0 ? 'border-amber-500/30 bg-amber-500/5' : ''}>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Wallet className="w-4 h-4" />Pendentes</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold tabular-nums ${stats.pendingCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
              R$ {stats.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{stats.pendingCount} {stats.pendingCount === 1 ? 'saída' : 'saídas'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><TrendingDown className="w-4 h-4" />Total Pago</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">R$ {stats.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-muted-foreground mt-1">{stats.paidCount} {stats.paidCount === 1 ? 'pagamento' : 'pagamentos'}</p>
          </CardContent>
        </Card>
        <Card className={stats.overdueCount > 0 ? 'border-destructive/30 bg-destructive/5' : ''}>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Atrasadas</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold tabular-nums ${stats.overdueCount > 0 ? 'text-destructive' : 'text-foreground'}`}>{stats.overdueCount}</p>
            <p className="text-xs text-muted-foreground mt-1">{stats.overdueCount === 0 ? 'Nenhuma atrasada' : 'com data vencida'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-2"><Plus className="w-4 h-4" />Nova Saída</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou descrição..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-full sm:w-44"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="paid">Pagas</SelectItem>
            <SelectItem value="overdue">Atrasadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card><CardContent className="py-8 text-center">
            <Wallet className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">{search || statusFilter !== 'all' ? 'Nenhuma saída encontrada' : 'Nenhuma saída registrada'}</p>
          </CardContent></Card>
        ) : (
          filtered.map((e) => (
            <ExpenseCard key={e.id} expense={e}
              onEdit={(x) => { setEditing(x); setFormOpen(true); }}
              onDelete={(id) => setDeleteId(id)}
              onMarkPaid={(id) => setPayId(id)} />
          ))
        )}
      </div>

      <ExpenseFormDialog
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        expense={editing}
        onSubmit={async (values) => {
          if (editing) await updateExpense.mutateAsync({ id: editing.id, ...values });
          else await createExpense.mutateAsync(values);
          setFormOpen(false); setEditing(null);
        }}
        isLoading={createExpense.isPending || updateExpense.isPending}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir saída</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (deleteId) { await deleteExpense.mutateAsync(deleteId); setDeleteId(null); } }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!payId} onOpenChange={() => setPayId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmar Pagamento</AlertDialogTitle>
            <AlertDialogDescription>Marcar esta saída como paga? O pagamento será registrado com a data atual.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (payId) { await markAsPaid.mutateAsync({ id: payId }); setPayId(null); } }}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
