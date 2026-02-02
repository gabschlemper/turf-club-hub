import { useState, useMemo } from 'react';
import { calculateFrequencyStats, getTierEmoji, CATEGORY_INFO, TIER_INFO, AthleteCategory, FrequencyTier } from '@/lib/frequencyUtils';
import { cn } from '@/lib/utils';
import { Filter, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AdminFrequencyViewProps {
  athletes: any[];
  events: any[];
  attendances: any[];
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

  const clearFilters = () => {
    setCategoryFilter('all');
    setGenderFilter('all');
    setTierFilter('all');
  };

  const hasActiveFilters = categoryFilter !== 'all' || genderFilter !== 'all' || tierFilter !== 'all';

  return (
    <div className="space-y-4">
      {/* Events Progress Banner - Mobile optimized */}
      <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-foreground">Treinos Realizados</p>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-center">
              <p className="text-lg sm:text-2xl font-bold text-primary">{eventsRealized.main}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Principais</p>
            </div>
            <div className="text-center">
              <p className="text-lg sm:text-2xl font-bold text-primary/70">{eventsRealized.extra}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Extras</p>
            </div>
            <div className="text-center">
              <p className="text-lg sm:text-2xl font-bold text-muted-foreground">{52 - eventsRealized.main}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Restantes</p>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-2 w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(eventsRealized.main / 52) * 100}%` }}
          />
        </div>
      </div>

      {/* Tier Distribution - Mobile grid */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
        {TIER_INFO.map(tier => (
          <button 
            key={tier.tier}
            className={cn(
              "p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all",
              tier.bgColor,
              tierFilter === tier.tier.toString() 
                ? 'border-current ring-1 ring-current' 
                : 'border-transparent',
              "hover:scale-[1.02] active:scale-[0.98]"
            )}
            onClick={() => setTierFilter(tierFilter === tier.tier.toString() ? 'all' : tier.tier.toString() as TierFilter)}
          >
            <p className={cn("text-lg sm:text-2xl font-bold text-center", tier.textColor)}>
              {tierDistribution[tier.tier]}
            </p>
            <p className="text-[10px] sm:text-xs font-medium text-center text-foreground">F{tier.tier}</p>
          </button>
        ))}
      </div>

      {/* Filters - Mobile optimized */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-3 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2 pb-2 sm:pb-0 border-b sm:border-b-0 border-border">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">Filtros</span>
        </div>
        
        <div className="flex flex-1 gap-2 flex-wrap">
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}>
            <SelectTrigger className="w-full sm:w-[140px] h-9 text-xs">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Cat.</SelectItem>
              {Object.values(CATEGORY_INFO).map(cat => (
                <SelectItem key={cat.code} value={cat.code}>
                  {cat.code} - {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={genderFilter} onValueChange={(v) => setGenderFilter(v as GenderFilter)}>
            <SelectTrigger className="w-full sm:w-[120px] h-9 text-xs">
              <SelectValue placeholder="Naipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Naipes</SelectItem>
              <SelectItem value="male">Masculino</SelectItem>
              <SelectItem value="female">Feminino</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-xs">
              Limpar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
          <Users className="w-3 h-3" />
          <span>{filteredStats.length}</span>
        </div>
      </div>

      {/* Athletes List - Mobile cards instead of table */}
      <div className="space-y-2">
        {filteredStats.map(({ athlete, stats }) => (
          <div 
            key={athlete.id} 
            className="flex items-center justify-between p-3 rounded-xl bg-card border border-border hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-medium text-sm">
                  {athlete.name.charAt(0)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-foreground truncate">
                  {athlete.name}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className={cn(
                    "px-1 py-0.5 rounded",
                    athlete.gender === 'male' 
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
                      : "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400"
                  )}>
                    {athlete.gender === 'male' ? 'M' : 'F'}
                  </span>
                  <span>{stats.categoryInfo.code}</span>
                  <span>•</span>
                  <span>{stats.totalPoints.toFixed(1)}pts</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className={cn(
                "px-2 py-1 rounded-lg text-xs font-medium",
                stats.tier.bgColor,
                stats.tier.textColor
              )}>
                {stats.attendanceRate}%
              </div>
              <div className={cn(
                "w-6 h-6 rounded flex items-center justify-center text-xs font-bold",
                stats.tier.bgColor,
                stats.tier.textColor
              )}>
                {stats.tier.tier}
              </div>
            </div>
          </div>
        ))}
        
        {filteredStats.length === 0 && (
          <div className="p-8 text-center text-muted-foreground rounded-xl bg-card border border-border">
            Nenhum atleta encontrado.
          </div>
        )}
      </div>

      {/* Legend - Compact mobile version */}
      <div className="p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground">
        <p className="font-medium mb-1">Legenda:</p>
        <p>• Pontos = (Principais × 1.0) + (Extras × 0.25)</p>
        <p>• % = Taxa de presença nos treinos principais</p>
      </div>
    </div>
  );
}
