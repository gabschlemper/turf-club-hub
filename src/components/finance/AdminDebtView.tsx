import { useState, useMemo } from 'react';
import { Plus, Users, Search, Filter, Wallet, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DebtCard } from './DebtCard';
import { DebtFormDialog } from './DebtFormDialog';
import { BulkDebtDialog } from './BulkDebtDialog';
import { useDebts, type DebtWithAthlete, type Debt } from '@/hooks/useDebts';
import { useAuth } from '@/contexts/AuthContext';

export function AdminDebtView() {
  const { user } = useAuth();
  const { debts, isLoading, createDebt, createBulkDebts, updateDebt, markAsPaid, deleteDebt } = useDebts();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'paid' | 'overdue'>('all');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtWithAthlete | Debt | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [payConfirmId, setPayConfirmId] = useState<string | null>(null);

  // Filter debts
  const filteredDebts = useMemo(() => {
    return debts.filter(debt => {
      // Search filter
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        debt.description.toLowerCase().includes(searchLower) ||
        (debt.athletes?.name?.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;

      // Status filter
      const isPaid = !!debt.paid_at;
      const isOverdue = !isPaid && new Date(debt.due_date) < new Date();

      switch (statusFilter) {
        case 'open':
          return !isPaid;
        case 'paid':
          return isPaid;
        case 'overdue':
          return isOverdue;
        default:
          return true;
      }
    });
  }, [debts, search, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const open = debts.filter(d => !d.paid_at);
    const paid = debts.filter(d => d.paid_at);
    const overdue = open.filter(d => new Date(d.due_date) < new Date());

    return {
      totalOpen: open.reduce((acc, d) => acc + Number(d.amount), 0),
      totalPaid: paid.reduce((acc, d) => acc + Number(d.paid_amount || d.amount), 0),
      openCount: open.length,
      paidCount: paid.length,
      overdueCount: overdue.length,
    };
  }, [debts]);

  const handleCreateDebt = async (data: { athlete_id: string; description: string; amount: number; due_date: string }) => {
    await createDebt.mutateAsync({
      ...data,
      created_by: user?.id,
    });
    setFormDialogOpen(false);
  };

  const handleUpdateDebt = async (data: { athlete_id: string; description: string; amount: number; due_date: string }) => {
    if (!editingDebt) return;
    await updateDebt.mutateAsync({
      id: editingDebt.id,
      description: data.description,
      amount: data.amount,
      due_date: data.due_date,
    });
    setEditingDebt(null);
    setFormDialogOpen(false);
  };

  const handleBulkCreate = async (debts: { athlete_id: string; description: string; amount: number; due_date: string }[]) => {
    await createBulkDebts.mutateAsync(
      debts.map(d => ({ ...d, created_by: user?.id }))
    );
    setBulkDialogOpen(false);
  };

  const handleEdit = (debt: DebtWithAthlete | Debt) => {
    setEditingDebt(debt);
    setFormDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    await deleteDebt.mutateAsync(deleteConfirmId);
    setDeleteConfirmId(null);
  };

  const handleMarkPaid = async () => {
    if (!payConfirmId) return;
    await markAsPaid.mutateAsync({ id: payConfirmId });
    setPayConfirmId(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24" />
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className={stats.openCount > 0 ? "border-amber-500/30 bg-amber-500/5" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Em Aberto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold tabular-nums ${stats.openCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
              R$ {stats.totalOpen.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.openCount} {stats.openCount === 1 ? 'dívida' : 'dívidas'}
              {stats.overdueCount > 0 && (
                <span className="text-destructive ml-1">
                  ({stats.overdueCount} vencida{stats.overdueCount !== 1 ? 's' : ''})
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total Recebido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              R$ {stats.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.paidCount} {stats.paidCount === 1 ? 'pagamento' : 'pagamentos'}
            </p>
          </CardContent>
        </Card>

        <Card className={stats.overdueCount > 0 ? "border-destructive/30 bg-destructive/5" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Vencidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold tabular-nums ${stats.overdueCount > 0 ? 'text-destructive' : 'text-foreground'}`}>
              {stats.overdueCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.overdueCount === 0 ? 'Nenhuma dívida vencida' : 'dívidas com atraso'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={() => { setEditingDebt(null); setFormDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Dívida
        </Button>
        <Button variant="outline" onClick={() => setBulkDialogOpen(true)} className="gap-2">
          <Users className="w-4 h-4" />
          Lançar em Massa
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por atleta ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="open">Em aberto</SelectItem>
            <SelectItem value="paid">Pagas</SelectItem>
            <SelectItem value="overdue">Vencidas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Debt List */}
      <div className="space-y-3">
        {filteredDebts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Wallet className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                {search || statusFilter !== 'all' 
                  ? 'Nenhuma dívida encontrada com os filtros aplicados'
                  : 'Nenhuma dívida registrada'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDebts.map(debt => (
            <DebtCard
              key={debt.id}
              debt={debt}
              showAthlete
              showActions
              onEdit={handleEdit}
              onDelete={(id) => setDeleteConfirmId(id)}
              onMarkPaid={(id) => setPayConfirmId(id)}
            />
          ))
        )}
      </div>

      {/* Form Dialog */}
      <DebtFormDialog
        open={formDialogOpen}
        onOpenChange={(open) => {
          setFormDialogOpen(open);
          if (!open) setEditingDebt(null);
        }}
        debt={editingDebt}
        onSubmit={editingDebt ? handleUpdateDebt : handleCreateDebt}
        isLoading={createDebt.isPending || updateDebt.isPending}
      />

      {/* Bulk Dialog */}
      <BulkDebtDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        onSubmit={handleBulkCreate}
        isLoading={createBulkDebts.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Dívida</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta dívida? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pay Confirmation */}
      <AlertDialog open={!!payConfirmId} onOpenChange={() => setPayConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja marcar esta dívida como paga? O pagamento será registrado com a data atual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkPaid}>
              Confirmar Pagamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
