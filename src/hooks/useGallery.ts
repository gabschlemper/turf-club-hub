import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { processPhotoForUpload, sanitizeFileName } from '@/lib/imageProcessing';

const BUCKET = 'gallery';

export interface PhotoAlbum {
  id: string;
  club_id: string;
  title: string;
  description: string | null;
  album_date: string;
  cover_photo_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  photo_count?: number;
  cover_thumb_url?: string | null;
}

export interface Photo {
  id: string;
  album_id: string;
  club_id: string;
  storage_path: string;
  thumb_path: string;
  file_name: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  uploaded_by: string | null;
  created_at: string;
  thumb_url?: string;
  full_url?: string;
}

export interface AlbumInput {
  title: string;
  description?: string;
  album_date: string; // YYYY-MM-DD
}

const SIGNED_URL_TTL = 60 * 60; // 1 hour

async function signUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL);
  if (error) throw error;
  const map: Record<string, string> = {};
  data?.forEach((item) => {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  });
  return map;
}

export function useAlbums() {
  const { user } = useAuth();
  const queryKey = ['photo-albums', user?.id] as const;

  return useQuery({
    queryKey,
    enabled: !!user,
    queryFn: async () => {
      const { data: albums, error } = await (supabase as any)
        .from('photo_albums')
        .select('*')
        .is('deleted_at', null)
        .order('album_date', { ascending: false });
      if (error) throw error;
      const list = (albums || []) as PhotoAlbum[];

      if (list.length === 0) return list;

      // Fetch one cover per album (cover_photo_id OR first photo)
      const albumIds = list.map((a) => a.id);
      const { data: photos } = await (supabase as any)
        .from('photos')
        .select('id, album_id, thumb_path, created_at')
        .in('album_id', albumIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      const byAlbum: Record<string, { count: number; firstThumb?: string; coverThumb?: string }> = {};
      (photos || []).forEach((p: any) => {
        const slot = byAlbum[p.album_id] || (byAlbum[p.album_id] = { count: 0 });
        slot.count += 1;
        if (!slot.firstThumb) slot.firstThumb = p.thumb_path;
      });

      // Resolve explicit covers
      list.forEach((a) => {
        if (a.cover_photo_id) {
          const found = (photos || []).find((p: any) => p.id === a.cover_photo_id);
          if (found) byAlbum[a.id].coverThumb = found.thumb_path;
        }
      });

      const pathsToSign = list
        .map((a) => byAlbum[a.id]?.coverThumb || byAlbum[a.id]?.firstThumb)
        .filter(Boolean) as string[];
      const urlMap = await signUrls(pathsToSign);

      return list.map((a) => {
        const slot = byAlbum[a.id];
        const thumbPath = slot?.coverThumb || slot?.firstThumb;
        return {
          ...a,
          photo_count: slot?.count || 0,
          cover_thumb_url: thumbPath ? urlMap[thumbPath] || null : null,
        };
      });
    },
    staleTime: 30_000,
  });
}

export function useAlbumPhotos(albumId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['album-photos', user?.id, albumId],
    enabled: !!user && !!albumId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('photos')
        .select('*')
        .eq('album_id', albumId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const photos = (data || []) as Photo[];
      if (photos.length === 0) return photos;

      const allPaths = [
        ...photos.map((p) => p.thumb_path),
        ...photos.map((p) => p.storage_path),
      ];
      const urlMap = await signUrls(allPaths);
      return photos.map((p) => ({
        ...p,
        thumb_url: urlMap[p.thumb_path],
        full_url: urlMap[p.storage_path],
      }));
    },
    staleTime: 30_000,
  });
}

