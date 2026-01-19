import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
import { Textarea } from '@/components/ui/textarea';
import { useRotationDuties } from '@/hooks/useRotationDuties';

const formSchema = z.object({
  target_athlete_id: z.string().min(1, 'Selecione um atleta para trocar'),
  message: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SwapRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duty: {
    id: string;
    duty_date: string;
    athlete1_id: string;
    athlete2_id: string;
    athlete1?: { id: string; name: string };
    athlete2?: { id: string; name: string };
  };
  currentAthleteId: string;
  athletes: { id: string; name: string; gender: string }[];
}

export function SwapRequestDialog({ 
  open, 
  onOpenChange, 
  duty, 
  currentAthleteId, 
  athletes 
}: SwapRequestDialogProps) {
  const { createSwapRequest } = useRotationDuties();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      target_athlete_id: '',
      message: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await createSwapRequest.mutateAsync({
        rotation_duty_id: duty.id,
        requester_athlete_id: currentAthleteId,
        target_athlete_id: data.target_athlete_id,
        message: data.message || undefined,
      });
      form.reset();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get available athletes (exclude current athlete and partner)
  const partnerId = duty.athlete1_id === currentAthleteId ? duty.athlete2_id : duty.athlete1_id;
  const availableAthletes = athletes.filter(
    a => a.id !== currentAthleteId && a.id !== partnerId && a.gender === 'female'
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Solicitar Troca</DialogTitle>
          <DialogDescription>
            Solicite uma troca para o rodízio de {format(new Date(duty.duty_date), "dd 'de' MMMM", { locale: ptBR })}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="target_athlete_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trocar com</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione quem vai assumir seu lugar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableAthletes.map((athlete) => (
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
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Explique o motivo da troca..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
