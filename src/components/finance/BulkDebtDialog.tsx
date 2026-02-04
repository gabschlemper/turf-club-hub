import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Users, FileSpreadsheet, Upload } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAthletes } from '@/hooks/useAthletes';
import { useToast } from '@/hooks/use-toast';
import { ptBR } from 'date-fns/locale';

const bulkFormSchema = z.object({
  athlete_ids: z.array(z.string()).min(1, 'Selecione ao menos um atleta'),
  description: z.string().min(1, 'Descrição é obrigatória').max(200, 'Máximo 200 caracteres'),
  amount: z.string().refine((val) => {
    const num = parseFloat(val.replace(',', '.'));
    return !isNaN(num) && num > 0;
  }, 'Valor deve ser maior que zero'),
  due_date: z.date({ required_error: 'Data de vencimento é obrigatória' }),
});

type BulkFormData = z.infer<typeof bulkFormSchema>;

interface BulkDebtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (debts: { athlete_id: string; description: string; amount: number; due_date: string }[]) => void;
  isLoading?: boolean;
}

export function BulkDebtDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: BulkDebtDialogProps) {
  const { athletes } = useAthletes();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('manual');

  const form = useForm<BulkFormData>({
    resolver: zodResolver(bulkFormSchema),
    defaultValues: {
      athlete_ids: [],
      description: '',
      amount: '',
      due_date: undefined,
    },
  });

  const selectedAthletes = form.watch('athlete_ids');

  const handleSelectAll = () => {
    if (selectedAthletes.length === athletes.length) {
      form.setValue('athlete_ids', []);
    } else {
      form.setValue('athlete_ids', athletes.map(a => a.id));
    }
  };

  const handleSubmit = (data: BulkFormData) => {
    const debts = data.athlete_ids.map(athlete_id => ({
      athlete_id,
      description: data.description.trim(),
      amount: parseFloat(data.amount.replace(',', '.')),
      due_date: format(data.due_date, 'yyyy-MM-dd'),
    }));
    onSubmit(debts);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, envie um arquivo Excel (.xlsx) ou CSV.',
        variant: 'destructive',
      });
      return;
    }

    // For now, show instructions since we need xlsx library
    toast({
      title: 'Funcionalidade em desenvolvimento',
      description: 'O upload de planilhas será implementado em breve. Use o cadastro manual por enquanto.',
    });
    
    e.target.value = '';
  };

  const downloadTemplate = () => {
    // Create CSV template
    const headers = ['email_atleta', 'descricao', 'valor', 'data_vencimento'];
    const example = ['atleta@email.com', 'Mensalidade Janeiro/2026', '150.00', '2026-01-15'];
    const csv = [headers.join(','), example.join(',')].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo_dividas.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Lançar Dívidas em Massa</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="gap-2">
              <Users className="w-4 h-4" />
              Selecionar Atletas
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Importar Planilha
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="athlete_ids"
                  render={() => (
                    <FormItem>
                      <div className="flex items-center justify-between mb-2">
                        <FormLabel>Atletas ({selectedAthletes.length} selecionados)</FormLabel>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleSelectAll}
                        >
                          {selectedAthletes.length === athletes.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                        </Button>
                      </div>
                      <ScrollArea className="h-40 rounded-md border p-3">
                        <div className="space-y-2">
                          {athletes.map((athlete) => (
                            <FormField
                              key={athlete.id}
                              control={form.control}
                              name="athlete_ids"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(athlete.id)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        if (checked) {
                                          field.onChange([...current, athlete.id]);
                                        } else {
                                          field.onChange(current.filter((id) => id !== athlete.id));
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <span className="text-sm font-normal">
                                    {athlete.name}
                                  </span>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </ScrollArea>
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

                <div className="grid grid-cols-2 gap-4">
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
                        <FormLabel>Vencimento</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yy")
                                ) : (
                                  <span>Selecione</span>
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
                </div>

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
                    {isLoading ? 'Criando...' : `Criar ${selectedAthletes.length} Dívida${selectedAthletes.length !== 1 ? 's' : ''}`}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="upload" className="mt-4 space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Arraste um arquivo Excel ou CSV aqui, ou clique para selecionar
              </p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" asChild>
                  <span>Selecionar Arquivo</span>
                </Button>
              </label>
            </div>

            <div className="flex items-center justify-center">
              <Button variant="link" onClick={downloadTemplate} className="text-sm">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Baixar modelo de planilha
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Formato esperado:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <strong>email_atleta</strong>: E-mail cadastrado do atleta</li>
                <li>• <strong>descricao</strong>: Descrição da dívida</li>
                <li>• <strong>valor</strong>: Valor em reais (ex: 150.00)</li>
                <li>• <strong>data_vencimento</strong>: Data no formato YYYY-MM-DD</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
