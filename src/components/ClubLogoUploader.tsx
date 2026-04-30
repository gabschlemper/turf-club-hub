import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClubLogo } from '@/hooks/useClubLogo';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ImageIcon, Loader2, Upload, Trash2 } from 'lucide-react';
import { ClubLogo } from '@/components/ClubLogo';

interface ClubLogoUploaderProps {
  clubId: string;
}

const MAX_BYTES = 2 * 1024 * 1024; // 2MB

export function ClubLogoUploader({ clubId }: ClubLogoUploaderProps) {
  const { data: club } = useClubLogo(clubId);
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['club-logo'] });
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Arquivo inválido', description: 'Selecione uma imagem.', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({ title: 'Imagem muito grande', description: 'Tamanho máximo: 2MB.', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `${clubId}/logo-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('club-logos')
        .upload(path, file, { upsert: true, cacheControl: '3600' });
      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage.from('club-logos').getPublicUrl(path);

      const { error: updateError } = await supabase
        .from('clubs')
        .update({ logo_url: publicUrl.publicUrl })
        .eq('id', clubId);
      if (updateError) throw updateError;

      toast({ title: 'Logo atualizada com sucesso!' });
      refresh();
      setOpen(false);
    } catch (err: any) {
      console.error('Logo upload error:', err);
      toast({
        title: 'Erro ao enviar logo',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    setIsUploading(true);
    try {
      const { error } = await supabase
        .from('clubs')
        .update({ logo_url: null })
        .eq('id', clubId);
      if (error) throw error;
      toast({ title: 'Logo removida.' });
      refresh();
    } catch (err: any) {
      toast({ title: 'Erro ao remover', description: err?.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ImageIcon className="w-4 h-4 mr-2" />
          Logo do clube
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Logo do clube</DialogTitle>
          <DialogDescription>
            Será exibida na tela de login e no menu lateral. PNG ou JPG, até 2MB. Recomendado: imagem quadrada com fundo transparente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <ClubLogo clubId={clubId} className="w-32 h-32" initialsClassName="text-4xl" />
          <p className="text-sm text-muted-foreground text-center">
            {club?.logo_url ? 'Logo atual' : 'Nenhuma logo enviada'}
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />

        <DialogFooter className="gap-2 sm:gap-0">
          {club?.logo_url && (
            <Button
              variant="ghost"
              onClick={handleRemove}
              disabled={isUploading}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remover
            </Button>
          )}
          <Button
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {club?.logo_url ? 'Trocar logo' : 'Enviar logo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
