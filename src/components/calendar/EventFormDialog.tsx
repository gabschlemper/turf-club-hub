import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, getDay } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { eventSchema, EventFormData } from '@/lib/validations';
import { formatForDateTimeInput } from '@/lib/dateUtils';
import { Database } from '@/integrations/supabase/types';
import { Loader2, Info } from 'lucide-react';

type Event = Database['public']['Tables']['events']['Row'];

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EventFormData) => Promise<void>;
  event?: Event | null;
  defaultDate?: Date;
  isLoading?: boolean;
}

export function EventFormDialog({
  open,
  onOpenChange,
  onSubmit,
  event,
  defaultDate,
  isLoading = false,
}: EventFormDialogProps) {
  const isEditing = !!event;

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: '',
      event_type: 'training',
      start_datetime: '',
      end_datetime: '',
      location: '',
      gender: 'both',
      description: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (event) {
        form.reset({
          name: event.name,
          event_type: event.event_type,
          start_datetime: formatForDateTimeInput(event.start_datetime),
          end_datetime: formatForDateTimeInput(event.end_datetime),
          location: event.location,
          gender: event.gender,
          description: event.description || '',
        });
      } else if (defaultDate) {
        const dateStr = format(defaultDate, "yyyy-MM-dd'T'10:00");
        const endDateStr = format(defaultDate, "yyyy-MM-dd'T'12:00");
        form.reset({
          name: '',
          event_type: 'training',
          start_datetime: dateStr,
          end_datetime: endDateStr,
          location: '',
          gender: 'both',
          description: '',
        });
      } else {
        form.reset({
          name: '',
          event_type: 'training',
          start_datetime: '',
          end_datetime: '',
          location: '',
          gender: 'both',
          description: '',
        });
      }
    }
  }, [open, event, defaultDate, form]);

  // Infer training type based on selected date
  const inferredTrainingType = useMemo(() => {
    const startDatetime = form.watch('start_datetime');
    if (!startDatetime) return null;
    const date = new Date(startDatetime);
    const dayOfWeek = getDay(date);
    return dayOfWeek === 0 ? 'principal' : 'extra';
  }, [form.watch('start_datetime')]);

  const handleSubmit = async (data: EventFormData) => {
    await onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do evento *</Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="Ex: Treino de segunda"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_type">Tipo *</Label>
              <Select
                value={form.watch('event_type')}
                onValueChange={(value) => form.setValue('event_type', value as EventFormData['event_type'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="training">Treino</SelectItem>
                  <SelectItem value="championship">Campeonato</SelectItem>
                  <SelectItem value="social">Confraternização</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.event_type && (
                <p className="text-sm text-destructive">{form.formState.errors.event_type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Naipe *</Label>
              <Select
                value={form.watch('gender')}
                onValueChange={(value) => form.setValue('gender', value as EventFormData['gender'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Ambos</SelectItem>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Feminino</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.gender && (
                <p className="text-sm text-destructive">{form.formState.errors.gender.message}</p>
              )}
            </div>
          </div>

          {/* Training Type Info */}
          {form.watch('event_type') === 'training' && inferredTrainingType && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
              <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  Tipo de Treino: {inferredTrainingType === 'principal' ? '📅 Principal (Domingo)' : '⚡ Extra (Semana)'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {inferredTrainingType === 'principal' 
                    ? 'Treino vale 1.0 ponto na frequência' 
                    : 'Treino vale 0.25 ponto (bônus) na frequência'}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_datetime">Início *</Label>
              <Input
                id="start_datetime"
                type="datetime-local"
                {...form.register('start_datetime')}
              />
              {form.formState.errors.start_datetime && (
                <p className="text-sm text-destructive">{form.formState.errors.start_datetime.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_datetime">Fim *</Label>
              <Input
                id="end_datetime"
                type="datetime-local"
                {...form.register('end_datetime')}
              />
              {form.formState.errors.end_datetime && (
                <p className="text-sm text-destructive">{form.formState.errors.end_datetime.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Local *</Label>
            <Input
              id="location"
              {...form.register('location')}
              placeholder="Ex: Quadra principal"
            />
            {form.formState.errors.location && (
              <p className="text-sm text-destructive">{form.formState.errors.location.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Detalhes adicionais do evento..."
              rows={3}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="gradient" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar Evento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
