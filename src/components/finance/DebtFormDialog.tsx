import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAthletes } from '@/hooks/useAthletes';
import type { DebtWithAthlete, Debt } from '@/hooks/useDebts';
import { ptBR } from 'date-fns/locale';

const debtFormSchema = z.object({
  athlete_id: z.string().min(1, 'Selecione um atleta'),
  description: z.string().min(1, 'Descrição é obrigatória').max(200, 'Máximo 200 caracteres'),
  amount: z.string().refine((val) => {
    const num = parseFloat(val.replace(',', '.'));
    return !isNaN(num) && num > 0;
  }, 'Valor deve ser maior que zero'),
  due_date: z.date({ required_error: 'Data de vencimento é obrigatória' }),
});

type DebtFormData = z.infer<typeof debtFormSchema>;

interface DebtFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt?: DebtWithAthlete | Debt | null;
  onSubmit: (data: { athlete_id: string; description: string; amount: number; due_date: string }) => void;
  isLoading?: boolean;
}

export function DebtFormDialog({
  open,
  onOpenChange,
  debt,
  onSubmit,
  isLoading,
}: DebtFormDialogProps) {
  const { athletes } = useAthletes();
  const isEditing = !!debt;

  const form = useForm<DebtFormData>({
    resolver: zodResolver(debtFormSchema),
    defaultValues: {
      athlete_id: '',
      description: '',
      amount: '',
      due_date: undefined,
    },
  });

  useEffect(() => {
    if (debt) {
      form.reset({
        athlete_id: debt.athlete_id,
        description: debt.description,
        amount: String(debt.amount).replace('.', ','),
        due_date: new Date(debt.due_date + 'T12:00:00'),
      });
    } else {
      form.reset({
        athlete_id: '',
        description: '',
        amount: '',
        due_date: undefined,
      });
    }
  }, [debt, form]);

  const handleSubmit = (data: DebtFormData) => {
    onSubmit({
      athlete_id: data.athlete_id,
      description: data.description.trim(),
      amount: parseFloat(data.amount.replace(',', '.')),
      due_date: format(data.due_date, 'yyyy-MM-dd'),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Dívida' : 'Nova Dívida'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="athlete_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Atleta</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={isEditing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um atleta" />
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Mensalidade Janeiro/2026" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="0,00" 
                      {...field}
                      onChange={(e) => {
                        // Allow only numbers and comma
                        const value = e.target.value.replace(/[^0-9,]/g, '');
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Vencimento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Selecione a data</span>
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
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
