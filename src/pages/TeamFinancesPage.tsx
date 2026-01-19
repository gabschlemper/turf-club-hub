import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/cards/StatCard';
import { Button } from '@/components/ui/button';
import { mockFinancials } from '@/data/mockData';
import { TrendingUp, TrendingDown, DollarSign, Upload, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export function TeamFinancesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const totalIncome = mockFinancials
    .filter(f => f.type === 'income')
    .reduce((sum, f) => sum + f.amount, 0);

  const totalExpense = mockFinancials
    .filter(f => f.type === 'expense')
    .reduce((sum, f) => sum + f.amount, 0);

  const balance = totalIncome - totalExpense;

  // Group by category for pie chart
  const incomeByCategory = mockFinancials
    .filter(f => f.type === 'income')
    .reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + f.amount;
      return acc;
    }, {} as Record<string, number>);

  const expenseByCategory = mockFinancials
    .filter(f => f.type === 'expense')
    .reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + f.amount;
      return acc;
    }, {} as Record<string, number>);

  const incomeChartData = Object.entries(incomeByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  const expenseChartData = Object.entries(expenseByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['hsl(24, 95%, 53%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(217, 91%, 60%)'];

  const monthlyData = [
    { month: 'Out', receitas: 8500, despesas: 3200 },
    { month: 'Nov', receitas: 9200, despesas: 2900 },
    { month: 'Dez', receitas: 9200, despesas: 2900 },
    { month: 'Jan', receitas: totalIncome, despesas: totalExpense },
  ];

  const recentTransactions = [...mockFinancials]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Finanças do Time"
        description={isAdmin ? "Visão completa das finanças do clube" : "Saúde financeira do clube"}
        action={isAdmin && (
          <Button variant="gradient" size="sm" className="w-full sm:w-auto">
            <Upload className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Importar Planilha</span>
            <span className="sm:hidden">Importar</span>
          </Button>
        )}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard
          title="Receitas"
          value={`R$ ${totalIncome.toLocaleString('pt-BR')}`}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Despesas"
          value={`R$ ${totalExpense.toLocaleString('pt-BR')}`}
          icon={TrendingDown}
          variant="destructive"
        />
        <StatCard
          title="Saldo"
          value={`R$ ${balance.toLocaleString('pt-BR')}`}
          icon={DollarSign}
          variant={balance >= 0 ? 'primary' : 'destructive'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Monthly Evolution */}
        <div className="p-4 sm:p-6 rounded-xl bg-card border border-border">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Evolução Mensal</h3>
          <ResponsiveContainer width="100%" height={200} className="sm:h-[250px]">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="receitas" name="Receitas" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" name="Despesas" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribution */}
        <div className="p-4 sm:p-6 rounded-xl bg-card border border-border">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Distribuição por Categoria</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-muted-foreground text-center mb-2">Receitas</p>
              <ResponsiveContainer width="100%" height={150} className="sm:h-[180px]">
                <PieChart>
                  <Pie
                    data={incomeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {incomeChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-muted-foreground text-center mb-2">Despesas</p>
              <ResponsiveContainer width="100%" height={150} className="sm:h-[180px]">
                <PieChart>
                  <Pie
                    data={expenseChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {expenseChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {[...new Set([...Object.keys(incomeByCategory), ...Object.keys(expenseByCategory)])].map((cat, i) => (
              <div key={cat} className="flex items-center gap-1.5 text-xs">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[i % COLORS.length] }} 
                />
                <span className="text-muted-foreground">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions (Admin only) */}
      {isAdmin && (
        <div className="p-4 sm:p-6 rounded-xl bg-card border border-border">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Últimas Transações</h3>
          <div className="space-y-2 sm:space-y-3">
            {recentTransactions.map(transaction => (
              <div 
                key={transaction.id}
                className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                    transaction.type === 'income' 
                      ? "bg-success/10 text-success" 
                      : "bg-destructive/10 text-destructive"
                  )}>
                    {transaction.type === 'income' ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm sm:text-base text-foreground truncate">{transaction.description}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {format(transaction.date, "dd/MM/yyyy", { locale: ptBR })} • {transaction.category}
                    </p>
                  </div>
                </div>
                <span className={cn(
                  "font-semibold text-sm sm:text-base flex-shrink-0 ml-2",
                  transaction.type === 'income' ? "text-success" : "text-destructive"
                )}>
                  {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
