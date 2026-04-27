import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface Photographer {
  id: string;
  club_id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PhotographerInput {
  name: string;
  email: string;
}

export function usePhotographers() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['photographers', user?.id] as const;

  const photographersQuery = useQuery({
    queryKey,
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [] as Photographer[];
      const { data, error } = await (supabase as any)
        .from('photographers')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true });
      if (error) throw error;
      return (data || []) as Photographer[];
    },
  });

  const createPhotographer = useMutation({
    mutationFn: async (input: PhotographerInput) => {
      const payload = {
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        club_id: user?.clubId,
      };
      const { data, error } = await (supabase as any)
        .from('photographers')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as Photographer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: 'Fotógrafo cadastrado!',
        description: 'O fotógrafo agora pode criar a conta com este e-mail.',
      });
    },
    onError: (error: Error) => {
      let message = error.message;
      if (message.includes('duplicate key') || message.includes('unique')) {
        message = 'Este e-mail já está cadastrado como fotógrafo';
      }
      toast({ variant: 'destructive', title: 'Erro ao cadastrar', description: message });
    },
  });

  const updatePhotographer = useMutation({
    mutationFn: async ({ id, ...input }: PhotographerInput & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('photographers')
        .update({
          name: input.name.trim(),
          email: input.email.trim().toLowerCase(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Photographer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: 'Fotógrafo atualizado!' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Erro ao atualizar', description: error.message });
    },
  });

  const deletePhotographer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('photographers')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: 'Fotógrafo removido' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Erro ao remover', description: error.message });
    },
  });

  return {
    photographers: photographersQuery.data || [],
    isLoading: photographersQuery.isLoading,
    createPhotographer,
    updatePhotographer,
    deletePhotographer,
  };
}
