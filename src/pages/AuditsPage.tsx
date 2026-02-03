import { useState } from 'react';
import { format } from 'date-fns';
import { History, Filter, Download, Search } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAudits, AuditAction, fieldLabels, formatFieldValue } from '@/hooks/useAudits';
import { useAuth } from '@/contexts/AuthContext';
import { AuditCard } from '@/components/audit/AuditCard';

const actionLabels: Record<AuditAction, string> = {
  INSERT: 'Criação',
  UPDATE: 'Atualização',
  DELETE: 'Exclusão',
  SOFT_DELETE: 'Exclusão (Soft)',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  SIGNUP: 'Cadastro',
  PASSWORD_RESET: 'Reset de Senha',
  PASSWORD_CHANGE: 'Troca de Senha',
};

const tableLabels: Record<string, string> = {
  athletes: 'Atletas',
  events: 'Eventos',
  rotation_duties: 'Rodízios',
  debts: 'Dívidas',
  attendances: 'Presenças',
  training_confirmations: 'Confirmações',
};

export default function AuditsPage() {
  const { isAdmin } = useAuth();
  const [selectedAction, setSelectedAction] = useState<AuditAction | 'all'>('all');
  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { audits, isLoading } = useAudits({
    action: selectedAction === 'all' ? undefined : selectedAction,
    tableName: selectedTable === 'all' ? undefined : selectedTable,
    limit: 200,
  });

  // Filtrar por termo de busca (nome do usuário ou registro)
  const filteredAudits = audits.filter(audit => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      audit.user_name?.toLowerCase().includes(term) ||
      audit.user_email?.toLowerCase().includes(term) ||
      audit.record_name?.toLowerCase().includes(term)
    );
  });

  if (!isAdmin) {
    return (
      <div className="flex-1 p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <History className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                Você não tem permissão para acessar esta página.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleExport = () => {
    const csv = [
      ['Data/Hora', 'Ação', 'Tabela', 'Usuário', 'Registro', 'Detalhes'].join(','),
      ...filteredAudits.map(audit => [
        format(new Date(audit.created_at), 'dd/MM/yyyy HH:mm:ss'),
        actionLabels[audit.action],
        audit.table_name ? tableLabels[audit.table_name] || audit.table_name : '-',
        audit.user_name || audit.user_email || '-',
        audit.record_name || '-',
        JSON.stringify(audit.new_data || audit.old_data || {}),
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audits_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`;
    a.click();
  };

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        title="Auditoria"
        description="Histórico de ações do sistema"
        action={
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Registro de Auditoria
                </CardTitle>
                <CardDescription>
                  {filteredAudits.length} registro(s)
                </CardDescription>
              </div>
            </div>

            {/* Filtros - Mobile-first layout */}
            <div className="flex flex-col gap-2">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Selects */}
              <div className="grid grid-cols-2 gap-2">
                <Select value={selectedAction} onValueChange={(value) => setSelectedAction(value as AuditAction | 'all')}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2 shrink-0" />
                    <SelectValue placeholder="Ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as ações</SelectItem>
                    {Object.entries(actionLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedTable} onValueChange={setSelectedTable}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2 shrink-0" />
                    <SelectValue placeholder="Tabela" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {Object.entries(tableLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredAudits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum registro encontrado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAudits.map((audit) => (
                <AuditCard key={audit.id} audit={audit} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
