import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClubInfo {
  id: string;
  name: string;
  logo_url: string | null;
}

/**
 * Fetches the club info (including logo) for the given clubId.
 * If clubId is omitted, fetches the first club (used on the login page,
 * where there's no authenticated user yet — works because there's currently
 * a single tenant and `clubs` has a public read policy).
 */
export function useClubLogo(clubId?: string) {
  return useQuery({
    queryKey: ['club-logo', clubId ?? 'default'],
    queryFn: async (): Promise<ClubInfo | null> => {
      const query = supabase.from('clubs').select('id, name, logo_url');
      const { data, error } = clubId
        ? await query.eq('id', clubId).maybeSingle()
        : await query.order('created_at', { ascending: true }).limit(1).maybeSingle();

      if (error) {
        console.error('Error fetching club logo:', error);
        return null;
      }
      return data as ClubInfo | null;
    },
    staleTime: 5 * 60 * 1000,
  });
}
