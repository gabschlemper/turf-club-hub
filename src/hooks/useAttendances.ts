import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Attendance = Tables<'attendances'>;
type AttendanceInsert = TablesInsert<'attendances'>;
type AttendanceUpdate = TablesUpdate<'attendances'>;

export function useAttendances() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const attendancesQuery = useQuery({
    queryKey: ['attendances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendances')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Attendance[];
    },
  });

  const upsertAttendance = useMutation({
    mutationFn: async ({ eventId, athleteId, status }: { eventId: string; athleteId: string; status: 'present' | 'absent' | 'justified' }) => {
      // Check if attendance already exists
      const { data: existing } = await supabase
        .from('attendances')
        .select('id')
        .eq('event_id', eventId)
        .eq('athlete_id', athleteId)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('attendances')
          .update({ 
            status, 
            marked_at: new Date().toISOString(),
            marked_by: (await supabase.auth.getUser()).data.user?.id 
          })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Insert new
        const userId = (await supabase.auth.getUser()).data.user?.id;
        const { data, error } = await supabase
          .from('attendances')
          .insert({
            event_id: eventId,
            athlete_id: athleteId,
            status,
            marked_at: new Date().toISOString(),
            marked_by: userId,
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      toast({
        title: 'Presença atualizada',
        description: 'O status de presença foi salvo com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Error updating attendance:', error);
      toast({
        title: 'Erro ao atualizar presença',
        description: 'Não foi possível salvar o status de presença.',
        variant: 'destructive',
      });
    },
  });

  return {
    attendances: attendancesQuery.data || [],
    isLoading: attendancesQuery.isLoading,
    error: attendancesQuery.error,
    upsertAttendance,
  };
}
