import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Expense = Tables<'expenses'>;
export type ExpenseInsert = TablesInsert<'expenses'>;
export type ExpenseUpdate = TablesUpdate<'expenses'>;

export interface ExpenseFormValues {
  name: string;
  description?: string | null;
  amount: number;
  expense_date: string; // YYYY-MM-DD
}

export function useExpenses() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['expenses', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .is('deleted_at', null)
        .order('expense_date', { ascending: false });
      if (error) throw error;
      return data as Expense[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['expenses', user?.id] });
    qc.refetchQueries({ queryKey: ['expenses', user?.id] });
  };

  const createExpense = useMutation({
    mutationFn: async (values: ExpenseFormValues) => {
      const payload: ExpenseInsert = {
        club_id: user!.clubId!,
        created_by: user?.id,
        name: values.name.trim(),
        description: values.description?.trim() || null,
        amount: values.amount,
        expense_date: values.expense_date,
      };
      const { data, error } = await supabase.from('expenses').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Saída registrada', description: 'A despesa foi criada com sucesso.' });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Erro ao criar saída', description: e.message }),
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, ...values }: ExpenseFormValues & { id: string }) => {
      const { data, error } = await supabase
        .from('expenses')
        .update({
          name: values.name.trim(),
          description: values.description?.trim() || null,
          amount: values.amount,
          expense_date: values.expense_date,
        })
        .eq('id', id)
        .is('deleted_at', null)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Saída atualizada' });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Erro', description: e.message }),
  });

  const markAsPaid = useMutation({
    mutationFn: async ({ id, paidAmount }: { id: string; paidAmount?: number }) => {
      const payload: ExpenseUpdate = { paid_at: new Date().toISOString() };
      if (typeof paidAmount === 'number') payload.paid_amount = paidAmount;

      const { data, error } = await supabase
        .from('expenses')
        .update(payload)
        .eq('id', id)
        .is('deleted_at', null)
        .select()
        .single();
      if (error || !data) throw new Error('Não foi possível registrar o pagamento.');

      if (typeof paidAmount !== 'number' && data.paid_amount == null) {
        const { data: synced } = await supabase
          .from('expenses')
          .update({ paid_amount: data.amount })
          .eq('id', id)
          .select()
          .single();
        return synced ?? data;
      }
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Pagamento registrado', description: 'A saída foi marcada como paga.' });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Erro', description: e.message }),
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Saída excluída' });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Erro', description: e.message }),
  });

  return {
    expenses: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createExpense,
    updateExpense,
    markAsPaid,
    deleteExpense,
  };
}
