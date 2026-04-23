import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  onClick?: () => void;
  children?: React.ReactNode;
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default', onClick, children }: StatCardProps) {
  const variants = {
    default: 'bg-card',
    primary: 'bg-primary/10 border-primary/20',
    success: 'bg-success/10 border-success/20',
    warning: 'bg-warning/10 border-warning/20',
    destructive: 'bg-destructive/10 border-destructive/20',
  };

  const iconVariants = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/20 text-primary',
    success: 'bg-success/20 text-success',
    warning: 'bg-warning/20 text-warning',
    destructive: 'bg-destructive/20 text-destructive',
  };

  const Component: any = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      className={cn(
        "p-6 rounded-xl border border-border transition-all duration-200 hover:shadow-lg animate-fade-in text-left w-full",
        onClick && "cursor-pointer hover:border-primary/40 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/40",
        variants[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p className={cn(
              "text-sm font-medium",
              trend.positive ? "text-success" : "text-destructive"
            )}>
              {trend.positive ? '+' : ''}{trend.value}% vs mês anterior
            </p>
          )}
          {children}
        </div>
        <div className={cn(
          "p-3 rounded-lg",
          iconVariants[variant]
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Component>
  );
}
