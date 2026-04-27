import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAlbumMutations, type PhotoAlbum } from '@/hooks/useGallery';

const schema = z.object({
  title: z.string().trim().min(2, 'Título muito curto').max(100),
  description: z.string().max(500).optional(),
  album_date: z.string().min(1, 'Selecione uma data'),
});
type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  album?: PhotoAlbum | null;
}

export function AlbumFormDialog({ open, onOpenChange, album }: Props) {
  const { createAlbum, updateAlbum } = useAlbumMutations();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: album?.title || '',
      description: album?.description || '',
      album_date: album?.album_date || new Date().toISOString().slice(0, 10),
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: album?.title || '',
        description: album?.description || '',
        album_date: album?.album_date || new Date().toISOString().slice(0, 10),
      });
    }
  }, [open, album, form]);

  const onSubmit = async (data: FormData) => {
    if (album) await updateAlbum.mutateAsync({ id: album.id, ...data });
    else await createAlbum.mutateAsync(data);
    onOpenChange(false);
  };

  const pending = createAlbum.isPending || updateAlbum.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{album ? 'Editar Álbum' : 'Novo Álbum'}</DialogTitle>
          <DialogDescription>Organize as fotos por evento, treino ou data.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="album-title">Título *</Label>
            <Input id="album-title" {...form.register('title')} placeholder="Ex: Treino domingo 26/04" />
            {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="album-date">Data *</Label>
            <Input id="album-date" type="date" {...form.register('album_date')} />
            {form.formState.errors.album_date && <p className="text-sm text-destructive">{form.formState.errors.album_date.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="album-desc">Descrição</Label>
            <Textarea id="album-desc" {...form.register('description')} placeholder="Opcional" rows={3} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" variant="gradient" disabled={pending}>
              {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {album ? 'Salvar' : 'Criar Álbum'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
