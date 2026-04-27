import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Pencil, Trash2, Mail, Loader2, Camera, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/PageHeader';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { usePhotographers, type Photographer } from '@/hooks/usePhotographers';
import { useAuth } from '@/contexts/AuthContext';
import { nameSchema, emailSchema } from '@/lib/validations';

const schema = z.object({ name: nameSchema, email: emailSchema });
type FormData = { name: string; email: string };

export function PhotographersPage() {
  const { isAdmin } = useAuth();
  const { photographers, isLoading, createPhotographer, updatePhotographer, deletePhotographer } = usePhotographers();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Photographer | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { name: '', email: '' } });

  const filtered = photographers.filter((p) => {
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
  });

  const openCreate = () => { form.reset({ name: '', email: '' }); setEditing(null); setIsDialogOpen(true); };
  const openEdit = (p: Photographer) => { form.reset({ name: p.name, email: p.email }); setEditing(p); setIsDialogOpen(true); };
  const handleSubmit = async (data: FormData) => {
    if (editing) await updatePhotographer.mutateAsync({ id: editing.id, ...data });
    else await createPhotographer.mutateAsync(data);
    setIsDialogOpen(false);
  };

  if (!isAdmin) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Fotógrafos" description="Acesso restrito" />
        <div className="text-center py-12 text-muted-foreground">Você não tem permissão para acessar esta página.</div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Fotógrafos"
        description="Gerencie os fotógrafos do clube. Após cadastrar, o fotógrafo deve criar uma conta com o mesmo e-mail."
        action={
          <Button variant="gradient" onClick={openCreate} className="w-full sm:w-auto" size="sm">
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Novo Fotógrafo</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        }
      />

      <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/20 flex gap-3">
        <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-foreground">
          <p className="font-medium mb-1">Como funciona</p>
          <p className="text-muted-foreground">
            O fotógrafo só terá acesso à <span className="font-medium text-foreground">Galeria</span> para subir fotos.
            Oriente-o a criar a conta com <span className="font-medium text-foreground">exatamente o mesmo e-mail</span> informado aqui.
          </p>
        </div>
      </div>

      <div className="mb-4 sm:mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar fotógrafo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10 sm:h-12"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery ? 'Nenhum fotógrafo encontrado.' : 'Nenhum fotógrafo cadastrado.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Camera className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm truncate">{p.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{p.email}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0 ml-2">
                  <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-muted rounded" aria-label="Editar">
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => setDeletingId(p.id)} className="p-1.5 hover:bg-destructive/10 rounded" aria-label="Excluir">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground inline-flex items-center gap-1">
                <Camera className="w-3 h-3" /> Fotógrafo
              </span>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Fotógrafo' : 'Novo Fotógrafo'}</DialogTitle>
            <DialogDescription>O fotógrafo deve criar a conta com o mesmo e-mail.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="ph-name">Nome *</Label>
              <Input id="ph-name" {...form.register('name')} placeholder="Nome completo" />
              {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ph-email">E-mail *</Label>
              <Input id="ph-email" type="email" {...form.register('email')} placeholder="fotografo@email.com" />
              {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" variant="gradient" disabled={createPhotographer.isPending || updatePhotographer.isPending}>
                {(createPhotographer.isPending || updatePhotographer.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editing ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover fotógrafo</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o fotógrafo do clube. Caso ele já tenha conta, perderá o acesso ao tentar entrar novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deletePhotographer.mutate(deletingId, { onSuccess: () => setDeletingId(null) })}
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

export default PhotographersPage;
