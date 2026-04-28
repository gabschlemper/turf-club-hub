/**
 * Shared finance domain types. Both "Entradas" (debts) and "Saídas" (expenses)
 * are modeled as FinanceEntry so the UI and report layers can stay DRY.
 */
export type FinanceDirection = 'income' | 'expense';

export interface FinanceEntry {
  id: string;
  direction: FinanceDirection;
  title: string;            // athlete name OR expense name
  description: string;      // debt description OR expense description
  amount: number;
  referenceDate: string;    // due_date for income, expense_date for expense (YYYY-MM-DD)
  paidAt: string | null;
  paidAmount: number | null;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  receivedIncome: number;
  openIncome: number;
  paidExpense: number;
  pendingExpense: number;
}
