import { useState, useMemo } from 'react';
import { ArrowLeft, Download, Trash2, Star, Loader2, Image as ImageIcon } from 'lucide-react';
import Lightbox from 'yet-another-react-lightbox';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import LightboxDownload from 'yet-another-react-lightbox/plugins/download';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAlbumPhotos, useAlbumMutations, usePhotoUpload, type PhotoAlbum, type Photo } from '@/hooks/useGallery';
import { useAuth } from '@/contexts/AuthContext';
import { canManageGallery } from '@/lib/permissions';
import { useToast } from '@/hooks/use-toast';
import { PhotoUploader } from './PhotoUploader';
import { parseLocalDate } from '@/lib/dateUtils';

interface Props {
  album: PhotoAlbum;
  onBack: () => void;
}

export function AlbumDetail({ album, onBack }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const canManage = canManageGallery(user?.role);
  const { data: photos = [], isLoading } = useAlbumPhotos(album.id);
  const { setAlbumCover } = useAlbumMutations();
  const { deletePhoto } = usePhotoUpload(album.id);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<Photo | null>(null);
  const [zipping, setZipping] = useState(false);

  const slides = useMemo(
    () => photos.map((p) => ({ src: p.full_url || '', width: p.width || undefined, height: p.height || undefined })),
    [photos]
  );

  const downloadOne = async (photo: Photo) => {
    if (!photo.full_url) return;
    try {
      const res = await fetch(photo.full_url);
      const blob = await res.blob();
      triggerDownload(blob, photo.file_name.replace(/\.[^.]+$/, '') + '.webp');
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao baixar foto' });
    }
  };

  const downloadAll = async () => {
    if (photos.length === 0) return;
    setZipping(true);
    try {
      const zip = new JSZip();
      // Limit concurrency
      const concurrency = 4;
      const queue = [...photos];
      const worker = async () => {
        while (queue.length > 0) {
          const photo = queue.shift();
          if (!photo?.full_url) continue;
          try {
            const res = await fetch(photo.full_url);
            const blob = await res.blob();
            const name = photo.file_name.replace(/\.[^.]+$/, '') + '.webp';
            zip.file(name, blob);
          } catch (err) {
            console.warn('Failed to add to zip:', photo.file_name);
          }
        }
      };
      await Promise.all(Array.from({ length: concurrency }, worker));
      const content = await zip.generateAsync({ type: 'blob' });
      const safeTitle = album.title.replace(/[^a-zA-Z0-9-_ ]/g, '').slice(0, 60);
      triggerDownload(content, `${safeTitle || 'album'}.zip`);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao gerar ZIP' });
    } finally {
      setZipping(false);
    }
  };

  const setCover = async (photoId: string) => {
    await setAlbumCover.mutateAsync({ albumId: album.id, photoId });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <Button variant="ghost" size="icon" onClick={onBack} className="flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{album.title}</h1>
            <p className="text-sm text-muted-foreground">
              {parseLocalDate(album.album_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              {photos.length > 0 && ` • ${photos.length} foto${photos.length > 1 ? 's' : ''}`}
            </p>
            {album.description && <p className="text-sm text-muted-foreground mt-1">{album.description}</p>}
          </div>
        </div>
        {photos.length > 0 && (
          <Button variant="outline" size="sm" onClick={downloadAll} disabled={zipping} className="flex-shrink-0">
            {zipping ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Baixar tudo (ZIP)
          </Button>
        )}
      </div>

      {canManage && <PhotoUploader albumId={album.id} />}

      {isLoading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : photos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma foto neste álbum ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
          {photos.map((photo, idx) => (
            <div key={photo.id} className="group relative aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={photo.thumb_url}
                alt={photo.file_name}
                loading="lazy"
                onClick={() => setLightboxIndex(idx)}
                className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-1.5 gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); downloadOne(photo); }}
                  className="p-1.5 rounded-md bg-background/90 hover:bg-background"
                  aria-label="Baixar"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                {canManage && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setCover(photo.id); }}
                      className="p-1.5 rounded-md bg-background/90 hover:bg-background"
                      aria-label="Definir como capa"
                      title="Definir como capa"
                    >
                      <Star className={`w-3.5 h-3.5 ${album.cover_photo_id === photo.id ? 'fill-primary text-primary' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingPhoto(photo); }}
                      className="p-1.5 rounded-md bg-destructive/90 hover:bg-destructive text-destructive-foreground"
                      aria-label="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
              {album.cover_photo_id === photo.id && (
                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-medium flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 fill-current" /> Capa
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Lightbox
        open={lightboxIndex !== null}
        index={lightboxIndex ?? 0}
        close={() => setLightboxIndex(null)}
        slides={slides}
        plugins={[Fullscreen, Zoom, LightboxDownload, Counter]}
        zoom={{ maxZoomPixelRatio: 3, scrollToZoom: true }}
        carousel={{ finite: false }}
        controller={{ closeOnBackdropClick: true }}
      />

      <AlertDialog open={!!deletingPhoto} onOpenChange={() => setDeletingPhoto(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover foto?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingPhoto) deletePhoto.mutate(deletingPhoto, { onSuccess: () => setDeletingPhoto(null) });
              }}
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

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
