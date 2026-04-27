export type UserRole = 'admin' | 'athlete' | 'club_admin' | 'super_admin' | 'coach' | 'photographer';

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
