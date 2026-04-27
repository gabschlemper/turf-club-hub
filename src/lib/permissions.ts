import { UserRole } from '@/types';

/**
 * Centralized permission helpers.
 * Use these instead of hardcoding role string checks throughout the app.
 */

export const ADMIN_ROLES: UserRole[] = ['admin', 'club_admin', 'super_admin'];
export const READ_ONLY_ROLES: UserRole[] = ['coach', 'athlete'];

export function isAdminRole(role?: UserRole | string | null): boolean {
  if (!role) return false;
  return ADMIN_ROLES.includes(role as UserRole);
}

export function isCoach(role?: UserRole | string | null): boolean {
  return role === 'coach';
}

export function isAthlete(role?: UserRole | string | null): boolean {
  return role === 'athlete';
}

export function isPhotographer(role?: UserRole | string | null): boolean {
  return role === 'photographer';
}

export function canManageGallery(role?: UserRole | string | null): boolean {
  return isAdminRole(role) || isPhotographer(role);
}

/**
 * Coaches and athletes cannot create/edit/delete data.
 * Only admin roles can perform mutations.
 */
export function canMutate(role?: UserRole | string | null): boolean {
  return isAdminRole(role);
}

/**
 * Pages a coach is allowed to access (read-only).
 */
export const COACH_ALLOWED_PAGES = [
  'dashboard',
  'events',
  'athletes',
  'frequency',
  'rotation',
  'training-confirmation',
  'gallery',
] as const;

export const PHOTOGRAPHER_ALLOWED_PAGES = ['gallery'] as const;

export function canAccessPage(role: UserRole | string | undefined, page: string): boolean {
  if (isAdminRole(role)) return true;
  if (isCoach(role)) return (COACH_ALLOWED_PAGES as readonly string[]).includes(page);
  if (isPhotographer(role)) return (PHOTOGRAPHER_ALLOWED_PAGES as readonly string[]).includes(page);
  // athlete: most pages are allowed except admin-only ones (athletes, audits)
  if (isAthlete(role)) {
    return !['athletes', 'audits', 'coaches', 'photographers'].includes(page);
  }
  return false;
}

export function getRoleLabel(role?: UserRole | string | null): string {
  switch (role) {
    case 'super_admin':
    case 'club_admin':
    case 'admin':
      return 'Administrador';
    case 'coach':
      return 'Treinador';
    case 'photographer':
      return 'Fotógrafo';
    case 'athlete':
      return 'Atleta';
    default:
      return 'Usuário';
  }
}