import type { DebtWithAthlete } from '@/hooks/useDebts';
import type { Expense } from '@/hooks/useExpenses';
import type { FinanceEntry } from './financeTypes';

export function mapDebtToEntry(d: DebtWithAthlete): FinanceEntry {
  return {
    id: d.id,
    direction: 'income',
    title: d.athletes?.name ?? '—',
    description: d.description,
    amount: Number(d.amount),
    referenceDate: d.due_date,
    paidAt: d.paid_at,
    paidAmount: d.paid_amount != null ? Number(d.paid_amount) : null,
  };
}

export function mapExpenseToEntry(e: Expense): FinanceEntry {
  return {
    id: e.id,
    direction: 'expense',
    title: e.name,
    description: e.description ?? '',
    amount: Number(e.amount),
    referenceDate: e.expense_date,
    paidAt: e.paid_at,
    paidAmount: e.paid_amount != null ? Number(e.paid_amount) : null,
  };
}
