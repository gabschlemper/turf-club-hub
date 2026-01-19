import { useState, useMemo } from 'react';
import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, Calendar, ArrowLeftRight, Plus, Trash2, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useRotationDuties } from '@/hooks/useRotationDuties';
import { useAthletes } from '@/hooks/useAthletes';
import { RotationFormDialog } from '@/components/rotation/RotationFormDialog';
import { SwapRequestDialog } from '@/components/rotation/SwapRequestDialog';
import { BulkRotationDialog } from '@/components/rotation/BulkRotationDialog';
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
  const { duties, isLoadingDuties, swapRequests, deleteDuty, respondSwapRequest } = useRotationDuties();
  const { athletes } = useAthletes();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkFormOpen, setIsBulkFormOpen] = useState(false);
  const [isSwapDialogOpen, setIsSwapDialogOpen] = useState(false);
  const [selectedDuty, setSelectedDuty] = useState<typeof duties[0] | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // For athlete view - find which athlete the current user might be
  // In a real app, this would be linked to the auth user
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);

  // Get duties where the selected athlete is involved
  const myDuties = useMemo(() => {
    if (!selectedAthleteId) return [];
    return duties.filter(
      d => d.athlete1_id === selectedAthleteId || d.athlete2_id === selectedAthleteId
    );
  }, [duties, selectedAthleteId]);

  // Get pending swap requests for the selected athlete
  const myPendingRequests = useMemo(() => {
    if (!selectedAthleteId) return [];
    return swapRequests.filter(
      r => r.target_athlete_id === selectedAthleteId && r.status === 'pending'
    );
  }, [swapRequests, selectedAthleteId]);

  const handleSwapRequest = (duty: typeof duties[0]) => {
    setSelectedDuty(duty);
    setIsSwapDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteDuty.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleRespondSwap = async (requestId: string, status: 'approved' | 'rejected', newAthleteId?: string) => {
    await respondSwapRequest.mutateAsync({ id: requestId, status, newAthleteId });
  };

  const getStatusBadge = (date: string) => {
    const dutyDate = new Date(date);
    if (isToday(dutyDate)) {
      return <Badge className="bg-amber-500">Hoje</Badge>;
    }
    if (isPast(dutyDate)) {
      return <Badge variant="secondary">Concluído</Badge>;
    }
    return <Badge variant="outline">Pendente</Badge>;
  };

  const getSwapStatusBadge = (status: 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Pendente</Badge>;
      case 'approved':
        return <Badge className="bg-green-500 gap-1"><CheckCircle className="h-3 w-3" />Aprovada</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Recusada</Badge>;
    }
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
        <TabsList className="grid w-full grid-cols-3 h-auto">
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
          <TabsTrigger value="swap-requests" className="flex-col sm:flex-row gap-1 sm:gap-2 text-xs sm:text-sm py-2 relative">
            <ArrowLeftRight className="h-4 w-4" />
            <span className="hidden sm:inline">Solicitações de Troca</span>
            <span className="sm:hidden">Trocas</span>
            {myPendingRequests.length > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 sm:static sm:ml-1 h-5 w-5 sm:h-auto sm:w-auto p-0 sm:px-2 flex items-center justify-center text-xs">{myPendingRequests.length}</Badge>
            )}
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
                              {format(new Date(duty.duty_date), "dd/MM/yyyy (EEEE)", { locale: ptBR })}
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
                  {athletes
                    .filter(a => a.gender === 'female')
                    .map(athlete => (
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
                        const dutyDate = new Date(duty.duty_date);
                        const canRequestSwap = !isPast(dutyDate);

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
                              {canRequestSwap && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleSwapRequest(duty)}
                                >
                                  <ArrowLeftRight className="h-4 w-4 mr-1" />
                                  Trocar
                                </Button>
                              )}
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

          {/* Swap Requests Tab */}
          <TabsContent value="swap-requests">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5" />
                  Solicitações de Troca
                </CardTitle>
                <CardDescription>
                  Gerencie solicitações de troca de rodízio
                </CardDescription>
              </CardHeader>
              <CardContent>
                {swapRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ArrowLeftRight className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma solicitação de troca.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data do Rodízio</TableHead>
                        <TableHead>Solicitante</TableHead>
                        <TableHead>Destinatário</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado em</TableHead>
                        {(isAdmin || selectedAthleteId) && <TableHead className="text-right">Ações</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {swapRequests.map((request) => {
                        const canRespond = (isAdmin || request.target_athlete_id === selectedAthleteId) 
                          && request.status === 'pending';

                        return (
                          <TableRow key={request.id}>
                            <TableCell>
                              {request.rotation_duty?.duty_date 
                                ? format(new Date(request.rotation_duty.duty_date), 'dd/MM/yyyy')
                                : '-'}
                            </TableCell>
                            <TableCell>{request.requester?.name}</TableCell>
                            <TableCell>{request.target?.name}</TableCell>
                            <TableCell>{getSwapStatusBadge(request.status)}</TableCell>
                            <TableCell>
                              {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm')}
                            </TableCell>
                            {(isAdmin || selectedAthleteId) && (
                              <TableCell className="text-right">
                                {canRespond && (
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-green-600 hover:text-green-700"
                                      onClick={() => handleRespondSwap(
                                        request.id, 
                                        'approved',
                                        request.target_athlete_id
                                      )}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Aceitar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => handleRespondSwap(request.id, 'rejected')}
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Recusar
                                    </Button>
                                  </div>
                                )}
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
        </Tabs>

      {/* Form Dialog */}
      <RotationFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen}
        athletes={athletes}
      />

      {/* Bulk Form Dialog */}
      <BulkRotationDialog
        open={isBulkFormOpen}
        onOpenChange={setIsBulkFormOpen}
        athletes={athletes}
      />

      {/* Swap Request Dialog */}
      {selectedDuty && selectedAthleteId && (
        <SwapRequestDialog
          open={isSwapDialogOpen}
          onOpenChange={setIsSwapDialogOpen}
          duty={selectedDuty}
          currentAthleteId={selectedAthleteId}
          athletes={athletes}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Rodízio</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este rodízio? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
