import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Expense, ExpenseFormValues } from '@/hooks/useExpenses';

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(120),
  description: z.string().max(500).optional(),
  amount: z.string().refine((v) => {
    const n = parseFloat(v.replace(',', '.'));
    return !isNaN(n) && n > 0;
  }, 'Valor deve ser maior que zero'),
  expense_date: z.date({ required_error: 'Data é obrigatória' }),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  expense?: Expense | null;
  onSubmit: (values: ExpenseFormValues) => void;
  isLoading?: boolean;
}

export function ExpenseFormDialog({ open, onOpenChange, expense, onSubmit, isLoading }: Props) {
  const isEditing = !!expense;
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', amount: '', expense_date: undefined },
  });

  useEffect(() => {
    if (expense) {
      form.reset({
        name: expense.name,
        description: expense.description ?? '',
        amount: String(expense.amount).replace('.', ','),
        expense_date: new Date(expense.expense_date + 'T12:00:00'),
      });
    } else {
      form.reset({ name: '', description: '', amount: '', expense_date: undefined });
    }
  }, [expense, form]);

  const handleSubmit = (data: FormData) => {
    onSubmit({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      amount: parseFloat(data.amount.replace(',', '.')),
      expense_date: format(data.expense_date, 'yyyy-MM-dd'),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{isEditing ? 'Editar Saída' : 'Nova Saída'}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl><Input placeholder="Ex: Aluguel da quadra" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição (opcional)</FormLabel>
                <FormControl><Textarea rows={2} placeholder="Detalhes da despesa" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="amount" render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
                <FormControl>
                  <Input placeholder="0,00" {...field}
                    onChange={(e) => field.onChange(e.target.value.replace(/[^0-9,]/g, ''))}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="expense_date" render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, 'dd/MM/yyyy') : <span>Selecione a data</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} locale={ptBR} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}/>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancelar</Button>
              <Button type="submit" disabled={isLoading} className="flex-1">{isLoading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
