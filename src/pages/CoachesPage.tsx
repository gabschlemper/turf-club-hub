import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Pencil, Trash2, Mail, Loader2, Eye, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/PageHeader';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCoaches, type Coach } from '@/hooks/useCoaches';
import { useAuth } from '@/contexts/AuthContext';
import { nameSchema, emailSchema } from '@/lib/validations';

const coachSchema = z.object({
  name: nameSchema,
  email: emailSchema,
});

type CoachFormData = {
  name: string;
  email: string;
};

export function CoachesPage() {
  const { canMutate } = useAuth();
  const { coaches, isLoading, createCoach, updateCoach, deleteCoach } = useCoaches();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const [deletingCoachId, setDeletingCoachId] = useState<string | null>(null);

  const form = useForm<CoachFormData>({
    resolver: zodResolver(coachSchema),
    defaultValues: { name: '', email: '' },
  });

  const filteredCoaches = coaches.filter((c) => {
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  const openCreateDialog = () => {
    form.reset({ name: '', email: '' });
    setEditingCoach(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (coach: Coach) => {
    form.reset({ name: coach.name, email: coach.email });
    setEditingCoach(coach);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: CoachFormData) => {
    if (editingCoach) {
      await updateCoach.mutateAsync({ id: editingCoach.id, ...data });
    } else {
      await createCoach.mutateAsync(data);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deletingCoachId) {
      await deleteCoach.mutateAsync(deletingCoachId);
      setDeletingCoachId(null);
    }
  };

  if (!canMutate) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Treinadores" description="Visualização restrita" />
        <div className="text-center py-12 text-muted-foreground">
          Você não tem permissão para acessar esta página.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Treinadores"
        description="Gerencie os treinadores do clube. Após cadastrar, o treinador deve criar uma conta com o mesmo e-mail."
        action={
          <Button variant="gradient" onClick={openCreateDialog} className="w-full sm:w-auto" size="sm">
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Novo Treinador</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        }
      />

      <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/20 flex gap-3">
        <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-foreground">
          <p className="font-medium mb-1">Como funciona</p>
          <p className="text-muted-foreground">
            Após cadastrar um treinador, oriente-o a acessar a tela de login e criar uma conta usando
            <span className="font-medium text-foreground"> exatamente o mesmo e-mail </span>
            informado aqui. O sistema atribuirá automaticamente o papel de Treinador (somente leitura).
          </p>
        </div>
      </div>

      <div className="mb-4 sm:mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar treinador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 sm:pl-10 h-10 sm:h-12 text-sm sm:text-base"
          />
        </div>
      </div>

      {filteredCoaches.length === 0 ? (
        <div className="text-center py-8 sm:py-12 text-sm sm:text-base text-muted-foreground">
          {searchQuery
            ? 'Nenhum treinador encontrado.'
            : 'Nenhum treinador cadastrado ainda. Clique em "Novo Treinador" para começar.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredCoaches.map((coach) => (
            <div
              key={coach.id}
              className="p-4 sm:p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-semibold text-base sm:text-lg">
                      {coach.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">{coach.name}</h3>
                    <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                      <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                      <span className="truncate">{coach.email}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0 ml-2">
                  <button
                    onClick={() => openEditDialog(coach)}
                    className="p-1.5 hover:bg-muted rounded"
                    aria-label="Editar treinador"
                  >
                    <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => setDeletingCoachId(coach.id)}
                    className="p-1.5 hover:bg-destructive/10 rounded"
                    aria-label="Excluir treinador"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground inline-flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Treinador
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCoach ? 'Editar Treinador' : 'Novo Treinador'}</DialogTitle>
            <DialogDescription>
              O treinador deve criar uma conta no sistema usando exatamente o mesmo e-mail.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="coach-name">Nome *</Label>
              <Input id="coach-name" {...form.register('name')} placeholder="Nome completo" />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="coach-email">E-mail *</Label>
              <Input
                id="coach-email"
                type="email"
                {...form.register('email')}
                placeholder="treinador@email.com"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="gradient"
                disabled={createCoach.isPending || updateCoach.isPending}
              >
                {(createCoach.isPending || updateCoach.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingCoach ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingCoachId} onOpenChange={() => setDeletingCoachId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir treinador</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este treinador? Caso ele já tenha criado uma conta, o
              acesso continuará ativo até que a conta seja revogada manualmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default CoachesPage;