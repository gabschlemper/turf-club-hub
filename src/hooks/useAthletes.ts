import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

type Athlete = Database['public']['Tables']['athletes']['Row'];
type AthleteInsert = Database['public']['Tables']['athletes']['Insert'];
type AthleteUpdate = Database['public']['Tables']['athletes']['Update'];

// Helper function to create audit log
async function createAuditLog(
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE',
  recordId: string,
  oldData?: Record<string, unknown> | null,
  newData?: Record<string, unknown> | null
) {
  try {
    await supabase.from('audits').insert({
      action,
      table_name: 'athletes',
      record_id: recordId,
      old_data: oldData || null,
      new_data: newData || null,
    });
  } catch (error) {
    console.warn('Failed to create audit log:', error);
  }
}

export function useAthletes() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const athletesQuery = useQuery({
    queryKey: ['athletes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athletes')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Athlete[];
    },
  });

  const createAthlete = useMutation({
    mutationFn: async (athlete: AthleteInsert) => {
      const { data, error } = await supabase
        .from('athletes')
        .insert(athlete)
        .select()
        .single();

      if (error) throw error;
      
      // Create audit log for INSERT
      await createAuditLog('INSERT', data.id, null, data as Record<string, unknown>);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
      toast({
        title: 'Atleta cadastrado!',
        description: 'O atleta foi cadastrado com sucesso.',
      });
    },
    onError: (error: Error) => {
      let message = error.message;
      if (message.includes('duplicate key') || message.includes('unique constraint')) {
        message = 'Este e-mail já está cadastrado';
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao cadastrar atleta',
        description: message,
      });
    },
  });

  const createBulkAthletes = useMutation({
    mutationFn: async (athletes: AthleteInsert[]) => {
      const { data, error } = await supabase
        .from('athletes')
        .insert(athletes)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
      toast({
        title: 'Atletas cadastrados!',
        description: `${data.length} atleta(s) cadastrado(s) com sucesso.`,
      });
    },
    onError: (error: Error) => {
      let message = error.message;
      if (message.includes('duplicate key') || message.includes('unique constraint')) {
        message = 'Um ou mais e-mails já estão cadastrados';
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao cadastrar atletas',
        description: message,
      });
    },
  });

  const updateAthlete = useMutation({
    mutationFn: async ({ id, ...athlete }: AthleteUpdate & { id: string }) => {
      // Get old data for audit
      const { data: oldData } = await supabase
        .from('athletes')
        .select('*')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('athletes')
        .update(athlete)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Create audit log for UPDATE
      await createAuditLog('UPDATE', id, oldData as Record<string, unknown>, data as Record<string, unknown>);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
      toast({
        title: 'Atleta atualizado!',
        description: 'O atleta foi atualizado com sucesso.',
      });
    },
    onError: (error: Error) => {
      let message = error.message;
      if (message.includes('duplicate key') || message.includes('unique constraint')) {
        message = 'Este e-mail já está cadastrado';
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar atleta',
        description: message,
      });
    },
  });

  const deleteAthlete = useMutation({
    mutationFn: async (id: string) => {
      // Get old data for audit
      const { data: oldData } = await supabase
        .from('athletes')
        .select('*')
        .eq('id', id)
        .single();

      // Soft delete instead of hard delete
      const { error } = await supabase
        .from('athletes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      // Create audit log for SOFT_DELETE
      await createAuditLog('SOFT_DELETE', id, oldData as Record<string, unknown>, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
      toast({
        title: 'Atleta excluído!',
        description: 'O atleta foi removido com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir atleta',
        description: error.message,
      });
    },
  });

  // Find current user's athlete profile by email
  const currentAthlete = athletesQuery.data?.find(
    athlete => athlete.email === user?.email
  );

  return {
    athletes: athletesQuery.data || [],
    currentAthlete,
    isLoading: athletesQuery.isLoading,
    error: athletesQuery.error,
    createAthlete,
    createBulkAthletes,
    updateAthlete,
    deleteAthlete,
  };
}
