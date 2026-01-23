import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RotationDuty {
  id: string;
  duty_date: string;
  athlete1_id: string;
  athlete2_id: string;
  athlete3_id?: string | null;
  created_at: string;
  updated_at: string;
  athlete1?: { id: string; name: string; email: string };
  athlete2?: { id: string; name: string; email: string };
  athlete3?: { id: string; name: string; email: string } | null;
}

export function useRotationDuties() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all rotation duties with athlete info
  const dutiesQuery = useQuery({
    queryKey: ['rotation-duties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rotation_duties')
        .select(`
          *,
          athlete1:athletes!rotation_duties_athlete1_id_fkey(id, name, email),
          athlete2:athletes!rotation_duties_athlete2_id_fkey(id, name, email),
          athlete3:athletes!rotation_duties_athlete3_id_fkey(id, name, email)
        `)
        .order('duty_date', { ascending: true });

      if (error) throw error;
      return data as RotationDuty[];
    },
  });

  // Create rotation duty
  const createDuty = useMutation({
    mutationFn: async (duty: { duty_date: string; athlete1_id: string; athlete2_id: string; athlete3_id?: string }) => {
      const { data, error } = await supabase
        .from('rotation_duties')
        .insert(duty)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotation-duties'] });
      toast({
        title: 'Rodízio criado!',
        description: 'O compromisso foi cadastrado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar rodízio',
        description: error.message,
      });
    },
  });

  // Create bulk rotation duties
  const createBulkDuties = useMutation({
    mutationFn: async (duties: { duty_date: string; athlete1_id: string; athlete2_id: string; athlete3_id?: string }[]) => {
      const { data, error } = await supabase
        .from('rotation_duties')
        .insert(duties)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rotation-duties'] });
      toast({
        title: 'Rodízios criados!',
        description: `${data.length} compromissos foram cadastrados com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar rodízios',
        description: error.message,
      });
    },
  });

  // Update rotation duty
  const updateDuty = useMutation({
    mutationFn: async ({ id, ...duty }: { id: string; duty_date?: string; athlete1_id?: string; athlete2_id?: string }) => {
      const { data, error } = await supabase
        .from('rotation_duties')
        .update(duty)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotation-duties'] });
      toast({
        title: 'Rodízio atualizado!',
        description: 'O compromisso foi atualizado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar rodízio',
        description: error.message,
      });
    },
  });

  // Delete rotation duty (soft delete)
  const deleteDuty = useMutation({
    mutationFn: async (id: string) => {
      // Soft delete instead of hard delete
      const { error } = await supabase
        .from('rotation_duties')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotation-duties'] });
      toast({
        title: 'Rodízio excluído!',
        description: 'O compromisso foi removido com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir rodízio',
        description: error.message,
      });
    },
  });

  return {
    duties: dutiesQuery.data || [],
    isLoadingDuties: dutiesQuery.isLoading,
    createDuty,
    createBulkDuties,
    updateDuty,
    deleteDuty,
  };
}
