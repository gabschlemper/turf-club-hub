import { useState, useMemo } from 'react';
import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, Calendar, Plus, Trash2, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useRotationDuties } from '@/hooks/useRotationDuties';
import { useAthletes } from '@/hooks/useAthletes';
import { RotationFormDialog } from '@/components/rotation/RotationFormDialog';
import { BulkRotationDialog } from '@/components/rotation/BulkRotationDialog';
import { parseLocalDate } from '@/lib/dateUtils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function RotationPage() {
  const { isAdmin } = useAuth();
  const { duties, isLoadingDuties, deleteDuty } = useRotationDuties();
  const { athletes } = useAthletes();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkFormOpen, setIsBulkFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // For athlete view - find which athlete the current user might be
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);

  // Get duties where the selected athlete is involved
  const myDuties = useMemo(() => {
    if (!selectedAthleteId) return [];
    return duties.filter(
      d => d.athlete1_id === selectedAthleteId || d.athlete2_id === selectedAthleteId
    );
  }, [duties, selectedAthleteId]);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteDuty.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const getStatusBadge = (date: string) => {
    const dutyDate = parseLocalDate(date);
    if (isToday(dutyDate)) {
      return <Badge className="bg-warning text-warning-foreground">Hoje</Badge>;
    }
    if (isPast(dutyDate)) {
      return <Badge variant="secondary">Concluído</Badge>;
    }
    return <Badge variant="outline">Pendente</Badge>;
  };

  if (isLoadingDuties) {
    return (
      <div className="flex-1 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Rodízio Base" 
        description="Escala de apoio ao treino de base"
        action={isAdmin ? (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => setIsBulkFormOpen(true)} className="w-full sm:w-auto" size="sm">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Criar em Massa</span>
              <span className="sm:hidden">Em Massa</span>
            </Button>
            <Button onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto" size="sm">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Novo Rodízio</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
        ) : undefined}
      />

      <Tabs defaultValue="schedule" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="schedule" className="flex-col sm:flex-row gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Escala Completa</span>
            <span className="sm:hidden">Escala</span>
          </TabsTrigger>
          <TabsTrigger value="my-duties" className="flex-col sm:flex-row gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Meus Compromissos</span>
            <span className="sm:hidden">Meus</span>
          </TabsTrigger>
        </TabsList>

        {/* Full Schedule Tab */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Escala de Rodízio
              </CardTitle>
              <CardDescription>
                Todos os compromissos de apoio ao treino de base
              </CardDescription>
            </CardHeader>
            <CardContent>
              {duties.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum rodízio cadastrado ainda.</p>
                  {isAdmin && (
                    <Button variant="outline" className="mt-4" onClick={() => setIsFormOpen(true)}>
                      Cadastrar primeiro rodízio
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Atleta 1</TableHead>
                      <TableHead>Atleta 2</TableHead>
                      <TableHead>Status</TableHead>
                      {isAdmin && <TableHead className="text-right">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {duties.map((duty) => {
                      const isHighlighted = selectedAthleteId && 
                        (duty.athlete1_id === selectedAthleteId || duty.athlete2_id === selectedAthleteId);
                      
                      return (
                        <TableRow 
                          key={duty.id} 
                          className={isHighlighted ? 'bg-primary/10 hover:bg-primary/15' : ''}
                        >
                          <TableCell className="font-medium">
                            {format(parseLocalDate(duty.duty_date), "dd/MM/yyyy (EEEE)", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <span className={duty.athlete1_id === selectedAthleteId ? 'font-bold text-primary' : ''}>
                              {duty.athlete1?.name || 'Atleta não encontrado'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={duty.athlete2_id === selectedAthleteId ? 'font-bold text-primary' : ''}>
                              {duty.athlete2?.name || 'Atleta não encontrado'}
                            </span>
                          </TableCell>
                          <TableCell>{getStatusBadge(duty.duty_date)}</TableCell>
                          {isAdmin && (
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteId(duty.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Duties Tab */}
        <TabsContent value="my-duties">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Meus Compromissos
              </CardTitle>
              <CardDescription>
                Selecione seu nome para ver seus compromissos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Athlete selector */}
              <div className="flex flex-wrap gap-2">
                {athletes.map(athlete => (
                  <Button
                    key={athlete.id}
                    variant={selectedAthleteId === athlete.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedAthleteId(
                      selectedAthleteId === athlete.id ? null : athlete.id
                    )}
                  >
                    {athlete.name}
                  </Button>
                ))}
              </div>

              {selectedAthleteId ? (
                myDuties.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Você não tem compromissos de rodízio agendados.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myDuties.map((duty) => {
                      const partner = duty.athlete1_id === selectedAthleteId 
                        ? duty.athlete2 
                        : duty.athlete1;
                      const dutyDate = parseLocalDate(duty.duty_date);

                      return (
                        <div 
                          key={duty.id} 
                          className="flex items-center justify-between p-4 border rounded-lg bg-card"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold">
                                {format(dutyDate, 'dd')}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {format(dutyDate, 'MMM', { locale: ptBR })}
                              </div>
                            </div>
                            <div>
                              <p className="font-medium">
                                {format(dutyDate, "EEEE", { locale: ptBR })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Parceiro(a): {partner?.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(duty.duty_date)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Selecione seu nome acima para ver seus compromissos.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <RotationFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen}
        athletes={athletes}
      />

      <BulkRotationDialog 
        open={isBulkFormOpen} 
        onOpenChange={setIsBulkFormOpen}
        athletes={athletes}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este rodízio? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
