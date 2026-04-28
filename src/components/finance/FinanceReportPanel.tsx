import { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebts } from '@/hooks/useDebts';
import { useExpenses } from '@/hooks/useExpenses';
import { useAuth } from '@/contexts/AuthContext';
import { mapDebtToEntry, mapExpenseToEntry } from '@/lib/finance/financeMappers';
import { filterByMonth, summarize } from '@/lib/finance/financeSelectors';
import { csvFinanceExporter, downloadReport } from '@/lib/finance/financeReport';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function FinanceReportPanel() {
  const { user } = useAuth();
  const { debts } = useDebts();
  const { expenses } = useExpenses();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12

  const entries = useMemo(() => {
    const all = [...debts.map(mapDebtToEntry), ...expenses.map(mapExpenseToEntry)];
    return filterByMonth(all, year, month);
  }, [debts, expenses, year, month]);

  const summary = useMemo(() => summarize(entries), [entries]);

  const years = useMemo(() => {
    const y = now.getFullYear();
    return [y - 2, y - 1, y, y + 1];
  }, [now]);

  const handleExport = () => {
    downloadReport(
      csvFinanceExporter,
      { year, month, clubName: 'Clube', entries, summary },
      'relatorio_financeiro'
    );
  };

  const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Relatório mensal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-full sm:w-32"><SelectValue /></SelectTrigger>
              <SelectContent>{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={handleExport} className="gap-2 sm:ml-auto" disabled={entries.length === 0}>
              <Download className="w-4 h-4" />Exportar CSV
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><TrendingUp className="w-4 h-4" />Entradas (recebido)</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{fmt(summary.receivedIncome)}</p>
                <p className="text-xs text-muted-foreground mt-1">Lançado: {fmt(summary.totalIncome)}</p>
              </CardContent>
            </Card>
            <Card className="border-rose-500/30 bg-rose-500/5">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><TrendingDown className="w-4 h-4" />Saídas (pago)</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">{fmt(summary.paidExpense)}</p>
                <p className="text-xs text-muted-foreground mt-1">Lançado: {fmt(summary.totalExpense)}</p>
              </CardContent>
            </Card>
            <Card className={summary.balance >= 0 ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Wallet className="w-4 h-4" />Saldo realizado</CardTitle></CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold tabular-nums ${summary.balance >= 0 ? 'text-primary' : 'text-destructive'}`}>{fmt(summary.balance)}</p>
                <p className="text-xs text-muted-foreground mt-1">Recebido − Pago</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            {entries.length} lançamento{entries.length !== 1 ? 's' : ''} no período selecionado.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
