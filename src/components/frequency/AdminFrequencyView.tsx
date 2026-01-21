import { useState, useMemo } from 'react';
import { Database } from '@/integrations/supabase/types';
import { calculateFrequencyStats, getTierEmoji, CATEGORY_INFO, TIER_INFO, AthleteCategory, FrequencyTier } from '@/lib/frequencyUtils';
import { cn } from '@/lib/utils';
import { Filter, Download, Users, TrendingUp, BarChart3, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Athlete = Database['public']['Tables']['athletes']['Row'];
type Event = Database['public']['Tables']['events']['Row'];
type Attendance = Database['public']['Tables']['attendances']['Row'];

interface AdminFrequencyViewProps {
  athletes: Athlete[];
  events: Event[];
  attendances: Attendance[];
}

type CategoryFilter = 'all' | AthleteCategory;
type GenderFilter = 'all' | 'male' | 'female';
type TierFilter = 'all' | '1' | '2' | '3' | '4' | '5';

export function AdminFrequencyView({ athletes, events, attendances }: AdminFrequencyViewProps) {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');

  // Calculate stats for all athletes
  const athleteStats = useMemo(() => {
    return athletes.map(athlete => ({
      athlete,
      stats: calculateFrequencyStats(athlete, events, attendances),
    }));
  }, [athletes, events, attendances]);

  // Filter athletes
  const filteredStats = useMemo(() => {
    return athleteStats.filter(({ athlete, stats }) => {
      if (categoryFilter !== 'all' && stats.category !== categoryFilter) return false;
      if (genderFilter !== 'all' && athlete.gender !== genderFilter) return false;
      if (tierFilter !== 'all' && stats.tier.tier.toString() !== tierFilter) return false;
      return true;
    }).sort((a, b) => b.stats.frequency - a.stats.frequency);
  }, [athleteStats, categoryFilter, genderFilter, tierFilter]);

  // Calculate tier distribution (always show total, not filtered)
  const tierDistribution = useMemo(() => {
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    athleteStats.forEach(({ stats }) => {
      distribution[stats.tier.tier]++;
    });
    return distribution;
  }, [athleteStats]);

  // Calculate total events realized this year
  const eventsRealized = useMemo(() => {
    const now = new Date();
    
    const mainEvents = events.filter(e => {
      if (e.event_type !== 'training' || e.training_type !== 'principal') return false;
      const eventDate = new Date(e.start_datetime);
      return eventDate <= now;
    }).length;

    const extraEvents = events.filter(e => {
      if (e.event_type !== 'training' || e.training_type !== 'extra') return false;
      const eventDate = new Date(e.start_datetime);
      return eventDate <= now;
    }).length;

    return { main: mainEvents, extra: extraEvents, total: mainEvents + extraEvents };
  }, [events]);

  const genderLabels: Record<string, string> = {
    male: 'Masculino',
    female: 'Feminino',
  };

  return (
    <div className="space-y-6">
      {/* Events Progress Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Treinos Realizados em 2026</p>
              <p className="text-xs text-muted-foreground">
                A meta de frequência é baseada nos treinos já realizados
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{eventsRealized.main}</p>
              <p className="text-xs text-muted-foreground">Principais</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary/70">{eventsRealized.extra}</p>
              <p className="text-xs text-muted-foreground">Extras</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{eventsRealized.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-muted-foreground">{52 - eventsRealized.main}</p>
              <p className="text-xs text-muted-foreground">Restantes</p>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 w-full h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(eventsRealized.main / 52) * 100}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {((eventsRealized.main / 52) * 100).toFixed(1)}% do ano completado • Meta anual: 52 treinos
        </p>
      </div>

      {/* Tier Distribution Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {TIER_INFO.map(tier => (
          <div 
            key={tier.tier}
            className={cn(
              "p-3 sm:p-4 rounded-xl border-2 transition-all cursor-pointer",
              tier.bgColor,
              tierFilter === tier.tier.toString() ? `border-${tier.color.replace('bg-', '')} ring-2 ring-offset-2` : 'border-transparent',
              "hover:scale-105"
            )}
            onClick={() => setTierFilter(tierFilter === tier.tier.toString() ? 'all' : tier.tier.toString() as TierFilter)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={cn("text-2xl font-bold", tier.textColor)}>{tierDistribution[tier.tier]}</span>
            </div>
            <p className="text-xs font-medium text-foreground truncate">Faixa {tier.tier}</p>
            <p className="text-xs text-muted-foreground truncate hidden sm:block">{tier.status}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filtros:</span>
        </div>
        
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Categorias</SelectItem>
            {Object.values(CATEGORY_INFO).map(cat => (
              <SelectItem key={cat.code} value={cat.code}>
                {cat.code} - {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={genderFilter} onValueChange={(v) => setGenderFilter(v as GenderFilter)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Naipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Naipes</SelectItem>
            <SelectItem value="male">Masculino</SelectItem>
            <SelectItem value="female">Feminino</SelectItem>
          </SelectContent>
        </Select>

        {tierFilter !== 'all' && (
          <Button variant="ghost" size="sm" onClick={() => setTierFilter('all')}>
            Limpar Faixa
          </Button>
        )}

        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          {filteredStats.length} atletas
        </div>
      </div>

      {/* Athletes Table */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 sm:p-4 font-medium text-xs sm:text-sm text-muted-foreground">Atleta</th>
                <th className="text-center p-3 sm:p-4 font-medium text-xs sm:text-sm text-muted-foreground">Cat</th>
                <th className="text-center p-3 sm:p-4 font-medium text-xs sm:text-sm text-muted-foreground hidden sm:table-cell">Naipe</th>
                <th className="text-center p-3 sm:p-4 font-medium text-xs sm:text-sm text-muted-foreground hidden md:table-cell">Meta</th>
                <th className="text-center p-3 sm:p-4 font-medium text-xs sm:text-sm text-muted-foreground">Pontos</th>
                <th className="text-center p-3 sm:p-4 font-medium text-xs sm:text-sm text-muted-foreground">%</th>
                <th className="text-center p-3 sm:p-4 font-medium text-xs sm:text-sm text-muted-foreground">Faixa</th>
                <th className="text-left p-3 sm:p-4 font-medium text-xs sm:text-sm text-muted-foreground hidden lg:table-cell">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStats.map(({ athlete, stats }) => (
                <tr key={athlete.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-medium text-sm">
                          {athlete.name.charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium text-sm text-foreground truncate max-w-[120px] sm:max-w-none">
                        {athlete.name}
                      </span>
                    </div>
                  </td>
                  <td className="text-center p-3 sm:p-4">
                    <span className="text-xs font-medium text-muted-foreground" title={stats.categoryInfo.name}>
                      {stats.categoryInfo.code}
                    </span>
                  </td>
                  <td className="text-center p-3 sm:p-4 hidden sm:table-cell">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                      athlete.gender === 'male' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400"
                    )}>
                      {athlete.gender === 'male' ? 'M' : 'F'}
                    </span>
                  </td>
                  <td className="text-center p-3 sm:p-4 text-sm text-muted-foreground hidden md:table-cell">
                    {stats.adjustedGoal}
                    {stats.adjustedGoal !== stats.annualGoal && (
                      <span className="text-xs text-warning ml-1">*</span>
                    )}
                  </td>
                  <td className="text-center p-3 sm:p-4">
                    <span className="font-medium text-sm text-foreground">
                      {stats.totalPoints.toFixed(1)}
                    </span>
                  </td>
                  <td className="text-center p-3 sm:p-4">
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs sm:text-sm font-medium",
                      stats.tier.bgColor,
                      stats.tier.textColor
                    )}>
                      {stats.frequency.toFixed(0)}%
                    </span>
                  </td>
                  <td className="text-center p-3 sm:p-4">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
                      stats.tier.bgColor,
                      stats.tier.textColor
                    )}>
                      {stats.tier.tier}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 hidden lg:table-cell">
                    <span className="text-xs text-muted-foreground">
                      {stats.tier.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredStats.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum atleta encontrado com os filtros selecionados.
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-4 rounded-xl bg-muted/50 text-sm text-muted-foreground">
        <p><strong>Legenda:</strong></p>
        <ul className="mt-2 space-y-1">
          <li>• <strong>Meta:</strong> Baseada nos {eventsRealized.main} treinos principais já realizados no ano</li>
          <li>• <strong>Pontos:</strong> (Principais × 1.0) + (Extras × 0.25)</li>
          <li>• <strong>%:</strong> (Pontos ÷ Meta) × 100 - pode ultrapassar 100% com treinos extras</li>
          <li>• <strong>*</strong> Meta ajustada por data de entrada ou faltas justificadas</li>
        </ul>
      </div>
    </div>
  );
}
