import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Users, 
  LogOut, 
  Sun, 
  Moon,
  Home,
  ClipboardCheck,
  RefreshCw,
  CalendarCheck,
  TrendingUp,
  X,
  History,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ currentPage, onNavigate, isOpen = true, onClose }: SidebarProps) {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Navigation structure organized by sections
  const navigationSections = [
    {
      title: 'Principal',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'athlete'] },
        { id: 'events', label: 'Eventos', icon: Calendar, roles: ['admin', 'athlete'] },
        { id: 'finance', label: 'Finanças', icon: Wallet, roles: ['admin', 'athlete'] },
      ]
    },
    {
      title: 'Atletas & Presenças',
      items: [
        { id: 'athletes', label: 'Atletas', icon: Users, roles: ['admin'] },
        { id: 'attendance', label: 'Marcar Presença', icon: ClipboardCheck, roles: ['admin'] },
        { id: 'training-confirmation', label: 'Confirmar Presença', icon: CalendarCheck, roles: ['athlete'] },
        { id: 'frequency', label: 'Frequência', icon: TrendingUp, roles: ['admin', 'athlete'] },
      ]
    },
    {
      title: 'Gestão',
      items: [
        { id: 'rotation', label: 'Rodízio Base', icon: RefreshCw, roles: ['admin', 'athlete'] },
        { id: 'training-confirmation', label: 'Relatório Confirmações', icon: CalendarCheck, roles: ['admin'] },
        { id: 'audits', label: 'Auditoria', icon: History, roles: ['admin'] },
      ]
    }
  ];

  // Filter sections to only show items the user has access to
  const filteredSections = navigationSections.map(section => ({
    ...section,
    items: section.items.filter(item => item.roles.includes(user?.role || 'athlete'))
  })).filter(section => section.items.length > 0);

  const handleNavigate = (page: string) => {
    onNavigate(page);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50 transition-transform duration-300",
        !isOpen && "-translate-x-full lg:translate-x-0"
      )}>
        {/* Close button for mobile */}
        <div className="lg:hidden absolute right-4 top-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-sidebar-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">HC</span>
          </div>
          <div>
            <h1 className="font-bold text-sidebar-foreground">Hockey Club</h1>
            <p className="text-xs text-muted-foreground">Sistema de Gestão</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-5 overflow-y-auto">
        {filteredSections.map((section, sectionIndex) => (
          <div key={section.title}>
            {/* Section Header */}
            <div className="px-3 mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </h3>
            </div>
            
            {/* Section Items */}
            <div className="space-y-1">
              {section.items.map((item) => (
                <button
                  key={`${section.title}-${item.id}`}
                  onClick={() => handleNavigate(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    currentPage === item.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5",
                    currentPage === item.id && "text-primary"
                  )} />
                  {item.label}
                </button>
              ))}
            </div>

            {/* Divider between sections (except last) */}
            {sectionIndex < filteredSections.length - 1 && (
              <div className="mt-5 border-t border-sidebar-border/50" />
            )}
          </div>
        ))}
      </nav>

      {/* User & Actions */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="w-full justify-start gap-3"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
        </Button>

        {/* User Info */}
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-semibold text-sm">
              {user?.name.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role === 'admin' ? 'Administrador' : 'Atleta'}</p>
          </div>
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>
    </aside>
    </>
  );
}
