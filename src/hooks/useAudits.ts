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

export interface AuditWithUser extends Audit {
  user_name: string | null;
  user_email: string | null;
  record_name: string | null;
}

interface UseAuditsOptions {
  userId?: string;
  tableName?: string;
  action?: AuditAction;
  recordId?: string;
  limit?: number;
}

// Extrai o nome legível do registro a partir dos dados de auditoria
function extractRecordName(data: Record<string, unknown> | null): string | null {
  if (!data) return null;
  
  // Prioriza campos mais específicos primeiro
  if (data.name && typeof data.name === 'string') return data.name;
  if (data.title && typeof data.title === 'string') return data.title;
  if (data.email && typeof data.email === 'string') return data.email;
  
  return null;
}

export function useAudits(options: UseAuditsOptions = {}) {
  const { userId, tableName, action, recordId, limit = 100 } = options;

  const auditsQuery = useQuery({
    queryKey: ['audits', userId, tableName, action, recordId, limit],
    queryFn: async () => {
      // Primeiro, buscar audits
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

      const { data: auditsData, error: auditsError } = await query;

      if (auditsError) throw auditsError;
      
      if (!auditsData || auditsData.length === 0) {
        return [] as AuditWithUser[];
      }

      // Buscar todos os user_ids únicos (não nulos)
      const userIds = [...new Set(auditsData
        .map(a => a.user_id)
        .filter((id): id is string => id !== null)
      )];

      // Buscar profiles para os users
      let profilesMap: Record<string, { name: string; email: string }> = {};
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, name, email')
          .in('user_id', userIds);
        
        if (profilesData) {
          profilesMap = profilesData.reduce((acc, p) => {
            acc[p.user_id] = { name: p.name, email: p.email };
            return acc;
          }, {} as Record<string, { name: string; email: string }>);
        }
      }

      // Combinar audits com informações de usuário
      const auditsWithUser: AuditWithUser[] = auditsData.map(audit => {
        const profile = audit.user_id ? profilesMap[audit.user_id] : null;
        const recordName = extractRecordName(audit.new_data as Record<string, unknown> | null) 
          || extractRecordName(audit.old_data as Record<string, unknown> | null);

        return {
          id: audit.id,
          user_id: audit.user_id,
          action: audit.action as AuditAction,
          table_name: audit.table_name,
          record_id: audit.record_id,
          old_data: audit.old_data as Record<string, unknown> | null,
          new_data: audit.new_data as Record<string, unknown> | null,
          ip_address: audit.ip_address as string | null,
          user_agent: audit.user_agent,
          created_at: audit.created_at,
          user_name: profile?.name || null,
          user_email: profile?.email || null,
          record_name: recordName,
        };
      });

      return auditsWithUser;
    },
  });

  return {
    audits: auditsQuery.data || [],
    isLoading: auditsQuery.isLoading,
    error: auditsQuery.error,
  };
}

// Utilitário para comparar mudanças entre old_data e new_data
export function getChangedFields(
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null
): Array<{ field: string; oldValue: unknown; newValue: unknown }> {
  const changes: Array<{ field: string; oldValue: unknown; newValue: unknown }> = [];
  
  if (!oldData && !newData) return changes;
  
  // Para INSERT, mostrar todos os campos novos
  if (!oldData && newData) {
    Object.entries(newData).forEach(([field, value]) => {
      // Ignorar campos técnicos
      if (['id', 'created_at', 'updated_at'].includes(field)) return;
      changes.push({ field, oldValue: null, newValue: value });
    });
    return changes;
  }
  
  // Para DELETE, mostrar todos os campos antigos
  if (oldData && !newData) {
    Object.entries(oldData).forEach(([field, value]) => {
      if (['id', 'created_at', 'updated_at'].includes(field)) return;
      changes.push({ field, oldValue: value, newValue: null });
    });
    return changes;
  }
  
  // Para UPDATE, comparar campos
  if (oldData && newData) {
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
    
    allKeys.forEach(field => {
      // Ignorar campos técnicos que sempre mudam
      if (['id', 'created_at', 'updated_at'].includes(field)) return;
      
      const oldValue = oldData[field];
      const newValue = newData[field];
      
      // Comparação profunda simples
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({ field, oldValue, newValue });
      }
    });
  }
  
  return changes;
}

// Labels para campos
export const fieldLabels: Record<string, string> = {
  name: 'Nome',
  email: 'E-mail',
  birth_date: 'Data de Nascimento',
  gender: 'Gênero',
  category: 'Categoria',
  status: 'Status',
  event_type: 'Tipo de Evento',
  start_datetime: 'Início',
  end_datetime: 'Fim',
  location: 'Local',
  description: 'Descrição',
  training_type: 'Tipo de Treino',
  weight: 'Peso',
  duty_date: 'Data do Rodízio',
  athlete1_id: 'Atleta 1',
  athlete2_id: 'Atleta 2',
  athlete3_id: 'Atleta 3',
  athlete_id: 'Atleta',
  event_id: 'Evento',
  marked_by: 'Marcado por',
  marked_at: 'Marcado em',
  deleted_at: 'Excluído em',
  confirmed_at: 'Confirmado em',
};

// Formata valores para exibição
export function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'string') {
    // Tentar formatar datas
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: value.includes('T') ? '2-digit' : undefined,
            minute: value.includes('T') ? '2-digit' : undefined,
          });
        }
      } catch {
        // Se falhar, retorna o valor original
      }
    }
    
    // Traduzir valores comuns
    const translations: Record<string, string> = {
      male: 'Masculino',
      female: 'Feminino',
      both: 'Ambos',
      training: 'Treino',
      championship: 'Campeonato',
      social: 'Social',
      principal: 'Principal',
      extra: 'Extra',
      present: 'Presente',
      absent: 'Ausente',
      justified: 'Justificado',
      confirmed: 'Confirmado',
      declined: 'Recusado',
    };
    
    return translations[value] || value;
  }
  
  return JSON.stringify(value);
}
