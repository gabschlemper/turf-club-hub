export type UserRole = 'admin' | 'athlete';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Event {
  id: string;
  title: string;
  type: 'training' | 'game' | 'meeting';
  date: Date;
  time: string;
  location: string;
  description?: string;
}

export interface Attendance {
  id: string;
  eventId: string;
  athleteId: string;
  status: 'present' | 'absent' | 'justified';
}

export interface Debt {
  id: string;
  athleteId: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: 'paid' | 'pending' | 'overdue';
}

export interface FinancialEntry {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: Date;
  category: string;
}
