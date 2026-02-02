import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cake } from 'lucide-react';
import { format, differenceInDays, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseLocalDate } from '@/lib/dateUtils';

interface BirthdayCardProps {
  athletes: any[];
  showAge?: boolean; // Only show age if admin
}

interface UpcomingBirthday {
  athlete: any;
  nextBirthday: Date;
  daysUntil: number;
  age?: number; // Optional - only for admins
}

export function BirthdayCard({ athletes, showAge = false }: BirthdayCardProps) {
  // Use start of today (local time) to ensure correct day calculation
  const today = startOfDay(new Date());
  const currentYear = today.getFullYear();

  // Calculate upcoming birthdays (filter out athletes without birth_date)
  const upcomingBirthdays: UpcomingBirthday[] = athletes
    .filter(athlete => athlete.birth_date) // Only athletes with birth_date
    .map(athlete => {
      // Parse birth_date as local date to avoid timezone shifts
      // birth_date is stored as "YYYY-MM-DD" in the database
      const birthDate = parseLocalDate(athlete.birth_date);
      
      // Calculate this year's birthday (in local time)
      let nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
      
      // If birthday already passed this year, use next year
      if (isBefore(nextBirthday, today)) {
        nextBirthday = new Date(currentYear + 1, birthDate.getMonth(), birthDate.getDate());
      }
      
      // Calculate days until birthday (comparing dates without time)
      const daysUntil = differenceInDays(startOfDay(nextBirthday), today);
      
      return {
        athlete,
        nextBirthday,
        daysUntil,
        age: showAge ? nextBirthday.getFullYear() - birthDate.getFullYear() : undefined,
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5); // Show next 5 birthdays

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Cake className="w-5 h-5 text-primary" />
          Próximos Aniversários
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {upcomingBirthdays.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum aniversário próximo</p>
        ) : (
          <div className="space-y-2">
            {upcomingBirthdays.map(({ athlete, nextBirthday, daysUntil, age }) => {
              const isToday = daysUntil === 0;
              const isTomorrow = daysUntil === 1;
              
              return (
                <div
                  key={athlete.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-semibold text-sm">
                        {athlete.name.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground text-sm truncate">{athlete.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(nextBirthday, "dd 'de' MMMM", { locale: ptBR })}
                        {age !== undefined && (
                          <>
                            {' • '}
                            {age} anos
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    {isToday ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground animate-pulse">
                        Hoje! 🎉
                      </span>
                    ) : isTomorrow ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                        Amanhã
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {daysUntil}d
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
