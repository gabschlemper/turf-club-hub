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

// Treinos passados (já realizados)
export const mockEvents: Event[] = [
  // Treinos passados
  { id: 't1', title: 'Treino - 02/02', type: 'training', date: new Date(2025, 1, 2), time: '09:00', location: 'Quadra Principal' },
  { id: 't2', title: 'Treino - 09/02', type: 'training', date: new Date(2025, 1, 9), time: '09:00', location: 'Quadra Principal' },
  { id: 't3', title: 'Treino - 16/02', type: 'training', date: new Date(2025, 1, 16), time: '09:00', location: 'Quadra Principal' },
  { id: 't4', title: 'Treino - 23/02', type: 'training', date: new Date(2025, 1, 23), time: '09:00', location: 'Quadra Principal' },
  { id: 't5', title: 'Treino - 09/03', type: 'training', date: new Date(2025, 2, 9), time: '09:00', location: 'Quadra Principal' },
  { id: 't6', title: 'Treino - 16/03', type: 'training', date: new Date(2025, 2, 16), time: '09:00', location: 'Quadra Principal' },
  { id: 't7', title: 'Treino - 23/03', type: 'training', date: new Date(2025, 2, 23), time: '09:00', location: 'Quadra Principal' },
  { id: 't8', title: 'Treino - 30/03', type: 'training', date: new Date(2025, 2, 30), time: '09:00', location: 'Quadra Principal' },
  // Eventos futuros
  { id: '1', title: 'Treino Técnico', type: 'training', date: new Date(2026, 0, 8), time: '19:00', location: 'Quadra Principal', description: 'Foco em passes e domínio de bola' },
  { id: '2', title: 'Jogo Amistoso vs Panthers', type: 'game', date: new Date(2026, 0, 12), time: '15:00', location: 'Ginásio Municipal', description: 'Preparação para o campeonato' },
  { id: '3', title: 'Reunião de Planejamento', type: 'meeting', date: new Date(2026, 0, 10), time: '20:00', location: 'Sala de Reuniões', description: 'Planejamento do semestre' },
];

// Presenças - P = present, F = absent, FJ = justified
export const mockAttendances: Attendance[] = [
  // João Santos (id: 2) - 7P, 1FJ = 87.5%
  { id: 'a1', eventId: 't1', athleteId: '2', status: 'present' },
  { id: 'a2', eventId: 't2', athleteId: '2', status: 'present' },
  { id: 'a3', eventId: 't3', athleteId: '2', status: 'present' },
  { id: 'a4', eventId: 't4', athleteId: '2', status: 'present' },
  { id: 'a5', eventId: 't5', athleteId: '2', status: 'present' },
  { id: 'a6', eventId: 't6', athleteId: '2', status: 'justified' },
  { id: 'a7', eventId: 't7', athleteId: '2', status: 'present' },
  { id: 'a8', eventId: 't8', athleteId: '2', status: 'present' },
  
  // Pedro Oliveira (id: 3) - 5P, 2F, 1FJ = 62.5%
  { id: 'a9', eventId: 't1', athleteId: '3', status: 'present' },
  { id: 'a10', eventId: 't2', athleteId: '3', status: 'absent' },
  { id: 'a11', eventId: 't3', athleteId: '3', status: 'present' },
  { id: 'a12', eventId: 't4', athleteId: '3', status: 'present' },
  { id: 'a13', eventId: 't5', athleteId: '3', status: 'present' },
  { id: 'a14', eventId: 't6', athleteId: '3', status: 'absent' },
  { id: 'a15', eventId: 't7', athleteId: '3', status: 'justified' },
  { id: 'a16', eventId: 't8', athleteId: '3', status: 'present' },
  
  // Lucas Ferreira (id: 4) - 6P, 2F = 75%
  { id: 'a17', eventId: 't1', athleteId: '4', status: 'present' },
  { id: 'a18', eventId: 't2', athleteId: '4', status: 'present' },
  { id: 'a19', eventId: 't3', athleteId: '4', status: 'absent' },
  { id: 'a20', eventId: 't4', athleteId: '4', status: 'present' },
  { id: 'a21', eventId: 't5', athleteId: '4', status: 'present' },
  { id: 'a22', eventId: 't6', athleteId: '4', status: 'absent' },
  { id: 'a23', eventId: 't7', athleteId: '4', status: 'present' },
  { id: 'a24', eventId: 't8', athleteId: '4', status: 'present' },
  
  // Gabriel Costa (id: 5) - 8P = 100%
  { id: 'a25', eventId: 't1', athleteId: '5', status: 'present' },
  { id: 'a26', eventId: 't2', athleteId: '5', status: 'present' },
  { id: 'a27', eventId: 't3', athleteId: '5', status: 'present' },
  { id: 'a28', eventId: 't4', athleteId: '5', status: 'present' },
  { id: 'a29', eventId: 't5', athleteId: '5', status: 'present' },
  { id: 'a30', eventId: 't6', athleteId: '5', status: 'present' },
  { id: 'a31', eventId: 't7', athleteId: '5', status: 'present' },
  { id: 'a32', eventId: 't8', athleteId: '5', status: 'present' },
  
  // Matheus Lima (id: 6) - 4P, 3F, 1FJ = 50%
  { id: 'a33', eventId: 't1', athleteId: '6', status: 'absent' },
  { id: 'a34', eventId: 't2', athleteId: '6', status: 'absent' },
  { id: 'a35', eventId: 't3', athleteId: '6', status: 'present' },
  { id: 'a36', eventId: 't4', athleteId: '6', status: 'present' },
  { id: 'a37', eventId: 't5', athleteId: '6', status: 'absent' },
  { id: 'a38', eventId: 't6', athleteId: '6', status: 'justified' },
  { id: 'a39', eventId: 't7', athleteId: '6', status: 'present' },
  { id: 'a40', eventId: 't8', athleteId: '6', status: 'present' },
  
  // Rafael Souza (id: 7) - 7P, 1F = 87.5%
  { id: 'a41', eventId: 't1', athleteId: '7', status: 'present' },
  { id: 'a42', eventId: 't2', athleteId: '7', status: 'present' },
  { id: 'a43', eventId: 't3', athleteId: '7', status: 'absent' },
  { id: 'a44', eventId: 't4', athleteId: '7', status: 'present' },
  { id: 'a45', eventId: 't5', athleteId: '7', status: 'present' },
  { id: 'a46', eventId: 't6', athleteId: '7', status: 'present' },
  { id: 'a47', eventId: 't7', athleteId: '7', status: 'present' },
  { id: 'a48', eventId: 't8', athleteId: '7', status: 'present' },
  
  // Bruno Almeida (id: 8) - 3P, 5F = 37.5%
  { id: 'a49', eventId: 't1', athleteId: '8', status: 'absent' },
  { id: 'a50', eventId: 't2', athleteId: '8', status: 'absent' },
  { id: 'a51', eventId: 't3', athleteId: '8', status: 'absent' },
  { id: 'a52', eventId: 't4', athleteId: '8', status: 'present' },
  { id: 'a53', eventId: 't5', athleteId: '8', status: 'absent' },
  { id: 'a54', eventId: 't6', athleteId: '8', status: 'absent' },
  { id: 'a55', eventId: 't7', athleteId: '8', status: 'present' },
  { id: 'a56', eventId: 't8', athleteId: '8', status: 'present' },
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
