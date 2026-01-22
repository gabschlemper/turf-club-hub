import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AuditAction = 
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE'
  | 'SOFT_DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'SIGNUP'
  | 'PASSWORD_RESET'
  | 'PASSWORD_CHANGE';

export interface Audit {
  id: string;
  user_id: string | null;
  action: AuditAction;
  table_name: string | null;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface UseAuditsOptions {
  userId?: string;
  tableName?: string;
  action?: AuditAction;
  recordId?: string;
  limit?: number;
}

export function useAudits(options: UseAuditsOptions = {}) {
  const { userId, tableName, action, recordId, limit = 100 } = options;

  const auditsQuery = useQuery({
    queryKey: ['audits', userId, tableName, action, recordId, limit],
    queryFn: async () => {
      let query = supabase
        .from('audits')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (tableName) {
        query = query.eq('table_name', tableName);
      }

      if (action) {
        query = query.eq('action', action);
      }

      if (recordId) {
        query = query.eq('record_id', recordId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Audit[];
    },
  });

  return {
    audits: auditsQuery.data || [],
    isLoading: auditsQuery.isLoading,
    error: auditsQuery.error,
  };
}
