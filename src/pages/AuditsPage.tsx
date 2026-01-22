import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History, Filter, Download } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAudits, AuditAction } from '@/hooks/useAudits';
import { useAuth } from '@/contexts/AuthContext';

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

const actionColors: Record<AuditAction, string> = {
  INSERT: 'bg-green-500',
  UPDATE: 'bg-blue-500',
  DELETE: 'bg-red-500',
  SOFT_DELETE: 'bg-orange-500',
  LOGIN: 'bg-purple-500',
  LOGOUT: 'bg-gray-500',
  SIGNUP: 'bg-green-600',
  PASSWORD_RESET: 'bg-yellow-500',
  PASSWORD_CHANGE: 'bg-yellow-600',
};

const tableLabels: Record<string, string> = {
  athletes: 'Atletas',
  events: 'Eventos',
  rotation_duties: 'Rodízios',
  debts: 'Dívidas',
  swap_requests: 'Solicitações de Troca',
  attendances: 'Presenças',
};

export default function AuditsPage() {
  const { isAdmin } = useAuth();
  const [selectedAction, setSelectedAction] = useState<AuditAction | 'all'>('all');
  const [selectedTable, setSelectedTable] = useState<string>('all');

  const { audits, isLoading } = useAudits({
    action: selectedAction === 'all' ? undefined : selectedAction,
    tableName: selectedTable === 'all' ? undefined : selectedTable,
    limit: 200,
  });

  if (!isAdmin) {
    return (
      <div className="flex-1 p-6">
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
      ['Data/Hora', 'Ação', 'Tabela', 'Usuário', 'Detalhes'].join(','),
      ...audits.map(audit => [
        format(new Date(audit.created_at), 'dd/MM/yyyy HH:mm:ss'),
        actionLabels[audit.action],
        audit.table_name ? tableLabels[audit.table_name] || audit.table_name : '-',
        audit.user_id || '-',
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
    <div className="animate-fade-in">
      <PageHeader
        title="Auditoria"
        description="Histórico de todas as ações realizadas no sistema"
        action={
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Registro de Auditoria
              </CardTitle>
              <CardDescription>
                {audits.length} registro(s) encontrado(s)
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={selectedAction} onValueChange={(value) => setSelectedAction(value as AuditAction | 'all')}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por ação" />
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
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por tabela" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as tabelas</SelectItem>
                  {Object.entries(tableLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : audits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum registro de auditoria encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Tabela</TableHead>
                    <TableHead>Registro ID</TableHead>
                    <TableHead>Usuário ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audits.map((audit) => (
                    <TableRow key={audit.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(audit.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge className={actionColors[audit.action]}>
                          {actionLabels[audit.action]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {audit.table_name ? (tableLabels[audit.table_name] || audit.table_name) : '-'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {audit.record_id ? audit.record_id.slice(0, 8) + '...' : '-'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {audit.user_id ? audit.user_id.slice(0, 8) + '...' : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
