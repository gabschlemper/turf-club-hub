import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

type AttendanceStatus = 'present' | 'absent' | 'justified';

export function useAttendances() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const attendancesQueryKey = ['attendances', user?.id] as const;

  const attendancesQuery = useQuery({
    queryKey: attendancesQueryKey,
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];

      // Fetch all attendances in batches to avoid the 1000-row default limit
      const pageSize = 1000;
      let allData: any[] = [];
      // Use keyset pagination ordered by `id` (the primary key, guaranteed unique
      // and stable). Range/offset pagination ordered by a non-unique column like
      // `created_at` can silently skip or duplicate rows when ties exist or when
      // RLS interacts with PostgREST limits, which caused athletes to see stale
      // "Falta" badges for trainings that were actually marked as present.
      let cursor: string | null = null;
      // Safety cap to avoid infinite loops if something goes wrong.
      const maxIterations = 100;
      let iterations = 0;

      while (iterations < maxIterations) {
        iterations += 1;

        let query = supabase
          .from('attendances')
          .select('*')
          .is('deleted_at', null)
          .order('id', { ascending: true })
          .limit(pageSize);

        if (cursor) {
          query = query.gt('id', cursor);
        }

        const { data, error } = await query;
        if (error) throw error;

        const batch = data ?? [];
        if (batch.length === 0) break;

        allData = allData.concat(batch);

        if (batch.length < pageSize) break;
        cursor = batch[batch.length - 1].id;
      }

      return allData;
    },
  });

  const upsertAttendance = useMutation({
    mutationFn: async ({ eventId, athleteId, status }: { eventId: string; athleteId: string; status: AttendanceStatus }) => {
      const userId = user?.id ?? (await supabase.auth.getUser()).data.user?.id ?? null;
      const timestamp = new Date().toISOString();

      const { data: existing } = await supabase
        .from('attendances')
        .select('id')
        .eq('event_id', eventId)
        .eq('athlete_id', athleteId)
        .is('deleted_at', null)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('attendances')
          .update({ 
            status, 
            marked_at: timestamp,
            marked_by: userId,
          })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase
        .from('attendances')
        .insert({
          event_id: eventId,
          athlete_id: athleteId,
          status,
          marked_at: timestamp,
          marked_by: userId,
          club_id: user?.clubId!,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async ({ eventId, athleteId, status }) => {
      await queryClient.cancelQueries({ queryKey: attendancesQueryKey });

      const previousAttendances = queryClient.getQueryData<any[]>(attendancesQueryKey) || [];
      const optimisticTimestamp = new Date().toISOString();

      queryClient.setQueryData(attendancesQueryKey, (current: any[] = []) => {
        const existingIndex = current.findIndex(
          attendance =>
            attendance.event_id === eventId &&
            attendance.athlete_id === athleteId &&
            attendance.deleted_at == null,
        );

        if (existingIndex >= 0) {
          const nextAttendances = [...current];
          nextAttendances[existingIndex] = {
            ...nextAttendances[existingIndex],
            status,
            marked_at: optimisticTimestamp,
            marked_by: user?.id ?? null,
          };
          return nextAttendances;
        }

        return [
          {
            id: `optimistic-${eventId}-${athleteId}`,
            event_id: eventId,
            athlete_id: athleteId,
            status,
            marked_at: optimisticTimestamp,
            marked_by: user?.id ?? null,
            created_at: optimisticTimestamp,
            deleted_at: null,
            club_id: user?.clubId ?? null,
          },
          ...current,
        ];
      });

      return { previousAttendances };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(attendancesQueryKey, (current: any[] = []) => {
        const filteredAttendances = current.filter(
          attendance => !(attendance.event_id === data.event_id && attendance.athlete_id === data.athlete_id),
        );

        return [data, ...filteredAttendances];
      });

      toast({
        title: 'Presença atualizada',
        description: 'O status de presença foi salvo com sucesso.',
      });
    },
    onError: (error: Error, _variables, context) => {
      queryClient.setQueryData(attendancesQueryKey, context?.previousAttendances || []);
      console.error('Error updating attendance:', error);
      toast({
        title: 'Erro ao atualizar presença',
        description: 'Não foi possível salvar o status de presença.',
        variant: 'destructive',
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: attendancesQueryKey });
    },
  });

  return {
    attendances: attendancesQuery.data || [],
    isLoading: attendancesQuery.isLoading,
    error: attendancesQuery.error,
    upsertAttendance,
  };
}
