import { useClubLogo } from '@/hooks/useClubLogo';
import { cn } from '@/lib/utils';

interface ClubLogoProps {
  clubId?: string;
  /** Tailwind size classes for the container (e.g. "w-10 h-10"). */
  className?: string;
  /** Initials fallback when there's no logo_url. Defaults to "CH". */
  fallbackInitials?: string;
  /** Text size for fallback initials. */
  initialsClassName?: string;
}

/**
 * Renders the club's uploaded logo. Falls back to a gradient square with
 * initials when there's no logo configured (legacy behavior).
 */
export function ClubLogo({
  clubId,
  className = 'w-10 h-10',
  fallbackInitials = 'CH',
  initialsClassName = 'text-lg',
}: ClubLogoProps) {
  const { data: club } = useClubLogo(clubId);

  if (club?.logo_url) {
    return (
      <div className={cn('rounded-lg overflow-hidden bg-white flex items-center justify-center', className)}>
        <img
          src={club.logo_url}
          alt={club.name ? `Logo ${club.name}` : 'Logo do clube'}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg gradient-primary flex items-center justify-center', className)}>
      <span className={cn('text-primary-foreground font-bold', initialsClassName)}>
        {fallbackInitials}
      </span>
    </div>
  );
}
