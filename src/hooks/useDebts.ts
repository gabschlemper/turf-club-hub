import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Debt = Tables<'debts'>;
export type DebtInsert = TablesInsert<'debts'>;
export type DebtUpdate = TablesUpdate<'debts'>;

export interface DebtWithAthlete extends Debt {
  athletes: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export function useDebts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all debts (for admins) with athlete info
  const { data: debts = [], isLoading, error } = useQuery({
    queryKey: ['debts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('debts')
        .select(`
          *,
          athletes:athlete_id (
            id,
            name,
            email
          )
        `)
        .is('deleted_at', null)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as DebtWithAthlete[];
    },
  });

  // Create single debt
  const createDebt = useMutation({
    mutationFn: async (debt: Omit<DebtInsert, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('debts')
        .insert(debt)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      toast({
        title: 'Dívida criada',
        description: 'A dívida foi registrada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar dívida',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Create multiple debts (bulk)
  const createBulkDebts = useMutation({
    mutationFn: async (debts: Omit<DebtInsert, 'id' | 'created_at' | 'updated_at'>[]) => {
      const { data, error } = await supabase
        .from('debts')
        .insert(debts)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      toast({
        title: 'Dívidas criadas',
        description: `${data.length} dívidas foram registradas com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar dívidas',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update debt
  const updateDebt = useMutation({
    mutationFn: async ({ id, ...updates }: DebtUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('debts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      toast({
        title: 'Dívida atualizada',
        description: 'A dívida foi atualizada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar dívida',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mark as paid
  const markAsPaid = useMutation({
    mutationFn: async ({ id, paidAmount }: { id: string; paidAmount?: number }) => {
      const { data: debt } = await supabase
        .from('debts')
        .select('amount')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('debts')
        .update({
          paid_at: new Date().toISOString(),
          paid_amount: paidAmount ?? debt?.amount,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      toast({
        title: 'Pagamento registrado',
        description: 'A dívida foi marcada como paga.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao registrar pagamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Soft delete debt
  const deleteDebt = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('debts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      toast({
        title: 'Dívida excluída',
        description: 'A dívida foi removida com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir dívida',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    debts,
    isLoading,
    error,
    createDebt,
    createBulkDebts,
    updateDebt,
    markAsPaid,
    deleteDebt,
  };
}

// Hook for athletes to view their own debts
export function useMyDebts() {
  const { data: debts = [], isLoading, error } = useQuery({
    queryKey: ['my-debts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .is('deleted_at', null)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as Debt[];
    },
  });

  const totalOpen = debts
    .filter(d => !d.paid_at)
    .reduce((acc, d) => acc + Number(d.amount), 0);

  const totalPaid = debts
    .filter(d => d.paid_at)
    .reduce((acc, d) => acc + Number(d.paid_amount || d.amount), 0);

  return {
    debts,
    isLoading,
    error,
    totalOpen,
    totalPaid,
  };
}
