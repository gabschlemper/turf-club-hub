import type { FinanceEntry, FinanceSummary } from './financeTypes';

export function isWithinMonth(dateIso: string, year: number, month: number): boolean {
  // month: 1-12
  const [y, m] = dateIso.split('-').map(Number);
  return y === year && m === month;
}

export function filterByMonth(entries: FinanceEntry[], year: number, month: number): FinanceEntry[] {
  return entries.filter((e) => isWithinMonth(e.referenceDate, year, month));
}

export function summarize(entries: FinanceEntry[]): FinanceSummary {
  const income = entries.filter((e) => e.direction === 'income');
  const expense = entries.filter((e) => e.direction === 'expense');

  const totalIncome = income.reduce((s, e) => s + e.amount, 0);
  const totalExpense = expense.reduce((s, e) => s + e.amount, 0);
  const receivedIncome = income.filter((e) => e.paidAt).reduce((s, e) => s + (e.paidAmount ?? e.amount), 0);
  const openIncome = income.filter((e) => !e.paidAt).reduce((s, e) => s + e.amount, 0);
  const paidExpense = expense.filter((e) => e.paidAt).reduce((s, e) => s + (e.paidAmount ?? e.amount), 0);
  const pendingExpense = expense.filter((e) => !e.paidAt).reduce((s, e) => s + e.amount, 0);

  return {
    totalIncome,
    totalExpense,
    balance: receivedIncome - paidExpense, // realized cash balance
    receivedIncome,
    openIncome,
    paidExpense,
    pendingExpense,
  };
}
