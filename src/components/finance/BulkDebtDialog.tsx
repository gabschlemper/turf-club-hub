import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Users, FileSpreadsheet, Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAthletes } from '@/hooks/useAthletes';
import { useToast } from '@/hooks/use-toast';
import { ptBR } from 'date-fns/locale';

interface ParsedDebt {
  email: string;
  description: string;
  amount: number;
  due_date: string;
  athlete_id?: string;
  error?: string;
}

interface ImportResult {
  valid: ParsedDebt[];
  invalid: ParsedDebt[];
}

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
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);

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

  const parseExcelDate = (value: any): string | null => {
    if (!value) return null;
    
    // If it's already a string in YYYY-MM-DD format
    if (typeof value === 'string') {
      const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (isoMatch) return value;
      
      // Try DD/MM/YYYY format
      const brMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (brMatch) {
        const [, day, month, year] = brMatch;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    // If it's an Excel serial date number
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      if (date) {
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      }
    }
    
    return null;
  };

  const parseAmount = (value: any): number | null => {
    if (!value) return null;
    
    // Convert to string and clean up
    const str = String(value).trim().replace(/\s/g, '');
    
    // Remove R$ prefix if present
    const cleaned = str.replace(/^R\$\s*/, '').replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    
    return isNaN(num) || num <= 0 ? null : num;
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
    
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, envie um arquivo Excel (.xlsx, .xls) ou CSV.',
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }

    setIsParsing(true);
    setImportResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      if (rows.length < 2) {
        toast({
          title: 'Arquivo vazio',
          description: 'O arquivo não contém dados suficientes. A primeira linha deve ser o cabeçalho.',
          variant: 'destructive',
        });
        setIsParsing(false);
        e.target.value = '';
        return;
      }

      // Get header row and find column indices
      const headers = rows[0].map((h: any) => String(h).toLowerCase().trim());
      const emailIdx = headers.findIndex((h: string) => h.includes('email'));
      const descIdx = headers.findIndex((h: string) => h.includes('descri'));
      const amountIdx = headers.findIndex((h: string) => h.includes('valor') || h.includes('amount'));
      const dateIdx = headers.findIndex((h: string) => h.includes('vencimento') || h.includes('data') || h.includes('date'));

      if (emailIdx === -1 || descIdx === -1 || amountIdx === -1 || dateIdx === -1) {
        toast({
          title: 'Colunas não encontradas',
          description: 'A planilha deve conter: email_atleta, descricao, valor, data_vencimento',
          variant: 'destructive',
        });
        setIsParsing(false);
        e.target.value = '';
        return;
      }

      const valid: ParsedDebt[] = [];
      const invalid: ParsedDebt[] = [];

      // Process data rows (skip header)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.every((cell: any) => !cell)) continue; // Skip empty rows

        const email = String(row[emailIdx] || '').trim().toLowerCase();
        const description = String(row[descIdx] || '').trim();
        const amount = parseAmount(row[amountIdx]);
        const due_date = parseExcelDate(row[dateIdx]);

        const errors: string[] = [];

        if (!email || !email.includes('@')) {
          errors.push('Email inválido');
        }

        if (!description) {
          errors.push('Descrição vazia');
        }

        if (!amount) {
          errors.push('Valor inválido');
        }

        if (!due_date) {
          errors.push('Data inválida');
        }

        // Find athlete by email
        const athlete = athletes.find(a => a.email.toLowerCase() === email);
        if (!athlete && !errors.some(e => e.includes('Email'))) {
          errors.push('Atleta não encontrado');
        }

        const parsed: ParsedDebt = {
          email,
          description,
          amount: amount || 0,
          due_date: due_date || '',
          athlete_id: athlete?.id,
          error: errors.length > 0 ? errors.join(', ') : undefined,
        };

        if (errors.length > 0) {
          invalid.push(parsed);
        } else {
          valid.push(parsed);
        }
      }

      setImportResult({ valid, invalid });

      if (valid.length === 0 && invalid.length > 0) {
        toast({
          title: 'Nenhum registro válido',
          description: `${invalid.length} registro(s) com erro. Verifique os dados.`,
          variant: 'destructive',
        });
      } else if (valid.length > 0) {
        toast({
          title: 'Arquivo processado',
          description: `${valid.length} registro(s) válido(s)${invalid.length > 0 ? `, ${invalid.length} com erro` : ''}.`,
        });
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: 'Erro ao processar arquivo',
        description: 'Não foi possível ler o arquivo. Verifique o formato.',
        variant: 'destructive',
      });
    } finally {
      setIsParsing(false);
      e.target.value = '';
    }
  };

  const handleImportSubmit = () => {
    if (!importResult || importResult.valid.length === 0) return;

    const debts = importResult.valid.map(d => ({
      athlete_id: d.athlete_id!,
      description: d.description,
      amount: d.amount,
      due_date: d.due_date,
    }));

    onSubmit(debts);
    setImportResult(null);
  };

  const downloadTemplate = () => {
    // Create Excel template with xlsx
    const ws = XLSX.utils.aoa_to_sheet([
      ['email_atleta', 'descricao', 'valor', 'data_vencimento'],
      ['atleta@email.com', 'Mensalidade Janeiro/2026', '150.00', '2026-01-15'],
      ['outro@email.com', 'Taxa de Uniforme', '80.00', '2026-02-01'],
    ]);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dívidas');
    
    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // email
      { wch: 30 }, // descricao
      { wch: 12 }, // valor
      { wch: 15 }, // data
    ];
    
    XLSX.writeFile(wb, 'modelo_dividas.xlsx');
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setImportResult(null);
      setActiveTab('manual');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
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

          <TabsContent value="upload" className="mt-4 space-y-4 overflow-y-auto flex-1">
            {/* Upload area */}
            {!importResult && (
              <>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  {isParsing ? (
                    <>
                      <Loader2 className="w-10 h-10 mx-auto text-primary mb-4 animate-spin" />
                      <p className="text-sm text-muted-foreground">Processando arquivo...</p>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
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
                    <li>• <strong>valor</strong>: Valor em reais (ex: 150.00 ou 150,00)</li>
                    <li>• <strong>data_vencimento</strong>: Data (YYYY-MM-DD ou DD/MM/YYYY)</li>
                  </ul>
                </div>
              </>
            )}

            {/* Import results */}
            {importResult && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="flex gap-3">
                  {importResult.valid.length > 0 && (
                    <div className="flex-1 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                          {importResult.valid.length} válido(s)
                        </span>
                      </div>
                    </div>
                  )}
                  {importResult.invalid.length > 0 && (
                    <div className="flex-1 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="w-4 h-4 text-destructive" />
                        <span className="text-sm font-medium text-destructive">
                          {importResult.invalid.length} erro(s)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Valid records preview */}
                {importResult.valid.length > 0 && (
                  <div className="rounded-lg border border-border">
                    <div className="p-2 border-b border-border bg-muted/30">
                      <span className="text-xs font-medium">Registros válidos</span>
                    </div>
                    <ScrollArea className="max-h-32">
                      <div className="p-2 space-y-1">
                        {importResult.valid.map((d, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-muted/20">
                            <span className="truncate max-w-[120px]">{d.email}</span>
                            <span className="font-medium">R$ {d.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Invalid records */}
                {importResult.invalid.length > 0 && (
                  <div className="rounded-lg border border-destructive/30">
                    <div className="p-2 border-b border-destructive/30 bg-destructive/5">
                      <span className="text-xs font-medium text-destructive">Registros com erro</span>
                    </div>
                    <ScrollArea className="max-h-32">
                      <div className="p-2 space-y-1">
                        {importResult.invalid.map((d, idx) => (
                          <div key={idx} className="text-xs py-1 px-2 rounded bg-destructive/5">
                            <div className="flex items-center justify-between">
                              <span className="truncate max-w-[120px]">{d.email || '(vazio)'}</span>
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                Erro
                              </Badge>
                            </div>
                            <p className="text-destructive/80 mt-0.5">{d.error}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setImportResult(null)}
                    className="flex-1"
                  >
                    Escolher outro arquivo
                  </Button>
                  <Button 
                    onClick={handleImportSubmit} 
                    disabled={isLoading || importResult.valid.length === 0} 
                    className="flex-1"
                  >
                    {isLoading ? 'Importando...' : `Importar ${importResult.valid.length} Dívida${importResult.valid.length !== 1 ? 's' : ''}`}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
