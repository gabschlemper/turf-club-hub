import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, MapPin, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type ConfirmationStatus = 'confirmed' | 'declined';

interface TrainingConfirmationCardProps {
  event: any;
  athleteId: string;
  confirmation?: any;
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
    return `${days}d restante${days > 1 ? 's' : ''}`;
  };

  return (
    <Card className={cn(
      "transition-all",
      currentStatus === 'confirmed' && "border-success/50 bg-success/5",
      currentStatus === 'declined' && "border-destructive/50 bg-destructive/5",
      !currentStatus && canConfirm && "border-warning/50 bg-warning/5"
    )}>
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-foreground truncate">
              {event.name}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span>{format(eventDate, "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <Badge 
              variant={canConfirm ? 'outline' : 'secondary'}
              className={cn(
                "text-[10px]",
                canConfirm && hoursUntilDeadline < 24 && "border-warning text-warning"
              )}
            >
              {getDeadlineText()}
            </Badge>
            <Badge className="bg-muted text-muted-foreground text-[10px]">
              {event.gender === 'male' ? 'Masc' : event.gender === 'female' ? 'Fem' : 'Misto'}
            </Badge>
          </div>
        </div>

        {/* Status / Actions */}
        {!canConfirm ? (
          <div className="flex items-center justify-center p-2 rounded-lg bg-muted/50">
            {currentStatus === 'confirmed' ? (
              <div className="flex items-center gap-1.5 text-success text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">Confirmado</span>
              </div>
            ) : currentStatus === 'declined' ? (
              <div className="flex items-center gap-1.5 text-destructive text-sm">
                <XCircle className="h-4 w-4" />
                <span className="font-medium">Ausente</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Não respondido</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant={currentStatus === 'confirmed' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "flex-1 h-9 text-xs",
                currentStatus === 'confirmed' && "bg-success hover:bg-success/90 text-success-foreground"
              )}
              onClick={() => onConfirm('confirmed')}
              disabled={isLoading}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Confirmar
            </Button>
            <Button
              variant={currentStatus === 'declined' ? 'destructive' : 'outline'}
              size="sm"
              className="flex-1 h-9 text-xs"
              onClick={() => onConfirm('declined')}
              disabled={isLoading}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Ausente
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
