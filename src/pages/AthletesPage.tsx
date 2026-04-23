import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Filter, Pencil, Trash2, Mail, Calendar, Loader2, Users, MapPin } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/PageHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAthletes } from '@/hooks/useAthletes';
import { BulkAthleteDialog } from '@/components/athletes/BulkAthleteDialog';
import { athleteSchema, AthleteFormData } from '@/lib/validations';
import { cn } from '@/lib/utils';
import { CATEGORY_INFO, AthleteCategory } from '@/lib/frequencyUtils';
import { useAuth } from '@/contexts/AuthContext';

type GenderFilter = 'all' | 'male' | 'female';
type CategoryFilter = 'all' | AthleteCategory;

const genderLabels: Record<string, string> = {
  male: 'Masculino',
  female: 'Feminino',
};

export function AthletesPage() {
  const { canMutate } = useAuth();
  const { athletes, isLoading, createAthlete, createBulkAthletes, updateAthlete, deleteAthlete } = useAthletes();
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<string | null>(null);
  const [deletingAthlete, setDeletingAthlete] = useState<string | null>(null);

  const form = useForm<AthleteFormData>({
    resolver: zodResolver(athleteSchema),
    defaultValues: { name: '', email: '', gender: 'male', birth_date: '', category: 'GF' },
  });

  const filteredAthletes = athletes.filter(athlete => {
    const matchesSearch = athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) || athlete.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGender = genderFilter === 'all' || athlete.gender === genderFilter;
    const matchesCategory = categoryFilter === 'all' || athlete.category === categoryFilter;
    return matchesSearch && matchesGender && matchesCategory;
  });

  const openCreateDialog = () => {
    form.reset({ name: '', email: '', gender: 'male', birth_date: '', category: 'GF' });
    setEditingAthlete(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (athlete: typeof athletes[0]) => {
    form.reset({ 
      name: athlete.name, 
      email: athlete.email, 
      gender: athlete.gender as 'male' | 'female', 
      birth_date: athlete.birth_date,
      category: (athlete.category || 'GF') as 'GF' | 'SC' | 'OE',
    });
    setEditingAthlete(athlete.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: AthleteFormData) => {
    const athleteData = {
      name: data.name,
      email: data.email,
      gender: data.gender as 'male' | 'female',
      birth_date: data.birth_date,
      category: data.category as 'GF' | 'SC' | 'OE',
    };

    if (editingAthlete) {
      await updateAthlete.mutateAsync({ id: editingAthlete, ...athleteData });
    } else {
      await createAthlete.mutateAsync(athleteData);
    }
    setIsDialogOpen(false);
  };

  const handleBulkSubmit = async (athletes: any[]) => {
    await createBulkAthletes.mutateAsync(athletes);
  };

  const handleDelete = async () => {
    if (deletingAthlete) {
      await deleteAthlete.mutateAsync(deletingAthlete);
      setDeletingAthlete(null);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Atletas" 
        description={canMutate ? "Gerencie os atletas do clube" : "Visualize os atletas do clube"} 
        action={canMutate ? (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => setIsBulkDialogOpen(true)} className="w-full sm:w-auto" size="sm">
              <Users className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Cadastro em Massa</span>
              <span className="sm:hidden">Em Massa</span>
            </Button>
            <Button variant="gradient" onClick={openCreateDialog} className="w-full sm:w-auto" size="sm">
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Novo Atleta</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
        ) : undefined} 
      />

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          <Input placeholder="Buscar atleta..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 sm:pl-10 h-10 sm:h-12 text-sm sm:text-base" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          {(['all', 'male', 'female'] as GenderFilter[]).map(g => (
            <button key={g} onClick={() => setGenderFilter(g)} className={cn("px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap", genderFilter === g ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}>
              {g === 'all' ? 'Todos' : genderLabels[g]}
            </button>
          ))}
          <span className="text-muted-foreground">|</span>
          {(['all', 'GF', 'SC', 'OE'] as CategoryFilter[]).map(c => (
            <button key={c} onClick={() => setCategoryFilter(c)} className={cn("px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap", categoryFilter === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}>
              {c === 'all' ? 'Todas' : `${CATEGORY_INFO[c].icon} ${c}`}
            </button>
          ))}
        </div>
      </div>

      {filteredAthletes.length === 0 ? (
        <div className="text-center py-8 sm:py-12 text-sm sm:text-base text-muted-foreground">
          {searchQuery || genderFilter !== 'all' 
            ? 'Nenhum atleta encontrado com os filtros selecionados.' 
            : 'Nenhum atleta cadastrado ainda. Clique em "Novo Atleta" para começar.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredAthletes.map(athlete => {
            const category = CATEGORY_INFO[(athlete.category || 'GF') as AthleteCategory];
            return (
              <div key={athlete.id} className="p-4 sm:p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-200">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-semibold text-base sm:text-lg">{athlete.name.charAt(0)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">{athlete.name}</h3>
                      <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground"><Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" /><span className="truncate">{athlete.email}</span></div>
                    </div>
                  </div>
                  {canMutate && (
                    <div className="flex gap-1 flex-shrink-0 ml-2">
                      <button onClick={() => openEditDialog(athlete)} className="p-1.5 hover:bg-muted rounded"><Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" /></button>
                      <button onClick={() => setDeletingAthlete(athlete.id)} className="p-1.5 hover:bg-destructive/10 rounded"><Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive" /></button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs sm:text-sm">
                  <span className={cn("px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium", athlete.gender === 'male' ? 'bg-blue-500/10 text-blue-500' : 'bg-pink-500/10 text-pink-500')}>
                    {genderLabels[athlete.gender]}
                  </span>
                  <span className="px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground" title={category.name}>
                    {category.icon} {category.code}
                  </span>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{format(parseISO(athlete.birth_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAthlete ? 'Editar Atleta' : 'Novo Atleta'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" {...form.register('name')} placeholder="Nome completo" />
              {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input id="email" type="email" {...form.register('email')} placeholder="atleta@email.com" />
              {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Naipe *</Label>
                <Select value={form.watch('gender')} onValueChange={(value) => form.setValue('gender', value as 'male' | 'female')}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.gender && <p className="text-sm text-destructive">{form.formState.errors.gender.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento *</Label>
                <Input id="birth_date" type="date" {...form.register('birth_date')} />
                {form.formState.errors.birth_date && <p className="text-sm text-destructive">{form.formState.errors.birth_date.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select value={form.watch('category')} onValueChange={(value) => form.setValue('category', value as 'GF' | 'SC' | 'OE')}>
                <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                <SelectContent>
                  {Object.values(CATEGORY_INFO).map(cat => (
                    <SelectItem key={cat.code} value={cat.code}>
                      <div className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.category && <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>}
              {form.watch('category') && (
                <p className="text-xs text-muted-foreground">
                  {CATEGORY_INFO[form.watch('category') as AthleteCategory]?.goalDescription}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" variant="gradient" disabled={createAthlete.isPending || updateAthlete.isPending}>
                {(createAthlete.isPending || updateAthlete.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingAthlete ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingAthlete} onOpenChange={() => setDeletingAthlete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir atleta</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir este atleta? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BulkAthleteDialog
        open={isBulkDialogOpen}
        onOpenChange={setIsBulkDialogOpen}
        onSubmit={handleBulkSubmit}
        isLoading={createBulkAthletes.isPending}
      />
    </div>
  );
}
