import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronDown, ChevronUp, User, FileText, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  AuditWithUser, 
  AuditAction, 
  getChangedFields, 
  fieldLabels, 
  formatFieldValue 
} from '@/hooks/useAudits';

const actionLabels: Record<AuditAction, string> = {
  INSERT: 'Criação',
  UPDATE: 'Atualização',
  DELETE: 'Exclusão',
  SOFT_DELETE: 'Exclusão',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  SIGNUP: 'Cadastro',
  PASSWORD_RESET: 'Reset de Senha',
  PASSWORD_CHANGE: 'Troca de Senha',
};

const actionStyles: Record<AuditAction, string> = {
  INSERT: 'bg-green-500/10 text-green-600 border-green-500/20',
  UPDATE: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  DELETE: 'bg-red-500/10 text-red-600 border-red-500/20',
  SOFT_DELETE: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  LOGIN: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  LOGOUT: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  SIGNUP: 'bg-green-600/10 text-green-700 border-green-600/20',
  PASSWORD_RESET: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  PASSWORD_CHANGE: 'bg-yellow-600/10 text-yellow-700 border-yellow-600/20',
};

const tableLabels: Record<string, string> = {
  athletes: 'Atletas',
  events: 'Eventos',
  rotation_duties: 'Rodízios',
  debts: 'Dívidas',
  attendances: 'Presenças',
  training_confirmations: 'Confirmações',
  profiles: 'Perfis',
  user_roles: 'Permissões',
};

interface AuditCardProps {
  audit: AuditWithUser;
}

export function AuditCard({ audit }: AuditCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const changes = getChangedFields(audit.old_data, audit.new_data);
  const hasChanges = changes.length > 0;
  
  const tableName = audit.table_name 
    ? tableLabels[audit.table_name] || audit.table_name 
    : 'Sistema';

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            {/* Header com data e ação */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(audit.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={actionStyles[audit.action]}>
                    {actionLabels[audit.action]}
                  </Badge>
                  <span className="text-sm font-medium">{tableName}</span>
                </div>
              </div>
              
              {hasChanges && (
                <div className="text-muted-foreground">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              )}
            </div>

            {/* Usuário que fez a ação */}
            <div className="flex items-center gap-2 text-sm mb-2">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Por:</span>
              <span className="font-medium">
                {audit.user_name || audit.user_email || 'Sistema'}
              </span>
            </div>

            {/* Registro afetado */}
            {audit.record_name && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Registro:</span>
                <span className="font-medium truncate">{audit.record_name}</span>
              </div>
            )}

            {/* Preview das mudanças */}
            {hasChanges && !isOpen && (
              <div className="mt-2 text-xs text-muted-foreground">
                {changes.length} campo(s) alterado(s)
              </div>
            )}
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {hasChanges && (
            <div className="px-4 pb-4 border-t pt-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">Alterações:</p>
              {changes.map(({ field, oldValue, newValue }, index) => (
                <div key={index} className="text-sm bg-muted/30 rounded-md p-2">
                  <span className="font-medium text-muted-foreground">
                    {fieldLabels[field] || field}:
                  </span>
                  <div className="mt-1 flex items-start gap-2 flex-wrap">
                    {oldValue !== null && (
                      <>
                        <span className="text-destructive line-through">
                          {formatFieldValue(oldValue)}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      </>
                    )}
                    {newValue !== null && (
                      <span className="text-primary">
                        {formatFieldValue(newValue)}
                      </span>
                    )}
                    {oldValue !== null && newValue === null && (
                      <span className="text-muted-foreground italic">removido</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
