import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, MapPin, Users, Pencil, Trash2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database } from '@/integrations/supabase/types';

type Event = Database['public']['Tables']['events']['Row'];

const eventTypeLabels: Record<string, string> = {
  championship: 'Campeonato',
  training: 'Treino',
  social: 'Confraternização',
};

const genderLabels: Record<string, string> = {
  male: 'Masculino',
  female: 'Feminino',
  both: 'Ambos',
};

const eventTypeColors: Record<string, string> = {
  championship: 'bg-primary text-primary-foreground',
  training: 'bg-blue-500 text-white',
  social: 'bg-green-500 text-white',
};

interface EventDetailDialogProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
  isAdmin?: boolean;
}

export function EventDetailDialog({
  event,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  isAdmin = false,
}: EventDetailDialogProps) {
  if (!event) return null;

  const startDate = parseISO(event.start_datetime);
  const endDate = parseISO(event.end_datetime);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Badge className={eventTypeColors[event.event_type]}>
                {eventTypeLabels[event.event_type]}
              </Badge>
              <DialogTitle className="text-xl mt-2">{event.name}</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">
                {format(startDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>
                  {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
            <p>{event.location}</p>
          </div>

          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
            <p>{genderLabels[event.gender]}</p>
          </div>

          {event.description && (
            <div className="pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground">{event.description}</p>
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => onEdit(event)}>
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button variant="destructive" onClick={() => onDelete(event)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
