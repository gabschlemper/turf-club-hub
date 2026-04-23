import { useState, useMemo } from 'react';
import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, Calendar, Plus, Trash2, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useRotationDuties, type RotationDuty } from '@/hooks/useRotationDuties';
import { useAthletes } from '@/hooks/useAthletes';
import { RotationFormDialog } from '@/components/rotation/RotationFormDialog';
import { BulkRotationDialog } from '@/components/rotation/BulkRotationDialog';
import { parseLocalDate } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import { isCoach } from '@/lib/permissions';
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
  const { isAdmin: isAdminUser, user } = useAuth();
  // Coaches see the full schedule (admin view), but cannot mutate
  const isAdmin = isAdminUser;
  const isCoachUser = isCoach(user?.role);
  const showFullSchedule = isAdmin || isCoachUser;
  const { duties, isLoadingDuties, deleteDuty } = useRotationDuties();
  const { athletes } = useAthletes();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkFormOpen, setIsBulkFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingDuty, setEditingDuty] = useState<RotationDuty | null>(null);

  // Get duties for the logged-in athlete
  const myDuties = useMemo(() => {
    if (!user?.athleteId) return [];
    return duties.filter(
      d => d.athlete1_id === user.athleteId || 
           d.athlete2_id === user.athleteId || 
           d.athlete3_id === user.athleteId
    );
  }, [duties, user?.athleteId]);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteDuty.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleEdit = (duty: RotationDuty) => {
    setEditingDuty(duty);
    setIsFormOpen(true);
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

      <Tabs defaultValue={showFullSchedule ? "schedule" : "my-duties"} className="space-y-4 sm:space-y-6">
        <TabsList className={cn("grid w-full h-auto", showFullSchedule ? "grid-cols-1" : "grid-cols-2")}>
          <TabsTrigger value="schedule" className="flex-col sm:flex-row gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Escala Completa</span>
            <span className="sm:hidden">Escala</span>
          </TabsTrigger>
          {!showFullSchedule && (
            <TabsTrigger value="my-duties" className="flex-col sm:flex-row gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Meus Compromissos</span>
              <span className="sm:hidden">Meus</span>
            </TabsTrigger>
          )}
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
                      <TableHead>Atletas</TableHead>
                      <TableHead>Status</TableHead>
                      {isAdmin && <TableHead className="text-right">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {duties.map((duty) => {
                      return (
                        <TableRow key={duty.id}>
                          <TableCell className="font-medium">
                            {format(parseLocalDate(duty.duty_date), "dd/MM/yyyy (EEEE)", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span>{duty.athlete1?.name || 'Atleta não encontrado'}</span>
                              <span>{duty.athlete2?.name || 'Atleta não encontrado'}</span>
                              {duty.athlete3 && <span>{duty.athlete3.name}</span>}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(duty.duty_date)}</TableCell>
                          {isAdmin && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(duty)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteId(duty.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
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

        {/* My Duties Tab - Only for Athletes */}
        {!showFullSchedule && (
          <TabsContent value="my-duties">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Meus Compromissos
                </CardTitle>
                <CardDescription>
                  Seus compromissos de rodízio
                </CardDescription>
              </CardHeader>
              <CardContent>
                {myDuties.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Você não tem compromissos de rodízio agendados.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myDuties.map((duty) => {
                      // Get partners (other athletes in the rotation)
                      const partners = [
                        duty.athlete1_id !== user.athleteId ? duty.athlete1 : null,
                        duty.athlete2_id !== user.athleteId ? duty.athlete2 : null,
                        duty.athlete3_id !== user.athleteId ? duty.athlete3 : null,
                      ].filter(Boolean);
                      
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
                                {partners.length === 1 
                                  ? `Parceiro(a): ${partners[0]?.name}`
                                  : `Parceiros: ${partners.map(p => p?.name).join(', ')}`
                                }
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
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Dialogs */}
      <RotationFormDialog 
        open={isFormOpen} 
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingDuty(null);
        }}
        athletes={athletes}
        editingDuty={editingDuty}
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
