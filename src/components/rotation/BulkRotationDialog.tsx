import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parse } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { useRotationDuties } from '@/hooks/useRotationDuties';

const rotationEntrySchema = z.object({
  date: z.string().min(1, 'Informe a data'),
  athlete1_id: z.string().min(1, 'Selecione o atleta 1'),
  athlete2_id: z.string().min(1, 'Selecione o atleta 2'),
}).refine(data => data.athlete1_id !== data.athlete2_id, {
  message: 'Os atletas devem ser diferentes',
  path: ['athlete2_id'],
});

const formSchema = z.object({
  entries: z.array(rotationEntrySchema).min(1, 'Adicione pelo menos um rodízio'),
});

type FormData = z.infer<typeof formSchema>;

interface BulkRotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  athletes: { id: string; name: string; gender: string }[];
}

export function BulkRotationDialog({ open, onOpenChange, athletes }: BulkRotationDialogProps) {
  const { createBulkDuties } = useRotationDuties();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entries: [{ date: '', athlete1_id: '', athlete2_id: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'entries',
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const duties = data.entries.map(entry => {
        // Parse date from DD/MM format assuming current year or next year
        const [day, month] = entry.date.split('/').map(Number);
        const currentYear = new Date().getFullYear();
        let date = new Date(currentYear, month - 1, day);
        
        // If the date is in the past, assume it's for next year
        if (date < new Date()) {
          date = new Date(currentYear + 1, month - 1, day);
        }

        return {
          duty_date: format(date, 'yyyy-MM-dd'),
          athlete1_id: entry.athlete1_id,
          athlete2_id: entry.athlete2_id,
        };
      });

      await createBulkDuties.mutateAsync(duties);
      form.reset({ entries: [{ date: '', athlete1_id: '', athlete2_id: '' }] });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter only female athletes
  const femaleAthletes = athletes.filter(a => a.gender === 'female');

  // Helper to find athlete by name (partial match)
  const findAthleteByName = (name: string) => {
    const normalized = name.toLowerCase().trim();
    return femaleAthletes.find(a => a.name.toLowerCase().includes(normalized));
  };

  // Parse pasted data
  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length > 0) {
      e.preventDefault();
      
      const newEntries = lines.map(line => {
        // Expected format: "25/01Atleta1 • Atleta2" or "25/01 Atleta1 • Atleta2"
        const dateMatch = line.match(/^(\d{2}\/\d{2})/);
        const date = dateMatch ? dateMatch[1] : '';
        
        const namesSection = line.replace(/^\d{2}\/\d{2}\s*/, '');
        const names = namesSection.split('•').map(n => n.trim());
        
        const athlete1 = findAthleteByName(names[0] || '');
        const athlete2 = findAthleteByName(names[1] || '');

        return {
          date,
          athlete1_id: athlete1?.id || '',
          athlete2_id: athlete2?.id || '',
        };
      });

      form.setValue('entries', newEntries);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Rodízios em Massa</DialogTitle>
          <DialogDescription>
            Cole a lista de rodízios no formato "DD/MMAatleta1 • Atleta2" ou adicione manualmente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div 
              className="space-y-3"
              onPaste={handlePaste}
            >
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <FormField
                    control={form.control}
                    name={`entries.${index}.date`}
                    render={({ field }) => (
                      <FormItem className="flex-shrink-0 w-24">
                        <FormControl>
                          <Input 
                            placeholder="DD/MM" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`entries.${index}.athlete1_id`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Atleta 1" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {femaleAthletes.map((athlete) => (
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
                    name={`entries.${index}.athlete2_id`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Atleta 2" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {femaleAthletes.map((athlete) => (
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

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => append({ date: '', athlete1_id: '', athlete2_id: '' })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Linha
            </Button>

            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              <strong>Dica:</strong> Você pode colar uma lista completa no formato:<br />
              <code className="text-xs">25/01Andressa Kruger • Bruna Platt</code>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : `Salvar ${fields.length} rodízio(s)`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
