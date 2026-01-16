import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Download, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type AthleteInsert = Database['public']['Tables']['athletes']['Insert'];

interface BulkAthleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (athletes: AthleteInsert[]) => Promise<void>;
  isLoading: boolean;
}

interface ParsedAthlete {
  name: string;
  email: string;
  gender: 'male' | 'female';
  birth_date: string;
  valid: boolean;
  errors: string[];
}

export function BulkAthleteDialog({ open, onOpenChange, onSubmit, isLoading }: BulkAthleteDialogProps) {
  const [parsedAthletes, setParsedAthletes] = useState<ParsedAthlete[]>([]);
  const [error, setError] = useState<string>('');

  const downloadTemplate = () => {
    const csv = 'Nome,Email,Gênero,Data de Nascimento\nJoão Silva,joao@example.com,male,2000-01-15\nMaria Santos,maria@example.com,female,1998-05-20';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_atletas.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const validateAthlete = (athlete: Partial<ParsedAthlete>): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!athlete.name?.trim()) {
      errors.push('Nome é obrigatório');
    }

    if (!athlete.email?.trim()) {
      errors.push('Email é obrigatório');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(athlete.email)) {
      errors.push('Email inválido');
    }

    if (!athlete.gender || !['male', 'female'].includes(athlete.gender)) {
      errors.push('Gênero deve ser "male" ou "female"');
    }

    if (!athlete.birth_date) {
      errors.push('Data de nascimento é obrigatória');
    } else {
      const date = new Date(athlete.birth_date);
      if (isNaN(date.getTime())) {
        errors.push('Data de nascimento inválida (use formato AAAA-MM-DD)');
      }
    }

    return { valid: errors.length === 0, errors };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setParsedAthletes([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          setError('O arquivo CSV deve conter pelo menos uma linha de cabeçalho e uma linha de dados');
          return;
        }

        // Skip header
        const dataLines = lines.slice(1);
        const athletes: ParsedAthlete[] = [];

        dataLines.forEach((line, index) => {
          const values = line.split(',').map(v => v.trim());
          
          if (values.length < 4) {
            athletes.push({
              name: '',
              email: '',
              gender: 'male',
              birth_date: '',
              valid: false,
              errors: [`Linha ${index + 2}: Dados insuficientes (esperado 4 colunas)`],
            });
            return;
          }

          const [name, email, gender, birth_date] = values;
          const athlete = {
            name,
            email,
            gender: gender.toLowerCase() as 'male' | 'female',
            birth_date,
          };

          const validation = validateAthlete(athlete);
          athletes.push({
            ...athlete,
            valid: validation.valid,
            errors: validation.errors.map(err => `Linha ${index + 2}: ${err}`),
          });
        });

        setParsedAthletes(athletes);
      } catch (err) {
        setError('Erro ao processar o arquivo. Verifique se é um CSV válido.');
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    const validAthletes = parsedAthletes.filter(a => a.valid);
    if (validAthletes.length === 0) {
      setError('Nenhum atleta válido para cadastrar');
      return;
    }

    await onSubmit(validAthletes.map(({ name, email, gender, birth_date }) => ({
      name,
      email,
      gender,
      birth_date,
    })));

    setParsedAthletes([]);
    onOpenChange(false);
  };

  const validCount = parsedAthletes.filter(a => a.valid).length;
  const invalidCount = parsedAthletes.length - validCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Atletas em Massa</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV com os dados dos atletas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Baixar modelo CSV</p>
              <p className="text-sm text-muted-foreground">
                Use este modelo como exemplo para preencher os dados
              </p>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Baixar Modelo
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="block">
              <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Clique para fazer upload do CSV</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Formato: Nome,Email,Gênero,Data de Nascimento
                  </p>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </label>
            <p className="text-xs text-muted-foreground">
              Gênero: "male" ou "female" | Data: AAAA-MM-DD (ex: 2000-01-15)
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Results Summary */}
          {parsedAthletes.length > 0 && (
            <div className="space-y-3">
              <div className="flex gap-4">
                <Alert className="flex-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    <strong>{validCount}</strong> atleta(s) válido(s)
                  </AlertDescription>
                </Alert>
                {invalidCount > 0 && (
                  <Alert variant="destructive" className="flex-1">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{invalidCount}</strong> com erro(s)
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Athletes List */}
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Nome</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Gênero</th>
                      <th className="text-left p-2">Nascimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedAthletes.map((athlete, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">
                          {athlete.valid ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-destructive" />
                          )}
                        </td>
                        <td className="p-2">{athlete.name || '-'}</td>
                        <td className="p-2">{athlete.email || '-'}</td>
                        <td className="p-2">{athlete.gender === 'male' ? 'Masculino' : 'Feminino'}</td>
                        <td className="p-2">{athlete.birth_date || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Errors List */}
              {invalidCount > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <p className="font-medium mb-2">Erros encontrados:</p>
                    <ul className="text-xs space-y-1 ml-4 list-disc">
                      {parsedAthletes
                        .filter(a => !a.valid)
                        .flatMap(a => a.errors)
                        .map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || validCount === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                `Cadastrar ${validCount} Atleta(s)`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
