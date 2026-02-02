import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type ConfirmationStatus = 'confirmed' | 'declined';

export interface ConfirmationWithDetails {
  id: string;
  event_id: string;
  athlete_id: string;
  status: ConfirmationStatus;
  confirmed_at: string;
  created_at: string;
  updated_at: string;
  athlete?: {
    id: string;
    name: string;
    email: string;
    gender: string;
  };
  event?: {
    id: string;
    name: string;
    start_datetime: string;
    end_datetime: string;
    location: string;
  };
}

const CONFIRMATION_DEADLINE_HOURS = 6;

export function useTrainingConfirmations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all confirmations with athlete and event details
  const confirmationsQuery = useQuery({
    queryKey: ['training-confirmations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_confirmations')
        .select(`
          *,
          athlete:athletes(id, name, email, gender),
          event:events(id, name, start_datetime, end_datetime, location)
        `)
        .order('confirmed_at', { ascending: false });

      if (error) throw error;
      return data as ConfirmationWithDetails[];
    },
  });

  // Check if confirmation is still allowed (12h before event)
  const canConfirm = (eventStartDatetime: string): boolean => {
    const eventDate = new Date(eventStartDatetime);
    const now = new Date();
    const deadlineDate = new Date(eventDate.getTime() - CONFIRMATION_DEADLINE_HOURS * 60 * 60 * 1000);
    return now < deadlineDate;
  };

  // Get hours until deadline
  const getHoursUntilDeadline = (eventStartDatetime: string): number => {
    const eventDate = new Date(eventStartDatetime);
    const now = new Date();
    const deadlineDate = new Date(eventDate.getTime() - CONFIRMATION_DEADLINE_HOURS * 60 * 60 * 1000);
    const hoursRemaining = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return Math.max(0, hoursRemaining);
  };

  // Create or update confirmation
  const upsertConfirmation = useMutation({
    mutationFn: async ({ 
      eventId, 
      athleteId, 
      status,
      eventStartDatetime
    }: { 
      eventId: string; 
      athleteId: string; 
      status: ConfirmationStatus;
      eventStartDatetime: string;
    }) => {
      // Validate deadline
      if (!canConfirm(eventStartDatetime)) {
        throw new Error('O prazo para confirmação encerrou (6h antes do treino).');
      }

      const { data, error } = await supabase
        .from('training_confirmations')
        .upsert({
          event_id: eventId,
          athlete_id: athleteId,
          status,
          confirmed_at: new Date().toISOString(),
        }, {
          onConflict: 'event_id,athlete_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['training-confirmations'] });
      toast({
        title: variables.status === 'confirmed' ? 'Presença confirmada!' : 'Ausência registrada',
        description: variables.status === 'confirmed' 
          ? 'Sua presença foi confirmada para este treino.' 
          : 'Sua ausência foi registrada para este treino.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao confirmar',
        description: error.message,
      });
    },
  });

  // Delete confirmation (admin only or reset by athlete)
  const deleteConfirmation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('training_confirmations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-confirmations'] });
      toast({
        title: 'Confirmação removida',
        description: 'A confirmação foi removida com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao remover confirmação',
        description: error.message,
      });
    },
  });

  // Get confirmations count for an event
  const getConfirmationsForEvent = (eventId: string) => {
    const eventConfirmations = confirmationsQuery.data?.filter(c => c.event_id === eventId) || [];
    const confirmed = eventConfirmations.filter(c => c.status === 'confirmed').length;
    const declined = eventConfirmations.filter(c => c.status === 'declined').length;
    return { confirmed, declined, total: eventConfirmations.length, confirmations: eventConfirmations };
  };

  // Get athlete's confirmation for an event
  const getAthleteConfirmation = (eventId: string, athleteId: string) => {
    return confirmationsQuery.data?.find(
      c => c.event_id === eventId && c.athlete_id === athleteId
    );
  };

  return {
    confirmations: confirmationsQuery.data || [],
    isLoading: confirmationsQuery.isLoading,
    error: confirmationsQuery.error,
    canConfirm,
    getHoursUntilDeadline,
    upsertConfirmation,
    deleteConfirmation,
    getConfirmationsForEvent,
    getAthleteConfirmation,
    CONFIRMATION_DEADLINE_HOURS,
  };
}
