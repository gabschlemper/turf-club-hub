import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useEvents } from '@/hooks/useEvents';
import { EventCalendar } from '@/components/calendar/EventCalendar';
import { EventFormDialog } from '@/components/calendar/EventFormDialog';
import { EventDetailDialog } from '@/components/calendar/EventDetailDialog';
import { BulkEventDialog } from '@/components/calendar/BulkEventDialog';
import { Plus, CalendarPlus, Loader2 } from 'lucide-react';
import { EventFormData } from '@/lib/validations';
import { Database } from '@/integrations/supabase/types';
import { formatForDatabase } from '@/lib/dateUtils';

type Event = Database['public']['Tables']['events']['Row'];

export function EventsPage() {
  const { isAdmin } = useAuth();
  const { events, isLoading, createEvent, createBulkEvents, updateEvent, deleteEvent } = useEvents();
  
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [defaultDate, setDefaultDate] = useState<Date | undefined>();
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  const handleAddEvent = (date: Date) => {
    setDefaultDate(date);
    setEditingEvent(null);
    setIsFormOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setIsDetailOpen(false);
    setIsFormOpen(true);
  };

  const handleDeleteEvent = (event: Event) => {
    setDeletingEvent(event);
    setIsDetailOpen(false);
  };

  const handleFormSubmit = async (data: EventFormData) => {
    const eventData = {
      name: data.name,
      event_type: data.event_type,
      start_datetime: formatForDatabase(data.start_datetime),
      end_datetime: formatForDatabase(data.end_datetime),
      location: data.location,
      gender: data.gender,
      description: data.description || null,
    };

    if (editingEvent) {
      await updateEvent.mutateAsync({ id: editingEvent.id, ...eventData });
    } else {
      await createEvent.mutateAsync(eventData);
    }
    setIsFormOpen(false);
    setEditingEvent(null);
    setDefaultDate(undefined);
  };

  const handleBulkSubmit = async (eventsData: EventFormData[]) => {
    const formattedEvents = eventsData.map(data => ({
      name: data.name,
      event_type: data.event_type,
      start_datetime: formatForDatabase(data.start_datetime),
      end_datetime: formatForDatabase(data.end_datetime),
      location: data.location,
      gender: data.gender,
      description: data.description || null,
    }));

    await createBulkEvents.mutateAsync(formattedEvents);
    setIsBulkOpen(false);
  };

  const confirmDelete = async () => {
    if (deletingEvent) {
      await deleteEvent.mutateAsync(deletingEvent.id);
      setDeletingEvent(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Eventos" 
        description="Calendário de treinos, jogos e reuniões" 
        action={
          isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsBulkOpen(true)}>
                <CalendarPlus className="w-4 h-4 mr-2" />
                Criar em Massa
              </Button>
              <Button variant="gradient" onClick={() => {
                setEditingEvent(null);
                setDefaultDate(undefined);
                setIsFormOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Evento
              </Button>
            </div>
          )
        } 
      />

      <EventCalendar
        events={events}
        onEventClick={handleEventClick}
        onAddEvent={handleAddEvent}
        isAdmin={isAdmin}
      />

      <EventDetailDialog
        event={selectedEvent}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        isAdmin={isAdmin}
      />

      <EventFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingEvent(null);
            setDefaultDate(undefined);
          }
        }}
        onSubmit={handleFormSubmit}
        event={editingEvent}
        defaultDate={defaultDate}
        isLoading={createEvent.isPending || updateEvent.isPending}
      />

      <BulkEventDialog
        open={isBulkOpen}
        onOpenChange={setIsBulkOpen}
        onSubmit={handleBulkSubmit}
        isLoading={createBulkEvents.isPending}
      />

      <AlertDialog open={!!deletingEvent} onOpenChange={() => setDeletingEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deletingEvent?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
