import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, eachDayOfInterval, getDay, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { bulkEventSchema, BulkEventFormData, EventFormData } from '@/lib/validations';
import { Loader2, CalendarPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (events: EventFormData[]) => Promise<void>;
  isLoading?: boolean;
}

const weekDays = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

export function BulkEventDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: BulkEventDialogProps) {
  const form = useForm<BulkEventFormData>({
    resolver: zodResolver(bulkEventSchema),
    defaultValues: {
      name: '',
      event_type: 'training',
      start_time: '10:00',
      end_time: '12:00',
      location: '',
      gender: 'both',
      description: '',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: '',
      weekdays: [],
    },
  });

  const selectedWeekdays = form.watch('weekdays') || [];

  const toggleWeekday = (day: number) => {
    const current = form.getValues('weekdays') || [];
    if (current.includes(day)) {
      form.setValue('weekdays', current.filter(d => d !== day));
    } else {
      form.setValue('weekdays', [...current, day]);
    }
  };

  const handleSubmit = async (data: BulkEventFormData) => {
    // Generate all dates in the range that match selected weekdays
    const startDate = parse(data.start_date, 'yyyy-MM-dd', new Date());
    const endDate = parse(data.end_date, 'yyyy-MM-dd', new Date());
    
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    const matchingDays = allDays.filter(day => data.weekdays.includes(getDay(day)));
    
    // Create events for each matching day
    const events: EventFormData[] = matchingDays.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      return {
        name: data.name,
        event_type: data.event_type,
        start_datetime: `${dateStr}T${data.start_time}`,
        end_datetime: `${dateStr}T${data.end_time}`,
        location: data.location,
        gender: data.gender,
        description: data.description,
      };
    });
    
    await onSubmit(events);
    form.reset();
  };

  // Calculate preview count
  const startDateValue = form.watch('start_date');
  const endDateValue = form.watch('end_date');
  const previewCount = (() => {
    if (!startDateValue || !endDateValue || selectedWeekdays.length === 0) return 0;
    try {
      const startDate = parse(startDateValue, 'yyyy-MM-dd', new Date());
      const endDate = parse(endDateValue, 'yyyy-MM-dd', new Date());
      if (endDate < startDate) return 0;
      const allDays = eachDayOfInterval({ start: startDate, end: endDate });
      return allDays.filter(day => selectedWeekdays.includes(getDay(day))).length;
    } catch {
      return 0;
    }
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5" />
            Criar Eventos em Massa
          </DialogTitle>
          <DialogDescription>
            Crie múltiplos eventos de uma só vez selecionando os dias da semana e o período.
          </DialogDescription>
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
                onValueChange={(value) => form.setValue('event_type', value as BulkEventFormData['event_type'])}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Naipe *</Label>
              <Select
                value={form.watch('gender')}
                onValueChange={(value) => form.setValue('gender', value as BulkEventFormData['gender'])}
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
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dias da semana *</Label>
            <div className="flex flex-wrap gap-2">
              {weekDays.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleWeekday(day.value)}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors border',
                    selectedWeekdays.includes(day.value)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50'
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
            {form.formState.errors.weekdays && (
              <p className="text-sm text-destructive">{form.formState.errors.weekdays.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data inicial *</Label>
              <Input
                id="start_date"
                type="date"
                {...form.register('start_date')}
              />
              {form.formState.errors.start_date && (
                <p className="text-sm text-destructive">{form.formState.errors.start_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Data final *</Label>
              <Input
                id="end_date"
                type="date"
                {...form.register('end_date')}
              />
              {form.formState.errors.end_date && (
                <p className="text-sm text-destructive">{form.formState.errors.end_date.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Hora de início *</Label>
              <Input
                id="start_time"
                type="time"
                {...form.register('start_time')}
              />
              {form.formState.errors.start_time && (
                <p className="text-sm text-destructive">{form.formState.errors.start_time.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">Hora de fim *</Label>
              <Input
                id="end_time"
                type="time"
                {...form.register('end_time')}
              />
              {form.formState.errors.end_time && (
                <p className="text-sm text-destructive">{form.formState.errors.end_time.message}</p>
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
              placeholder="Detalhes adicionais dos eventos..."
              rows={2}
            />
          </div>

          {previewCount > 0 && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-primary font-medium">
                Serão criados <span className="font-bold">{previewCount}</span> eventos
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="gradient" disabled={isLoading || previewCount === 0}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar {previewCount} Eventos
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
