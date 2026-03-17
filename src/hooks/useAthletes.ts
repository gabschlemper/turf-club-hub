import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Helper function to create audit log
async function createAuditLog(
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE',
  recordId: string,
  oldData?: any,
  newData?: any
) {
  try {
    await supabase.from('audits').insert([{
      action,
      table_name: 'athletes',
      record_id: recordId,
      old_data: oldData ?? null,
      new_data: newData ?? null,
    } as any]);
  } catch (error) {
    console.warn('Failed to create audit log:', error);
  }
}

export function useAthletes() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const athletesQueryKey = ['athletes', user?.id] as const;

  const athletesQuery = useQuery({
    queryKey: athletesQueryKey,
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('athletes')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const createAthlete = useMutation({
    mutationFn: async (athlete: any) => {
      const { data, error } = await supabase
        .from('athletes')
        .insert({ ...athlete, club_id: user?.clubId })
        .select()
        .single();

      if (error) throw error;
      
      // Create audit log for INSERT
      await createAuditLog('INSERT', data.id, null, data);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: athletesQueryKey });
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
    mutationFn: async (athletes: any[]) => {
      const results = {
        created: [] as any[],
        duplicated: [] as { athlete: any; reason: string }[],
        errors: [] as { athlete: any; reason: string }[],
      };

      // Insert athletes one by one to handle duplicates gracefully
      for (const athlete of athletes) {
        try {
          const { data, error } = await supabase
            .from('athletes')
            .insert({ ...athlete, club_id: user?.clubId })
            .select()
            .single();

          if (error) {
            if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
              results.duplicated.push({ athlete, reason: 'E-mail já cadastrado' });
            } else {
              results.errors.push({ athlete, reason: error.message });
            }
          } else {
            results.created.push(data);
            // Create audit log for INSERT
            await createAuditLog('INSERT', data.id, null, data);
          }
        } catch (err) {
          results.errors.push({ 
            athlete, 
            reason: err instanceof Error ? err.message : 'Erro desconhecido' 
          });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: athletesQueryKey });
      
      const { created, duplicated, errors } = results;
      
      if (created.length > 0) {
        toast({
          title: 'Atletas cadastrados!',
          description: `${created.length} atleta(s) cadastrado(s) com sucesso.${duplicated.length > 0 ? ` ${duplicated.length} e-mail(s) já cadastrado(s).` : ''}${errors.length > 0 ? ` ${errors.length} erro(s).` : ''}`,
        });
      } else if (duplicated.length > 0 || errors.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Nenhum atleta cadastrado',
          description: `${duplicated.length > 0 ? `${duplicated.length} e-mail(s) já cadastrado(s). ` : ''}${errors.length > 0 ? `${errors.length} erro(s) encontrado(s).` : ''}`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao cadastrar atletas',
        description: error.message,
      });
    },
  });

  const updateAthlete = useMutation({
    mutationFn: async ({ id, ...athlete }: any) => {
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
      await createAuditLog('UPDATE', id, oldData, data);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: athletesQueryKey });
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
      await createAuditLog('SOFT_DELETE', id, oldData, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: athletesQueryKey });
      toast({
        title: 'Atleta excluído!',
        description: 'O atleta foi removido com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir atleta',
        description: error.message,
      });
    },
  });

  // Find current user's athlete profile by email
  const currentAthlete = athletesQuery.data?.find(
    athlete => athlete.email.toLowerCase() === user?.email?.toLowerCase()
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
