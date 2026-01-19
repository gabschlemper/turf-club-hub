import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RotationDuty {
  id: string;
  duty_date: string;
  athlete1_id: string;
  athlete2_id: string;
  created_at: string;
  updated_at: string;
  athlete1?: { id: string; name: string; email: string };
  athlete2?: { id: string; name: string; email: string };
}

interface SwapRequest {
  id: string;
  rotation_duty_id: string;
  requester_athlete_id: string;
  target_athlete_id: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string | null;
  responded_at: string | null;
  created_at: string;
  rotation_duty?: RotationDuty;
  requester?: { id: string; name: string };
  target?: { id: string; name: string };
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
          athlete2:athletes!rotation_duties_athlete2_id_fkey(id, name, email)
        `)
        .order('duty_date', { ascending: true });

      if (error) throw error;
      return data as RotationDuty[];
    },
  });

  // Fetch swap requests
  const swapRequestsQuery = useQuery({
    queryKey: ['swap-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('swap_requests')
        .select(`
          *,
          rotation_duty:rotation_duties(*),
          requester:athletes!swap_requests_requester_athlete_id_fkey(id, name),
          target:athletes!swap_requests_target_athlete_id_fkey(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SwapRequest[];
    },
  });

  // Create rotation duty
  const createDuty = useMutation({
    mutationFn: async (duty: { duty_date: string; athlete1_id: string; athlete2_id: string }) => {
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
    mutationFn: async (duties: { duty_date: string; athlete1_id: string; athlete2_id: string }[]) => {
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

  // Delete rotation duty
  const deleteDuty = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rotation_duties')
        .delete()
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

  // Create swap request
  const createSwapRequest = useMutation({
    mutationFn: async (request: { rotation_duty_id: string; requester_athlete_id: string; target_athlete_id: string; message?: string }) => {
      const { data, error } = await supabase
        .from('swap_requests')
        .insert(request)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swap-requests'] });
      toast({
        title: 'Solicitação enviada!',
        description: 'Sua solicitação de troca foi enviada.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao solicitar troca',
        description: error.message,
      });
    },
  });

  // Respond to swap request (approve/reject)
  const respondSwapRequest = useMutation({
    mutationFn: async ({ id, status, newAthleteId }: { id: string; status: 'approved' | 'rejected'; newAthleteId?: string }) => {
      // Update swap request status
      const { error: swapError } = await supabase
        .from('swap_requests')
        .update({ status, responded_at: new Date().toISOString() })
        .eq('id', id);

      if (swapError) throw swapError;

      // If approved, swap the athletes in the rotation duty
      if (status === 'approved' && newAthleteId) {
        const { data: swapRequest } = await supabase
          .from('swap_requests')
          .select('*, rotation_duty:rotation_duties(*)')
          .eq('id', id)
          .single();

        if (swapRequest && swapRequest.rotation_duty) {
          const duty = swapRequest.rotation_duty;
          const updateData: { athlete1_id?: string; athlete2_id?: string } = {};

          if (duty.athlete1_id === swapRequest.requester_athlete_id) {
            updateData.athlete1_id = newAthleteId;
          } else if (duty.athlete2_id === swapRequest.requester_athlete_id) {
            updateData.athlete2_id = newAthleteId;
          }

          if (Object.keys(updateData).length > 0) {
            const { error: dutyError } = await supabase
              .from('rotation_duties')
              .update(updateData)
              .eq('id', duty.id);

            if (dutyError) throw dutyError;
          }
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['swap-requests'] });
      queryClient.invalidateQueries({ queryKey: ['rotation-duties'] });
      toast({
        title: variables.status === 'approved' ? 'Troca aprovada!' : 'Troca recusada',
        description: variables.status === 'approved' 
          ? 'A troca foi realizada com sucesso.' 
          : 'A solicitação foi recusada.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao responder solicitação',
        description: error.message,
      });
    },
  });

  return {
    duties: dutiesQuery.data || [],
    isLoadingDuties: dutiesQuery.isLoading,
    swapRequests: swapRequestsQuery.data || [],
    isLoadingSwapRequests: swapRequestsQuery.isLoading,
    createDuty,
    createBulkDuties,
    updateDuty,
    deleteDuty,
    createSwapRequest,
    respondSwapRequest,
  };
}
