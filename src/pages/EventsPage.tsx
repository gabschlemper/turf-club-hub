import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useEvents } from '@/hooks/useEvents';
import { Plus, Filter, Calendar, MapPin, Clock, Pencil, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventSchema, EventFormData } from '@/lib/validations';
import { Database } from '@/integrations/supabase/types';

type EventType = Database['public']['Enums']['event_type'];
type GenderType = Database['public']['Enums']['gender_type'];
type EventFilter = 'all' | EventType;

const eventTypeLabels: Record<EventType, string> = {
  championship: 'Campeonato',
  training: 'Treino',
  social: 'Confraternização',
};

const genderLabels: Record<GenderType, string> = {
  male: 'Masculino',
  female: 'Feminino',
  both: 'Ambos',
};

const eventTypeStyles: Record<EventType, { bg: string; text: string }> = {
  championship: { bg: 'bg-success/10', text: 'text-success' },
  training: { bg: 'bg-primary/10', text: 'text-primary' },
  social: { bg: 'bg-warning/10', text: 'text-warning' },
};

export function EventsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { events, isLoading, createEvent, updateEvent, deleteEvent } = useEvents();
  const [filter, setFilter] = useState<EventFilter>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<string | null>(null);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: { name: '', event_type: 'training', start_datetime: '', end_datetime: '', location: '', gender: 'both', description: '' },
  });

  const filteredEvents = events.filter(event => filter === 'all' || event.event_type === filter);

  const filterOptions: { value: EventFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'training', label: 'Treinos' },
    { value: 'championship', label: 'Campeonatos' },
    { value: 'social', label: 'Confraternizações' },
  ];

  const openCreateDialog = () => {
    form.reset({ name: '', event_type: 'training', start_datetime: '', end_datetime: '', location: '', gender: 'both', description: '' });
    setEditingEvent(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (event: typeof events[0]) => {
    form.reset({
      name: event.name,
      event_type: event.event_type,
      start_datetime: event.start_datetime.slice(0, 16),
      end_datetime: event.end_datetime.slice(0, 16),
      location: event.location,
      gender: event.gender,
      description: event.description || '',
    });
    setEditingEvent(event.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: EventFormData) => {
    const eventData = {
      name: data.name,
      event_type: data.event_type,
      start_datetime: data.start_datetime,
      end_datetime: data.end_datetime,
      location: data.location,
      gender: data.gender,
      description: data.description || null,
    };

    if (editingEvent) {
      await updateEvent.mutateAsync({ id: editingEvent, ...eventData });
    } else {
      await createEvent.mutateAsync(eventData);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deletingEvent) {
      await deleteEvent.mutateAsync(deletingEvent);
      setDeletingEvent(null);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Eventos" description="Calendário de treinos, jogos e reuniões" action={isAdmin && <Button variant="gradient" onClick={openCreateDialog}><Plus className="w-4 h-4" />Novo Evento</Button>} />

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        {filterOptions.map(option => (
          <button key={option.value} onClick={() => setFilter(option.value)} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap", filter === option.value ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}>{option.label}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEvents.map(event => {
          const style = eventTypeStyles[event.event_type];
          return (
            <div key={event.id} className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <span className={cn("text-xs font-medium px-3 py-1 rounded-full", style.bg, style.text)}>{eventTypeLabels[event.event_type]}</span>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button onClick={() => openEditDialog(event)} className="p-1.5 hover:bg-muted rounded"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                    <button onClick={() => setDeletingEvent(event.id)} className="p-1.5 hover:bg-destructive/10 rounded"><Trash2 className="w-4 h-4 text-destructive" /></button>
                  </div>
                )}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">{event.name}</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /><span>{format(new Date(event.start_datetime), "EEEE, d 'de' MMMM", { locale: ptBR })}</span></div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4" /><span>{format(new Date(event.start_datetime), 'HH:mm')} - {format(new Date(event.end_datetime), 'HH:mm')}</span></div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /><span>{event.location}</span></div>
              </div>
              <div className="mt-3 pt-3 border-t border-border"><span className="text-xs text-muted-foreground">Naipe: {genderLabels[event.gender]}</span></div>
            </div>
          );
        })}
      </div>

      {filteredEvents.length === 0 && <div className="p-12 rounded-xl bg-card border border-border text-center"><p className="text-muted-foreground">Nenhum evento encontrado</p></div>}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingEvent ? 'Editar Evento' : 'Novo Evento'}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div><Label>Nome do evento</Label><Input {...form.register('name')} />{form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}</div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Tipo</Label><Select value={form.watch('event_type')} onValueChange={(v) => form.setValue('event_type', v as EventType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="training">Treino</SelectItem><SelectItem value="championship">Campeonato</SelectItem><SelectItem value="social">Confraternização</SelectItem></SelectContent></Select></div>
              <div><Label>Naipe</Label><Select value={form.watch('gender')} onValueChange={(v) => form.setValue('gender', v as GenderType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="male">Masculino</SelectItem><SelectItem value="female">Feminino</SelectItem><SelectItem value="both">Ambos</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Início</Label><Input type="datetime-local" {...form.register('start_datetime')} />{form.formState.errors.start_datetime && <p className="text-sm text-destructive mt-1">{form.formState.errors.start_datetime.message}</p>}</div>
              <div><Label>Fim</Label><Input type="datetime-local" {...form.register('end_datetime')} />{form.formState.errors.end_datetime && <p className="text-sm text-destructive mt-1">{form.formState.errors.end_datetime.message}</p>}</div>
            </div>
            <div><Label>Local</Label><Input {...form.register('location')} />{form.formState.errors.location && <p className="text-sm text-destructive mt-1">{form.formState.errors.location.message}</p>}</div>
            <div><Label>Descrição (opcional)</Label><Input {...form.register('description')} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button><Button type="submit" variant="gradient" disabled={createEvent.isPending || updateEvent.isPending}>{(createEvent.isPending || updateEvent.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editingEvent ? 'Salvar' : 'Criar'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingEvent} onOpenChange={() => setDeletingEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir evento?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
