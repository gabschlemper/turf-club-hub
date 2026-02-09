import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useEvents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Only fetch non-deleted events
  const eventsQuery = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .is('deleted_at', null)
        .order('start_datetime', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const createEvent = useMutation({
    mutationFn: async (event: any) => {
      const { data, error } = await supabase
        .from('events')
        .insert(event)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: 'Evento criado!',
        description: 'O evento foi cadastrado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar evento',
        description: error.message,
      });
    },
  });

  const createBulkEvents = useMutation({
    mutationFn: async (events: any[]) => {
      const { data, error } = await supabase
        .from('events')
        .insert(events)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: 'Eventos criados!',
        description: `${data.length} eventos foram cadastrados com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar eventos',
        description: error.message,
      });
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...event }: any) => {
      const { data, error } = await supabase
        .from('events')
        .update(event)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: 'Evento atualizado!',
        description: 'O evento foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar evento',
        description: error.message,
      });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      // Soft delete instead of hard delete
      const { error } = await supabase
        .from('events')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: 'Evento excluído!',
        description: 'O evento foi removido com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir evento',
        description: error.message,
      });
    },
  });

  return {
    events: eventsQuery.data || [],
    isLoading: eventsQuery.isLoading,
    error: eventsQuery.error,
    createEvent,
    createBulkEvents,
    updateEvent,
    deleteEvent,
  };
}
