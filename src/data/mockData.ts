import { Event, Attendance, Debt, FinancialEntry, User } from '@/types';

export const mockAthletes: User[] = [
  { id: '2', name: 'João Santos', email: 'joao@hockeyclub.com', role: 'athlete' },
  { id: '3', name: 'Pedro Oliveira', email: 'pedro@hockeyclub.com', role: 'athlete' },
  { id: '4', name: 'Lucas Ferreira', email: 'lucas@hockeyclub.com', role: 'athlete' },
  { id: '5', name: 'Gabriel Costa', email: 'gabriel@hockeyclub.com', role: 'athlete' },
  { id: '6', name: 'Matheus Lima', email: 'matheus@hockeyclub.com', role: 'athlete' },
  { id: '7', name: 'Rafael Souza', email: 'rafael@hockeyclub.com', role: 'athlete' },
  { id: '8', name: 'Bruno Almeida', email: 'bruno@hockeyclub.com', role: 'athlete' },
];

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Treino Técnico',
    type: 'training',
    date: new Date(2026, 0, 8),
    time: '19:00',
    location: 'Quadra Principal',
    description: 'Foco em passes e domínio de bola',
  },
  {
    id: '2',
    title: 'Jogo Amistoso vs Panthers',
    type: 'game',
    date: new Date(2026, 0, 12),
    time: '15:00',
    location: 'Ginásio Municipal',
    description: 'Preparação para o campeonato',
  },
  {
    id: '3',
    title: 'Reunião de Planejamento',
    type: 'meeting',
    date: new Date(2026, 0, 10),
    time: '20:00',
    location: 'Sala de Reuniões',
    description: 'Planejamento do semestre',
  },
  {
    id: '4',
    title: 'Treino Físico',
    type: 'training',
    date: new Date(2026, 0, 15),
    time: '18:30',
    location: 'Academia do Clube',
    description: 'Fortalecimento muscular',
  },
  {
    id: '5',
    title: 'Campeonato Regional - 1ª Rodada',
    type: 'game',
    date: new Date(2026, 0, 20),
    time: '14:00',
    location: 'Estádio Regional',
    description: 'Primeira partida do campeonato',
  },
];

export const mockAttendances: Attendance[] = [
  { id: '1', eventId: '1', athleteId: '2', status: 'present' },
  { id: '2', eventId: '1', athleteId: '3', status: 'present' },
  { id: '3', eventId: '1', athleteId: '4', status: 'absent' },
  { id: '4', eventId: '1', athleteId: '5', status: 'justified' },
  { id: '5', eventId: '2', athleteId: '2', status: 'present' },
  { id: '6', eventId: '2', athleteId: '3', status: 'present' },
  { id: '7', eventId: '3', athleteId: '2', status: 'present' },
];

export const mockDebts: Debt[] = [
  {
    id: '1',
    athleteId: '2',
    description: 'Mensalidade Janeiro/2026',
    amount: 150.0,
    dueDate: new Date(2026, 0, 10),
    status: 'pending',
  },
  {
    id: '2',
    athleteId: '2',
    description: 'Uniforme Novo',
    amount: 250.0,
    dueDate: new Date(2026, 0, 15),
    status: 'paid',
  },
  {
    id: '3',
    athleteId: '3',
    description: 'Mensalidade Janeiro/2026',
    amount: 150.0,
    dueDate: new Date(2026, 0, 10),
    status: 'overdue',
  },
  {
    id: '4',
    athleteId: '4',
    description: 'Mensalidade Janeiro/2026',
    amount: 150.0,
    dueDate: new Date(2026, 0, 10),
    status: 'pending',
  },
];

export const mockFinancials: FinancialEntry[] = [
  { id: '1', type: 'income', description: 'Mensalidades Dezembro', amount: 3000, date: new Date(2025, 11, 15), category: 'Mensalidades' },
  { id: '2', type: 'income', description: 'Patrocínio XYZ Sports', amount: 5000, date: new Date(2025, 11, 20), category: 'Patrocínio' },
  { id: '3', type: 'expense', description: 'Aluguel do Ginásio', amount: 1500, date: new Date(2025, 11, 5), category: 'Infraestrutura' },
  { id: '4', type: 'expense', description: 'Equipamentos', amount: 800, date: new Date(2025, 11, 10), category: 'Material' },
  { id: '5', type: 'expense', description: 'Transporte - Jogo Fora', amount: 600, date: new Date(2025, 11, 18), category: 'Transporte' },
  { id: '6', type: 'income', description: 'Venda de Uniformes', amount: 1200, date: new Date(2025, 11, 22), category: 'Vendas' },
  { id: '7', type: 'income', description: 'Mensalidades Janeiro', amount: 2850, date: new Date(2026, 0, 5), category: 'Mensalidades' },
  { id: '8', type: 'expense', description: 'Manutenção Equipamentos', amount: 400, date: new Date(2026, 0, 3), category: 'Material' },
];
