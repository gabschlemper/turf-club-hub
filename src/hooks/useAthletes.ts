import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Athlete = Database['public']['Tables']['athletes']['Row'];
type AthleteInsert = Database['public']['Tables']['athletes']['Insert'];
type AthleteUpdate = Database['public']['Tables']['athletes']['Update'];

export function useAthletes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const athletesQuery = useQuery({
    queryKey: ['athletes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athletes')
        .select('*')
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

  const updateAthlete = useMutation({
    mutationFn: async ({ id, ...athlete }: AthleteUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('athletes')
        .update(athlete)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
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
      const { error } = await supabase
        .from('athletes')
        .delete()
        .eq('id', id);

      if (error) throw error;
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

  return {
    athletes: athletesQuery.data || [],
    isLoading: athletesQuery.isLoading,
    error: athletesQuery.error,
    createAthlete,
    updateAthlete,
    deleteAthlete,
  };
}
