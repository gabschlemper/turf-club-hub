import { useState } from 'react';
import { Plus, Loader2, ImageIcon, Pencil, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAlbums, useAlbumMutations, type PhotoAlbum } from '@/hooks/useGallery';
import { useAuth } from '@/contexts/AuthContext';
import { canManageGallery } from '@/lib/permissions';
import { parseLocalDate } from '@/lib/dateUtils';
import { AlbumFormDialog } from '@/components/gallery/AlbumFormDialog';
import { AlbumDetail } from '@/components/gallery/AlbumDetail';

export function GalleryPage() {
  const { user } = useAuth();
  const canManage = canManageGallery(user?.role);
  const { data: albums = [], isLoading } = useAlbums();
  const { deleteAlbum } = useAlbumMutations();

  const [selectedAlbum, setSelectedAlbum] = useState<PhotoAlbum | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<PhotoAlbum | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (selectedAlbum) {
    // Re-pull fresh album from list to keep cover_photo_id in sync
    const fresh = albums.find((a) => a.id === selectedAlbum.id) || selectedAlbum;
    return <AlbumDetail album={fresh} onBack={() => setSelectedAlbum(null)} />;
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Galeria"
        description="Fotos dos treinos, jogos e eventos do clube."
        action={
          canManage ? (
            <Button
              variant="gradient"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => { setEditingAlbum(null); setFormOpen(true); }}
            >
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Novo Álbum</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          ) : undefined
        }
      />

      {albums.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {canManage ? 'Nenhum álbum criado ainda. Clique em "Novo Álbum".' : 'Nenhum álbum disponível ainda.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {albums.map((album) => (
            <div
              key={album.id}
              className="group relative rounded-xl overflow-hidden bg-card border border-border hover:border-primary/40 transition-all cursor-pointer"
              onClick={() => setSelectedAlbum(album)}
            >
              <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                {album.cover_thumb_url ? (
                  <img
                    src={album.cover_thumb_url}
                    alt={album.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-muted-foreground/40" />
                  </div>
                )}
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-background/90 text-xs font-medium">
                  {album.photo_count || 0} foto{(album.photo_count || 0) !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm truncate">{album.title}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {parseLocalDate(album.album_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                </div>
                {canManage && (
                  <div className="flex gap-1 mt-2 pt-2 border-t border-border">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingAlbum(album); setFormOpen(true); }}
                      className="flex-1 p-1.5 rounded text-xs hover:bg-muted flex items-center justify-center gap-1"
                    >
                      <Pencil className="w-3 h-3" /> Editar
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingId(album.id); }}
                      className="flex-1 p-1.5 rounded text-xs text-destructive hover:bg-destructive/10 flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Excluir
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AlbumFormDialog open={formOpen} onOpenChange={setFormOpen} album={editingAlbum} />

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir álbum?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as fotos do álbum serão removidas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteAlbum.mutate(deletingId, { onSuccess: () => setDeletingId(null) })}
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

export default GalleryPage;
