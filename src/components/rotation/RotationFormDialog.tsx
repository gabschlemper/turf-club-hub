import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useRotationDuties } from '@/hooks/useRotationDuties';
import { cn } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';
import { parseLocalDate } from '@/lib/dateUtils';
import type { RotationDuty } from '@/hooks/useRotationDuties';

const formSchema = z.object({
  duty_date: z.date({ required_error: 'Selecione uma data' }),
  athlete1_id: z.string().min(1, 'Selecione o primeiro atleta'),
  athlete2_id: z.string().min(1, 'Selecione o segundo atleta'),
  athlete3_id: z.string().optional(),
}).refine(data => {
  // Athlete1 and Athlete2 must be different
  if (data.athlete1_id === data.athlete2_id) return false;
  
  // If athlete3 exists, it must be different from athlete1 and athlete2
  if (data.athlete3_id && data.athlete3_id !== '') {
    if (data.athlete3_id === data.athlete1_id || data.athlete3_id === data.athlete2_id) {
      return false;
    }
  }
  
  return true;
}, {
  message: 'Todos os atletas devem ser diferentes',
  path: ['athlete2_id'],
});

type FormData = z.infer<typeof formSchema>;

interface RotationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  athletes: { id: string; name: string; gender: string }[];
  editingDuty?: RotationDuty | null;
}

export function RotationFormDialog({ open, onOpenChange, athletes, editingDuty }: RotationFormDialogProps) {
  const { createDuty, updateDuty } = useRotationDuties();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      athlete1_id: '',
      athlete2_id: '',
      athlete3_id: '',
    },
  });

  // Reset form when editingDuty changes
  useEffect(() => {
    if (editingDuty) {
      form.reset({
        duty_date: parseLocalDate(editingDuty.duty_date),
        athlete1_id: editingDuty.athlete1_id,
        athlete2_id: editingDuty.athlete2_id,
        athlete3_id: editingDuty.athlete3_id || '',
      });
    } else {
      form.reset({
        athlete1_id: '',
        athlete2_id: '',
        athlete3_id: '',
      });
    }
  }, [editingDuty, form]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      if (editingDuty) {
        // Update existing duty
        await updateDuty.mutateAsync({
          id: editingDuty.id,
          duty_date: format(data.duty_date, 'yyyy-MM-dd'),
          athlete1_id: data.athlete1_id,
          athlete2_id: data.athlete2_id,
          ...(data.athlete3_id && data.athlete3_id !== '' ? { athlete3_id: data.athlete3_id } : { athlete3_id: null }),
        });
      } else {
        // Create new duty
        await createDuty.mutateAsync({
          duty_date: format(data.duty_date, 'yyyy-MM-dd'),
          athlete1_id: data.athlete1_id,
          athlete2_id: data.athlete2_id,
          ...(data.athlete3_id && data.athlete3_id !== '' ? { athlete3_id: data.athlete3_id } : {}),
        });
      }
      form.reset();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingDuty ? 'Editar Rodízio' : 'Novo Rodízio'}</DialogTitle>
          <DialogDescription>
            {editingDuty 
              ? 'Atualize os detalhes do compromisso de apoio ao treino de base.'
              : 'Cadastre um novo compromisso de apoio ao treino de base.'
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="duty_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="athlete1_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Atleta 1</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o primeiro atleta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {athletes.map((athlete) => (
                        <SelectItem key={athlete.id} value={athlete.id}>
                          {athlete.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="athlete2_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Atleta 2</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o segundo atleta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {athletes.map((athlete) => (
                        <SelectItem key={athlete.id} value={athlete.id}>
                          {athlete.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="athlete3_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Atleta 3 (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o terceiro atleta (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {athletes.map((athlete) => (
                        <SelectItem key={athlete.id} value={athlete.id}>
                          {athlete.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
