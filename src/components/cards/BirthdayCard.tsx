import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cake } from 'lucide-react';
import { format, parseISO, differenceInDays, setYear, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Database } from '@/integrations/supabase/types';

type Athlete = Database['public']['Tables']['athletes']['Row'];

interface BirthdayCardProps {
  athletes: Athlete[];
  showAge?: boolean; // Only show age if admin
}

interface UpcomingBirthday {
  athlete: Athlete;
  nextBirthday: Date;
  daysUntil: number;
  age?: number; // Optional - only for admins
}

export function BirthdayCard({ athletes, showAge = false }: BirthdayCardProps) {
  const today = new Date();
  const currentYear = today.getFullYear();

  // Calculate upcoming birthdays (filter out athletes without birth_date)
  const upcomingBirthdays: UpcomingBirthday[] = athletes
    .filter(athlete => athlete.birth_date) // Only athletes with birth_date
    .map(athlete => {
      const birthDate = parseISO(athlete.birth_date);
      
      // Calculate this year's birthday
      let nextBirthday = setYear(birthDate, currentYear);
      
      // If birthday already passed this year, use next year
      if (isBefore(nextBirthday, today)) {
        nextBirthday = setYear(birthDate, currentYear + 1);
      }
      
      const daysUntil = differenceInDays(nextBirthday, today);
      
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cake className="w-5 h-5 text-primary" />
          Próximos Aniversários
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingBirthdays.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum aniversário próximo</p>
        ) : (
          <div className="space-y-3">
            {upcomingBirthdays.map(({ athlete, nextBirthday, daysUntil, age }) => {
              const isToday = daysUntil === 0;
              const isTomorrow = daysUntil === 1;
              
              return (
                <div
                  key={athlete.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {athlete.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{athlete.name}</p>
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
                  <div className="text-right">
                    {isToday ? (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground animate-pulse">
                        Hoje! 🎉
                      </span>
                    ) : isTomorrow ? (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                        Amanhã
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        em {daysUntil} {daysUntil === 1 ? 'dia' : 'dias'}
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