export function useAlbumMutations() {
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();
  const albumsKey = ['photo-albums', user?.id] as const;

  const createAlbum = useMutation({
    mutationFn: async (input: AlbumInput) => {
      const { data, error } = await (supabase as any)
        .from('photo_albums')
        .insert({
          title: input.title.trim(),
          description: input.description?.trim() || null,
          album_date: input.album_date,
          club_id: user?.clubId,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data as PhotoAlbum;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: albumsKey });
      toast({ title: 'Álbum criado!' });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Erro', description: e.message }),
  });

  const updateAlbum = useMutation({
    mutationFn: async ({ id, ...input }: AlbumInput & { id: string; cover_photo_id?: string | null }) => {
      const payload: any = {
        title: input.title.trim(),
        description: input.description?.trim() || null,
        album_date: input.album_date,
      };
      if ('cover_photo_id' in input) payload.cover_photo_id = (input as any).cover_photo_id;
      const { data, error } = await (supabase as any)
        .from('photo_albums')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: albumsKey });
      toast({ title: 'Álbum atualizado!' });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Erro', description: e.message }),
  });

  const setAlbumCover = useMutation({
    mutationFn: async ({ albumId, photoId }: { albumId: string; photoId: string }) => {
      const { error } = await (supabase as any)
        .from('photo_albums')
        .update({ cover_photo_id: photoId })
        .eq('id', albumId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: albumsKey });
      toast({ title: 'Capa atualizada' });
    },
  });

  const deleteAlbum = useMutation({
    mutationFn: async (id: string) => {
      // Soft delete album AND all photos via RPC for safety
      const { data: photos } = await (supabase as any)
        .from('photos')
        .select('id, storage_path, thumb_path')
        .eq('album_id', id)
        .is('deleted_at', null);

      // Remove from storage (best-effort)
      const paths = (photos || []).flatMap((p: any) => [p.storage_path, p.thumb_path]);
      if (paths.length > 0) {
        await supabase.storage.from(BUCKET).remove(paths);
      }

      // Soft delete photos
      if ((photos || []).length > 0) {
        await (supabase as any)
          .from('photos')
          .update({ deleted_at: new Date().toISOString() })
          .eq('album_id', id);
      }

      const { error } = await (supabase as any)
        .from('photo_albums')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: albumsKey });
      toast({ title: 'Álbum excluído' });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Erro', description: e.message }),
  });

  return { createAlbum, updateAlbum, setAlbumCover, deleteAlbum };
}

export interface UploadProgress {
  total: number;
  done: number;
  failed: number;
  current?: string;
}

export function usePhotoUpload(albumId: string | null) {
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();

  const uploadPhotos = useMutation({
    mutationFn: async ({
      files,
      onProgress,
    }: {
      files: File[];
      onProgress?: (p: UploadProgress) => void;
    }) => {
      if (!albumId || !user?.clubId) throw new Error('Sem álbum ou clube');
      const progress: UploadProgress = { total: files.length, done: 0, failed: 0 };
      const concurrency = 3;
      const queue = [...files];

      const worker = async () => {
        while (queue.length > 0) {
          const file = queue.shift();
          if (!file) break;
          progress.current = file.name;
          onProgress?.({ ...progress });
          try {
            const processed = await processPhotoForUpload(file);
            const photoId = crypto.randomUUID();
            const safeName = sanitizeFileName(file.name.replace(/\.[^.]+$/, '')) || 'photo';
            const fullPath = `${user.clubId}/${albumId}/${photoId}_${safeName}.webp`;
            const thumbPath = `${user.clubId}/${albumId}/thumbs/${photoId}_${safeName}.webp`;

            const [{ error: e1 }, { error: e2 }] = await Promise.all([
              supabase.storage.from(BUCKET).upload(fullPath, processed.full, {
                contentType: 'image/webp',
                upsert: false,
              }),
              supabase.storage.from(BUCKET).upload(thumbPath, processed.thumb, {
                contentType: 'image/webp',
                upsert: false,
              }),
            ]);
            if (e1 || e2) throw e1 || e2;

            const { error: dbError } = await (supabase as any).from('photos').insert({
              id: photoId,
              album_id: albumId,
              club_id: user.clubId,
              storage_path: fullPath,
              thumb_path: thumbPath,
              file_name: file.name,
              size_bytes: processed.full.size,
              width: processed.width,
              height: processed.height,
              uploaded_by: user.id,
            });
            if (dbError) {
              await supabase.storage.from(BUCKET).remove([fullPath, thumbPath]);
              throw dbError;
            }

            progress.done += 1;
          } catch (err) {
            console.error('Photo upload failed:', file.name, err);
            progress.failed += 1;
          }
          onProgress?.({ ...progress });
        }
      };

      await Promise.all(Array.from({ length: concurrency }, worker));
      return progress;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['album-photos', user?.id, albumId] });
      qc.invalidateQueries({ queryKey: ['photo-albums', user?.id] });
      if (result.failed === 0) {
        toast({ title: `${result.done} foto(s) enviada(s) com sucesso!` });
      } else {
        toast({
          variant: 'destructive',
          title: `Envio parcial`,
          description: `${result.done} enviadas, ${result.failed} falharam.`,
        });
      }
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Erro no upload', description: e.message }),
  });

  const deletePhoto = useMutation({
    mutationFn: async (photo: Photo) => {
      await supabase.storage.from(BUCKET).remove([photo.storage_path, photo.thumb_path]);
      const { error } = await (supabase as any)
        .from('photos')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', photo.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['album-photos', user?.id, albumId] });
      qc.invalidateQueries({ queryKey: ['photo-albums', user?.id] });
      toast({ title: 'Foto removida' });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Erro', description: e.message }),
  });

  return { uploadPhotos, deletePhoto };
}
