import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/cards/StatCard';
import { EventCard } from '@/components/cards/EventCard';
import { DebtCard } from '@/components/cards/DebtCard';
import { mockEvents, mockDebts, mockAttendances, mockAthletes } from '@/data/mockData';
import { Calendar, Users, DollarSign, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const upcomingEvents = mockEvents
    .filter(e => e.date >= new Date())
    .slice(0, 3);

  const userDebts = isAdmin 
    ? mockDebts 
    : mockDebts.filter(d => d.athleteId === user?.id);

  const pendingDebts = userDebts.filter(d => d.status !== 'paid');
  const totalPending = pendingDebts.reduce((sum, d) => sum + d.amount, 0);

  const attendanceRate = isAdmin
    ? Math.round((mockAttendances.filter(a => a.status === 'present').length / mockAttendances.length) * 100)
    : Math.round((mockAttendances.filter(a => a.athleteId === user?.id && a.status === 'present').length / 
        mockAttendances.filter(a => a.athleteId === user?.id).length) * 100) || 0;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Olá, ${user?.name.split(' ')[0]}!`}
        description={isAdmin 
          ? 'Aqui está o resumo do seu clube' 
          : 'Aqui está o resumo das suas atividades'}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Próximos Eventos"
          value={upcomingEvents.length}
          subtitle="nos próximos dias"
          icon={Calendar}
          variant="primary"
        />
        
        {isAdmin ? (
          <StatCard
            title="Atletas Ativos"
            value={mockAthletes.length}
            subtitle="cadastrados"
            icon={Users}
          />
        ) : (
          <StatCard
            title="Taxa de Presença"
            value={`${attendanceRate}%`}
            subtitle="este mês"
            icon={CheckCircle}
            variant="success"
          />
        )}

        <StatCard
          title={isAdmin ? "Dívidas Pendentes" : "Pendências"}
          value={`R$ ${totalPending.toFixed(0)}`}
          subtitle={`${pendingDebts.length} ${pendingDebts.length === 1 ? 'item' : 'itens'} em aberto`}
          icon={DollarSign}
          variant={pendingDebts.length > 0 ? 'warning' : 'success'}
        />

        {isAdmin ? (
          <StatCard
            title="Taxa de Presença"
            value={`${attendanceRate}%`}
            subtitle="média do time"
            icon={TrendingUp}
            trend={{ value: 5, positive: true }}
          />
        ) : (
          <StatCard
            title="Eventos Participados"
            value={mockAttendances.filter(a => a.athleteId === user?.id && a.status === 'present').length}
            subtitle="total"
            icon={Calendar}
          />
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Events */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Próximos Eventos</h2>
          <div className="space-y-3">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map(event => (
                <EventCard key={event.id} event={event} compact />
              ))
            ) : (
              <div className="p-8 rounded-xl bg-card border border-border text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum evento agendado</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Debts */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {isAdmin ? 'Dívidas Recentes' : 'Suas Pendências'}
          </h2>
          <div className="space-y-3">
            {pendingDebts.length > 0 ? (
              pendingDebts.slice(0, 3).map(debt => (
                <DebtCard key={debt.id} debt={debt} />
              ))
            ) : (
              <div className="p-8 rounded-xl bg-card border border-border text-center">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhuma pendência!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
