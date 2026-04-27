import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { Upload, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePhotoUpload, type UploadProgress } from '@/hooks/useGallery';
import { cn } from '@/lib/utils';

interface Props {
  albumId: string;
}

const MAX_FILE_MB = 25;
const ACCEPTED = 'image/jpeg,image/png,image/webp,image/heic';

export function PhotoUploader({ albumId }: Props) {
  const { uploadPhotos } = usePhotoUpload(albumId);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter((f) => {
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        console.warn(`Arquivo ignorado (>${MAX_FILE_MB}MB):`, f.name);
        return false;
      }
      return f.type.startsWith('image/');
    });
    if (files.length === 0) return;

    setProgress({ total: files.length, done: 0, failed: 0 });
    await uploadPhotos.mutateAsync({
      files,
      onProgress: (p) => setProgress({ ...p }),
    });
    setTimeout(() => setProgress(null), 1500);
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const isUploading = uploadPhotos.isPending;
  const pct = progress ? Math.round(((progress.done + progress.failed) / progress.total) * 100) : 0;

  return (
    <div className="mb-6">
      <div
        onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center transition-colors',
          dragActive ? 'border-primary bg-primary/5' : 'border-border',
          isUploading && 'pointer-events-none opacity-70'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="hidden"
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            {isUploading ? <Loader2 className="w-6 h-6 text-primary animate-spin" /> : <Upload className="w-6 h-6 text-primary" />}
          </div>
          <div>
            <p className="text-sm font-medium">
              {isUploading ? 'Enviando fotos...' : 'Arraste fotos aqui ou clique para selecionar'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG ou WebP — até {MAX_FILE_MB}MB cada. Otimizamos antes de enviar.
            </p>
          </div>
          {!isUploading && (
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              <ImageIcon className="w-4 h-4 mr-2" />
              Escolher arquivos
            </Button>
          )}
        </div>

        {progress && (
          <div className="mt-4 max-w-md mx-auto text-left">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{progress.done + progress.failed} / {progress.total}</span>
              {progress.failed > 0 && (
                <span className="text-destructive flex items-center gap-1">
                  <X className="w-3 h-3" /> {progress.failed} falha(s)
                </span>
              )}
            </div>
            <Progress value={pct} />
            {progress.current && isUploading && (
              <p className="text-xs text-muted-foreground mt-1 truncate">{progress.current}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
