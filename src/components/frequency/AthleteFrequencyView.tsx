import { useMemo } from 'react';
import { Database } from '@/integrations/supabase/types';
import { calculateFrequencyStats, getTierEmoji, getMotivationalMessage, CATEGORY_INFO } from '@/lib/frequencyUtils';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Target, Award, Calendar, Zap } from 'lucide-react';

type Athlete = Database['public']['Tables']['athletes']['Row'];
type Event = Database['public']['Tables']['events']['Row'];
type Attendance = Database['public']['Tables']['attendances']['Row'];

interface AthleteFrequencyViewProps {
  athlete: Athlete;
  events: Event[];
  attendances: Attendance[];
}

export function AthleteFrequencyView({ athlete, events, attendances }: AthleteFrequencyViewProps) {
  const stats = useMemo(() => 
    calculateFrequencyStats(athlete, events, attendances),
    [athlete, events, attendances]
  );

  const categoryInfo = stats.categoryInfo;
  const tier = stats.tier;
  
  return (
    <div className="space-y-6">
      {/* Category Card */}
      <div className="p-4 sm:p-6 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{categoryInfo.icon}</span>
          <div>
            <h3 className="font-semibold text-lg text-foreground">Categoria: {categoryInfo.name}</h3>
            <p className="text-sm text-muted-foreground">{categoryInfo.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <Target className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Sua Meta: {stats.annualGoal} pontos/ano</p>
            <p className="text-xs text-muted-foreground">{categoryInfo.goalDescription}</p>
          </div>
        </div>
      </div>

      {/* Points Breakdown */}
      <div className="p-4 sm:p-6 rounded-xl bg-card border border-border">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Seus Pontos
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Treinos Principais</p>
                <p className="text-xs text-muted-foreground">Domingos × 1.0 ponto</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">{stats.principalPoints.toFixed(1)} pts</p>
              <p className="text-xs text-muted-foreground">{stats.principalAttended} presenças</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-secondary-foreground" />
              <div>
                <p className="font-medium text-foreground">Treinos Extras</p>
                <p className="text-xs text-muted-foreground">Semana × 0.25 ponto (bônus)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-secondary-foreground">{stats.extraPoints.toFixed(2)} pts</p>
              <p className="text-xs text-muted-foreground">{stats.extraAttended} presenças</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30">
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-primary" />
              <p className="font-bold text-lg text-foreground">TOTAL DE PONTOS</p>
            </div>
            <p className="text-2xl font-bold text-primary">{stats.totalPoints.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Frequency Card */}
      <div className="p-4 sm:p-6 rounded-xl bg-card border border-border">
        <h3 className="font-semibold text-foreground mb-4">Frequência</h3>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-3xl font-bold text-foreground">{stats.frequency.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">
              {stats.totalPoints.toFixed(2)} ÷ {stats.adjustedGoal} × 100
            </p>
          </div>
          <div className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center",
            tier.bgColor
          )}>
            {stats.frequency >= 75 ? (
              <TrendingUp className={cn("w-7 h-7", tier.textColor)} />
            ) : stats.frequency >= 50 ? (
              <Minus className={cn("w-7 h-7", tier.textColor)} />
            ) : (
              <TrendingDown className={cn("w-7 h-7", tier.textColor)} />
            )}
          </div>
        </div>

        <Progress 
          value={Math.min(100, stats.frequency)} 
          className={cn("h-4 mb-4", `[&>div]:${tier.color}`)}
        />

        {stats.adjustedGoal !== stats.annualGoal && (
          <p className="text-xs text-muted-foreground mb-4">
            * Meta ajustada de {stats.annualGoal} para {stats.adjustedGoal} devido a {stats.principalJustified} falta(s) justificada(s)
          </p>
        )}
      </div>

      {/* Status Card */}
      <div className={cn("p-4 sm:p-6 rounded-xl border-2", tier.bgColor, `border-${tier.color.replace('bg-', '')}`)}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{getTierEmoji(tier.tier)}</span>
          <div>
            <p className="font-bold text-lg text-foreground">Faixa {tier.tier} - {tier.status}</p>
            <p className="text-sm text-muted-foreground">{tier.description}</p>
          </div>
        </div>
        <p className="text-sm text-foreground mt-3 p-3 rounded-lg bg-background/50">
          {getMotivationalMessage(tier.tier)}
        </p>
      </div>

      {/* Details */}
      <div className="p-4 sm:p-6 rounded-xl bg-card border border-border">
        <h3 className="font-semibold text-foreground mb-4">Detalhes</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm text-muted-foreground">Treinos Principais Disponíveis</span>
            <span className="font-medium text-foreground">{stats.principalAvailable}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-success/10">
            <span className="text-sm text-success">Presenças (Principais)</span>
            <span className="font-medium text-success">{stats.principalAttended}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10">
            <span className="text-sm text-destructive">Faltas (Principais)</span>
            <span className="font-medium text-destructive">{stats.principalMissed}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10">
            <span className="text-sm text-warning">Justificadas (Principais)</span>
            <span className="font-medium text-warning">{stats.principalJustified}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm text-muted-foreground">Treinos Extras Disponíveis</span>
            <span className="font-medium text-foreground">{stats.extraAvailable}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <span className="text-sm text-secondary-foreground">Presenças (Extras)</span>
            <span className="font-medium text-secondary-foreground">{stats.extraAttended}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
