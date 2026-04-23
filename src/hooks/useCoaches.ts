import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface Coach {
  id: string;
  club_id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CoachInput {
  name: string;
  email: string;
}

async function createAuditLog(
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE',
  recordId: string,
  oldData?: unknown,
  newData?: unknown,
) {
  try {
    await supabase.from('audits').insert([{
      action,
      table_name: 'coaches',
      record_id: recordId,
      old_data: (oldData ?? null) as never,
      new_data: (newData ?? null) as never,
    } as never]);
  } catch (err) {
    console.warn('Failed to create coach audit log:', err);
  }
}

export function useCoaches() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const coachesQueryKey = ['coaches', user?.id] as const;

  const coachesQuery = useQuery({
    queryKey: coachesQueryKey,
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [] as Coach[];
      const { data, error } = await (supabase as any)
        .from('coaches')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true });
      if (error) throw error;
      return (data || []) as Coach[];
    },
  });

  const createCoach = useMutation({
    mutationFn: async (input: CoachInput) => {
      const payload = {
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        club_id: user?.clubId,
      };
      const { data, error } = await (supabase as any)
        .from('coaches')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      await createAuditLog('INSERT', data.id, null, data);
      return data as Coach;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachesQueryKey });
      toast({
        title: 'Treinador cadastrado!',
        description: 'O treinador agora pode criar a conta usando este e-mail.',
      });
    },
    onError: (error: Error) => {
      let message = error.message;
      if (message.includes('duplicate key') || message.includes('unique')) {
        message = 'Este e-mail já está cadastrado como treinador';
      }
      toast({ variant: 'destructive', title: 'Erro ao cadastrar treinador', description: message });
    },
  });

  const updateCoach = useMutation({
    mutationFn: async ({ id, ...input }: CoachInput & { id: string }) => {
      const { data: oldData } = await (supabase as any)
        .from('coaches')
        .select('*')
        .eq('id', id)
        .single();
      const { data, error } = await (supabase as any)
        .from('coaches')
        .update({
          name: input.name.trim(),
          email: input.email.trim().toLowerCase(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      await createAuditLog('UPDATE', id, oldData, data);
      return data as Coach;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachesQueryKey });
      toast({ title: 'Treinador atualizado!', description: 'As informações foram salvas.' });
    },
    onError: (error: Error) => {
      let message = error.message;
      if (message.includes('duplicate key') || message.includes('unique')) {
        message = 'Este e-mail já está cadastrado como treinador';
      }
      toast({ variant: 'destructive', title: 'Erro ao atualizar treinador', description: message });
    },
  });

  const deleteCoach = useMutation({
    mutationFn: async (id: string) => {
      const { data: oldData } = await (supabase as any)
        .from('coaches')
        .select('*')
        .eq('id', id)
        .single();
      const { error } = await (supabase as any)
        .from('coaches')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      await createAuditLog('SOFT_DELETE', id, oldData, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachesQueryKey });
      toast({ title: 'Treinador removido', description: 'O treinador foi removido do clube.' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Erro ao remover treinador', description: error.message });
    },
  });

  return {
    coaches: coachesQuery.data || [],
    isLoading: coachesQuery.isLoading,
    error: coachesQuery.error,
    createCoach,
    updateCoach,
    deleteCoach,
  };
}