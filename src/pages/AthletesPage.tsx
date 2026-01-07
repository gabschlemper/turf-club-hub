import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockAthletes, mockDebts, mockAttendances } from '@/data/mockData';
import { Plus, Search, Mail, MoreVertical } from 'lucide-react';

export function AthletesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAthletes = mockAthletes.filter(athlete =>
    athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    athlete.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAthleteStats = (athleteId: string) => {
    const debts = mockDebts.filter(d => d.athleteId === athleteId);
    const pendingAmount = debts
      .filter(d => d.status !== 'paid')
      .reduce((sum, d) => sum + d.amount, 0);
    
    const attendances = mockAttendances.filter(a => a.athleteId === athleteId);
    const presenceRate = attendances.length > 0
      ? Math.round((attendances.filter(a => a.status === 'present').length / attendances.length) * 100)
      : 0;

    return { pendingAmount, presenceRate };
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Atletas"
        description="Gerencie os atletas do clube"
        action={
          <Button variant="gradient">
            <Plus className="w-4 h-4" />
            Novo Atleta
          </Button>
        }
      />

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Buscar atleta por nome ou e-mail..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12"
        />
      </div>

      {/* Athletes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAthletes.map(athlete => {
          const stats = getAthleteStats(athlete.id);
          
          return (
            <div 
              key={athlete.id}
              className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold text-lg">
                      {athlete.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{athlete.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{athlete.email}</span>
                    </div>
                  </div>
                </div>
                <button className="p-1 hover:bg-muted rounded">
                  <MoreVertical className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Presença</p>
                  <p className="text-lg font-semibold text-foreground">{stats.presenceRate}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Pendências</p>
                  <p className={`text-lg font-semibold ${stats.pendingAmount > 0 ? 'text-warning' : 'text-success'}`}>
                    R$ {stats.pendingAmount.toFixed(0)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAthletes.length === 0 && (
        <div className="p-12 rounded-xl bg-card border border-border text-center">
          <p className="text-muted-foreground">Nenhum atleta encontrado</p>
        </div>
      )}
    </div>
  );
}
