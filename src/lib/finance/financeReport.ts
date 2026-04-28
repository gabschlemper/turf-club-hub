import type { FinanceEntry, FinanceSummary } from './financeTypes';
import { parseLocalDate } from '@/lib/dateUtils';

/**
 * Report exporter contract — implement new formats (PDF, XLSX...) by adding
 * another exporter that fulfills this interface.
 */
export interface FinanceReportExporter {
  readonly format: string;
  readonly mimeType: string;
  readonly extension: string;
  build(input: FinanceReportInput): Blob;
}

export interface FinanceReportInput {
  year: number;
  month: number; // 1-12
  clubName: string;
  entries: FinanceEntry[];
  summary: FinanceSummary;
}

const BRL = (n: number) => n.toFixed(2).replace('.', ',');

const escapeCsv = (value: string): string => {
  if (/[";\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
};

const row = (cells: Array<string | number>): string =>
  cells.map((c) => escapeCsv(String(c))).join(';');

export const csvFinanceExporter: FinanceReportExporter = {
  format: 'csv',
  mimeType: 'text/csv;charset=utf-8;',
  extension: 'csv',
  build({ year, month, clubName, entries, summary }) {
    const monthLabel = String(month).padStart(2, '0');
    const lines: string[] = [];

    lines.push(row(['Relatório Financeiro Mensal']));
    lines.push(row(['Clube', clubName]));
    lines.push(row(['Período', `${monthLabel}/${year}`]));
    lines.push('');

    lines.push(row(['Resumo']));
    lines.push(row(['Total Entradas (lançado)', BRL(summary.totalIncome)]));
    lines.push(row(['Total Entradas (recebido)', BRL(summary.receivedIncome)]));
    lines.push(row(['Total Entradas (em aberto)', BRL(summary.openIncome)]));
    lines.push(row(['Total Saídas (lançado)', BRL(summary.totalExpense)]));
    lines.push(row(['Total Saídas (pago)', BRL(summary.paidExpense)]));
    lines.push(row(['Total Saídas (pendente)', BRL(summary.pendingExpense)]));
    lines.push(row(['Saldo realizado (recebido - pago)', BRL(summary.balance)]));
    lines.push('');

    lines.push(row(['Detalhamento']));
    lines.push(row(['Tipo', 'Título', 'Descrição', 'Valor', 'Data', 'Status', 'Pago em', 'Valor pago']));

    entries
      .slice()
      .sort((a, b) => a.referenceDate.localeCompare(b.referenceDate))
      .forEach((e) => {
        lines.push(
          row([
            e.direction === 'income' ? 'Entrada' : 'Saída',
            e.title,
            e.description,
            BRL(e.amount),
            parseLocalDate(e.referenceDate).toLocaleDateString('pt-BR'),
            e.paidAt ? 'Pago' : 'Pendente',
            e.paidAt ? new Date(e.paidAt).toLocaleDateString('pt-BR') : '',
            e.paidAmount != null ? BRL(e.paidAmount) : '',
          ])
        );
      });

    // BOM ensures Excel opens UTF-8 correctly
    const csv = '\uFEFF' + lines.join('\r\n');
    return new Blob([csv], { type: csvFinanceExporter.mimeType });
  },
};

export function downloadReport(
  exporter: FinanceReportExporter,
  input: FinanceReportInput,
  filenameBase = 'financeiro'
): void {
  const blob = exporter.build(input);
  const monthLabel = String(input.month).padStart(2, '0');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenameBase}_${input.year}-${monthLabel}.${exporter.extension}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
