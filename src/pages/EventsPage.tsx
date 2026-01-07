import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { EventCard } from '@/components/cards/EventCard';
import { Button } from '@/components/ui/button';
import { mockEvents } from '@/data/mockData';
import { Plus, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

type EventFilter = 'all' | 'training' | 'game' | 'meeting';

export function EventsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [filter, setFilter] = useState<EventFilter>('all');

  const filteredEvents = mockEvents.filter(event => 
    filter === 'all' || event.type === filter
  );

  const filterOptions: { value: EventFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'training', label: 'Treinos' },
    { value: 'game', label: 'Jogos' },
    { value: 'meeting', label: 'Reuniões' },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Eventos"
        description="Calendário de treinos, jogos e reuniões"
        action={isAdmin && (
          <Button variant="gradient">
            <Plus className="w-4 h-4" />
            Novo Evento
          </Button>
        )}
      />

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        {filterOptions.map(option => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              filter === option.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEvents.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="p-12 rounded-xl bg-card border border-border text-center">
          <p className="text-muted-foreground">Nenhum evento encontrado</p>
        </div>
      )}
    </div>
  );
}
