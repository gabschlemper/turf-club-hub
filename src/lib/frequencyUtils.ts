import { Database } from '@/integrations/supabase/types';

type Athlete = Database['public']['Tables']['athletes']['Row'];
type Event = Database['public']['Tables']['events']['Row'];
type Attendance = Database['public']['Tables']['attendances']['Row'];

export type AthleteCategory = 'GF' | 'SC' | 'OE';
export type FrequencyTier = 1 | 2 | 3 | 4 | 5;

export interface CategoryInfo {
  code: AthleteCategory;
  name: string;
  description: string;
  annualGoal: number;
  goalDescription: string;
  icon: string;
}

export const CATEGORY_INFO: Record<AthleteCategory, CategoryInfo> = {
  GF: {
    code: 'GF',
    name: 'Grande Florianópolis',
    description: 'Atletas residentes na Grande Florianópolis',
    annualGoal: 52,
    goalDescription: '1 treino principal por semana (52 domingos/ano)',
    icon: '🏙️',
  },
  SC: {
    code: 'SC',
    name: 'Outras Cidades SC',
    description: 'Atletas de outras cidades de Santa Catarina',
    annualGoal: 12,
    goalDescription: '1 treino principal por mês (12 meses/ano)',
    icon: '🚗',
  },
  OE: {
    code: 'OE',
    name: 'Outro Estado',
    description: 'Atletas de outros estados',
    annualGoal: 4,
    goalDescription: '1 treino principal por trimestre (4 trimestres/ano)',
    icon: '✈️',
  },
};

export interface TierInfo {
  tier: FrequencyTier;
  minPercentage: number;
  maxPercentage: number;
  status: string;
  description: string;
  color: string;
  bgColor: string;
  textColor: string;
}

export const TIER_INFO: TierInfo[] = [
  { tier: 1, minPercentage: 75, maxPercentage: Infinity, status: 'Ótimo comprometimento', description: 'Excelente participação', color: 'bg-emerald-500', bgColor: 'bg-emerald-500/10', textColor: 'text-emerald-500' },
  { tier: 2, minPercentage: 60, maxPercentage: 74.99, status: 'Bom comprometimento', description: 'Boa participação', color: 'bg-green-500', bgColor: 'bg-green-500/10', textColor: 'text-green-500' },
  { tier: 3, minPercentage: 50, maxPercentage: 59.99, status: 'Comprometimento regular', description: 'Participação aceitável', color: 'bg-yellow-500', bgColor: 'bg-yellow-500/10', textColor: 'text-yellow-500' },
  { tier: 4, minPercentage: 40, maxPercentage: 49.99, status: 'Comprometimento insuficiente', description: 'Precisa melhorar', color: 'bg-orange-500', bgColor: 'bg-orange-500/10', textColor: 'text-orange-500' },
  { tier: 5, minPercentage: 0, maxPercentage: 39.99, status: 'Comprometimento crítico', description: 'Situação crítica', color: 'bg-red-500', bgColor: 'bg-red-500/10', textColor: 'text-red-500' },
];

export function getTierInfo(percentage: number): TierInfo {
  return TIER_INFO.find(t => percentage >= t.minPercentage) || TIER_INFO[TIER_INFO.length - 1];
}

export function getTierEmoji(tier: FrequencyTier): string {
  switch (tier) {
    case 1: return '✅';
    case 2: return '✅';
    case 3: return '🟡';
    case 4: return '🟠';
    case 5: return '🔴';
  }
}

export interface FrequencyStats {
  // Points
  principalPoints: number;
  extraPoints: number;
  totalPoints: number;
  
  // Counts
  principalAttended: number;
  principalMissed: number;
  principalJustified: number;
  principalAvailable: number;
  extraAttended: number;
  extraAvailable: number;
  
  // Meta
  category: AthleteCategory;
  categoryInfo: CategoryInfo;
  annualGoal: number;
  adjustedGoal: number; // Considering justified absences
  
  // Frequency
  frequency: number;
  tier: TierInfo;
}

export function calculateFrequencyStats(
  athlete: Athlete,
  events: Event[],
  attendances: Attendance[]
): FrequencyStats {
  const category = (athlete.category || 'GF') as AthleteCategory;
  const categoryInfo = CATEGORY_INFO[category];
  
  // Filter training events relevant to this athlete's gender
  const relevantTrainings = events.filter(e => {
    if (e.event_type !== 'training') return false;
    if (e.gender !== 'both' && e.gender !== athlete.gender) return false;
    // Only past events
    if (new Date(e.start_datetime) > new Date()) return false;
    return true;
  });
  
  // Separate by training type
  const principalTrainings = relevantTrainings.filter(e => e.training_type === 'principal');
  const extraTrainings = relevantTrainings.filter(e => e.training_type === 'extra');
  
  // Get athlete's attendances
  const athleteAttendances = attendances.filter(a => a.athlete_id === athlete.id);
  
  // Calculate principal stats
  let principalAttended = 0;
  let principalMissed = 0;
  let principalJustified = 0;
  
  principalTrainings.forEach(training => {
    const attendance = athleteAttendances.find(a => a.event_id === training.id);
    if (attendance?.status === 'present') {
      principalAttended++;
    } else if (attendance?.status === 'justified') {
      principalJustified++;
    } else {
      principalMissed++;
    }
  });
  
  // Calculate extra stats
  let extraAttended = 0;
  extraTrainings.forEach(training => {
    const attendance = athleteAttendances.find(a => a.event_id === training.id);
    if (attendance?.status === 'present') {
      extraAttended++;
    }
  });
  
  // Calculate points
  const principalPoints = principalAttended * 1.0;
  const extraPoints = extraAttended * 0.25;
  const totalPoints = principalPoints + extraPoints;
  
  // Adjust goal based on justified absences (they reduce the goal, not count as points)
  const adjustedGoal = Math.max(1, categoryInfo.annualGoal - principalJustified);
  
  // Calculate frequency
  const frequency = adjustedGoal > 0 ? (totalPoints / adjustedGoal) * 100 : 0;
  
  // Get tier
  const tier = getTierInfo(frequency);
  
  return {
    principalPoints,
    extraPoints,
    totalPoints,
    principalAttended,
    principalMissed,
    principalJustified,
    principalAvailable: principalTrainings.length,
    extraAttended,
    extraAvailable: extraTrainings.length,
    category,
    categoryInfo,
    annualGoal: categoryInfo.annualGoal,
    adjustedGoal,
    frequency,
    tier,
  };
}

export function getMotivationalMessage(tier: FrequencyTier): string {
  switch (tier) {
    case 1:
      return 'Parabéns! Você é um exemplo de dedicação e comprometimento! 🏆';
    case 2:
      return 'Muito bem! Continue assim e logo estará no topo! 💪';
    case 3:
      return 'Você está no caminho certo. Um pouco mais de esforço fará diferença! 🎯';
    case 4:
      return 'Atenção: sua participação precisa melhorar. Conte conosco para ajudar! ⚠️';
    case 5:
      return 'Situação crítica. Procure a diretoria para conversar sobre sua frequência. 🚨';
  }
}
