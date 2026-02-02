import { useState } from 'react';
import { ChevronDown, ChevronRight, Search, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AthleteWithStatus {
  id: string;
  name: string;
}

interface CollapsibleAthleteListProps {
  title: string;
  icon: React.ReactNode;
  athletes: AthleteWithStatus[];
  badgeVariant?: 'confirmed' | 'declined' | 'no-response';
  initialCollapsed?: boolean;
  maxVisibleInPreview?: number;
  className?: string;
  useModal?: boolean; // Use modal for long lists instead of collapse
}

const getBadgeStyles = (variant: string) => {
  switch (variant) {
    case 'confirmed':
      return 'bg-success/15 text-success hover:bg-success/20 border-success/20';
    case 'declined':
      return 'bg-destructive/15 text-destructive hover:bg-destructive/20 border-destructive/20';
    case 'no-response':
      return 'bg-muted/80 text-muted-foreground hover:bg-muted border-muted-foreground/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export function CollapsibleAthleteList({
  title,
  icon,
  athletes,
  badgeVariant = 'no-response',
  initialCollapsed = false,
  maxVisibleInPreview = 3,
  className,
  useModal = false
}: CollapsibleAthleteListProps) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  if (athletes.length === 0) return null;

  const filteredAthletes = searchTerm
    ? athletes.filter(athlete => 
        athlete.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : athletes;

  const hasMoreThanPreview = athletes.length > maxVisibleInPreview;
  const visibleAthletes = isCollapsed ? athletes.slice(0, maxVisibleInPreview) : athletes;
  const hiddenCount = athletes.length - maxVisibleInPreview;
  const badgeStyles = getBadgeStyles(badgeVariant);

  // Use modal for long lists (>8 athletes) or when explicitly requested
  const shouldUseModal = useModal || athletes.length > 8;

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setSearchTerm(''); // Reset search when opening modal
  };

  return (
    <>
      <div className={cn("space-y-1.5", className)}>
        {shouldUseModal ? (
          /* Modal approach for long lists */
          <Button
            variant="ghost"
            className="w-full h-auto p-2 justify-between text-left hover:bg-muted/50 rounded-md group border border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 transition-all"
            onClick={handleOpenModal}
          >
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 group-hover:text-foreground transition-colors">
              {icon}
              {title} ({athletes.length})
              <span className="text-[9px] opacity-70">• Clique para ver todos</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors">
              <Users className="h-3 w-3" />
              <ChevronRight className="h-3 w-3" />
            </div>
          </Button>
        ) : hasMoreThanPreview ? (
          /* Collapsible approach for medium lists */
          <Button
            variant="ghost"
            className="w-full h-auto p-1 justify-between text-left hover:bg-muted/50 rounded-md group"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <div className="text-[10px] text-muted-foreground flex items-center gap-1 group-hover:text-foreground transition-colors">
              {icon}
              {title} ({athletes.length})
              {isCollapsed && (
                <span className="text-[9px] opacity-70 ml-1">• Clique para ver</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors">
              {isCollapsed ? (
                <div className="flex items-center gap-1 text-[10px]">
                  <span>+{hiddenCount}</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </div>
          </Button>
        ) : (
          /* Simple header for small lists */
          <div className="text-[10px] text-muted-foreground flex items-center gap-1 px-1">
            {icon}
            {title} ({athletes.length})
          </div>
        )}
        
        {!shouldUseModal && (
          /* Grid layout for non-modal lists */
          <div className="space-y-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-1">
              {visibleAthletes.map((athlete) => (
                <Badge
                  key={athlete.id}
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 text-center justify-center font-normal whitespace-normal leading-tight min-h-[20px]",
                    badgeStyles
                  )}
                  title={athlete.name}
                >
                  <span className="truncate">{athlete.name}</span>
                </Badge>
              ))}
            </div>
            
            {/* Show remaining count if collapsed and has more */}
            {isCollapsed && hasMoreThanPreview && (
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-2 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md w-full border border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 transition-all"
                  onClick={() => setIsCollapsed(false)}
                >
                  <span className="flex items-center gap-2">
                    <ChevronDown className="h-3 w-3" />
                    Ver todos os {athletes.length} atletas
                    <ChevronDown className="h-3 w-3" />
                  </span>
                </Button>
              </div>
            )}
            
            {/* Show collapse button when expanded and has many items */}
            {!isCollapsed && hasMoreThanPreview && athletes.length > 8 && (
              <div className="text-center pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-[10px] text-muted-foreground hover:text-foreground"
                  onClick={() => setIsCollapsed(true)}
                >
                  <span className="flex items-center gap-1">
                    <ChevronRight className="h-3 w-3" />
                    Recolher lista
                  </span>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal for displaying all athletes */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {icon}
              {title} ({athletes.length})
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Search input for long lists */}
            {athletes.length > 10 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar atleta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
            
            {/* Athletes list */}
            <div className="max-h-60 overflow-y-auto">
              {filteredAthletes.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  {searchTerm ? 'Nenhum atleta encontrado' : 'Nenhum atleta na lista'}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {filteredAthletes.map((athlete, index) => (
                    <div
                      key={athlete.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-md text-sm",
                        badgeVariant === 'confirmed' && "bg-success/10",
                        badgeVariant === 'declined' && "bg-destructive/10",
                        badgeVariant === 'no-response' && "bg-muted/50"
                      )}
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <span className="flex-1">{athlete.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {searchTerm && filteredAthletes.length > 0 && (
              <div className="text-xs text-muted-foreground text-center">
                {filteredAthletes.length} de {athletes.length} atletas
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}