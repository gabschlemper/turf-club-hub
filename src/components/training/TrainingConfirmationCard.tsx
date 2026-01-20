import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, MapPin, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database } from '@/integrations/supabase/types';

type Event = Database['public']['Tables']['events']['Row'];
type TrainingConfirmation = Database['public']['Tables']['training_confirmations']['Row'];
type ConfirmationStatus = Database['public']['Enums']['confirmation_status'];

interface TrainingConfirmationCardProps {
  event: Event;
  athleteId: string;
  confirmation?: TrainingConfirmation;
  canConfirm: boolean;
  hoursUntilDeadline: number;
  onConfirm: (status: ConfirmationStatus) => void;
  isLoading: boolean;
}

export function TrainingConfirmationCard({
  event,
  confirmation,
  canConfirm,
  hoursUntilDeadline,
  onConfirm,
  isLoading,
}: TrainingConfirmationCardProps) {
  const eventDate = new Date(event.start_datetime);
  const currentStatus = confirmation?.status;

  const getDeadlineText = () => {
    if (!canConfirm) {
      return 'Prazo encerrado';
    }
    if (hoursUntilDeadline < 24) {
      return `${Math.floor(hoursUntilDeadline)}h restantes`;
    }
    const days = Math.floor(hoursUntilDeadline / 24);
    return `${days} dia${days > 1 ? 's' : ''} restante${days > 1 ? 's' : ''}`;
  };

  return (
    <Card className={`transition-all ${
      currentStatus === 'confirmed' 
        ? 'border-success/50 bg-success/5' 
        : currentStatus === 'declined'
        ? 'border-destructive/50 bg-destructive/5'
        : ''
    }`}>
      <CardContent className="p-4 space-y-4">
        {/* Event Info */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold">{event.name}</h3>
            <Badge className="bg-muted text-muted-foreground shrink-0">
              {event.gender === 'male' ? 'Masc' : event.gender === 'female' ? 'Fem' : 'Misto'}
            </Badge>
          </div>
          
          <div className="space-y-1 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {format(eventDate, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {event.location}
            </p>
          </div>
        </div>

        {/* Deadline Warning */}
        {canConfirm && hoursUntilDeadline < 24 && (
          <div className="flex items-center gap-2 text-sm text-warning">
            <AlertTriangle className="h-4 w-4" />
            <span>Prazo se encerra em breve!</span>
          </div>
        )}

        {/* Status Display */}
        {currentStatus && (
          <div className={`flex items-center gap-2 p-2 rounded-lg ${
            currentStatus === 'confirmed'
              ? 'bg-success/10 text-success'
              : 'bg-destructive/10 text-destructive'
          }`}>
            {currentStatus === 'confirmed' ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Presença confirmada</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Ausência registrada</span>
              </>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {canConfirm ? (
            <div className="flex gap-2">
              <Button
                className="flex-1"
                variant={currentStatus === 'confirmed' ? 'default' : 'outline'}
                onClick={() => onConfirm('confirmed')}
                disabled={isLoading}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {currentStatus === 'confirmed' ? 'Confirmado' : 'Confirmar'}
              </Button>
              <Button
                className="flex-1"
                variant={currentStatus === 'declined' ? 'destructive' : 'outline'}
                onClick={() => onConfirm('declined')}
                disabled={isLoading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {currentStatus === 'declined' ? 'Ausente' : 'Não vou'}
              </Button>
            </div>
          ) : (
            <div className="text-center py-2 text-sm text-muted-foreground">
              <Badge variant="secondary">Prazo encerrado</Badge>
            </div>
          )}
          
          {canConfirm && (
            <p className="text-xs text-center text-muted-foreground">
              {getDeadlineText()} para confirmar
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
