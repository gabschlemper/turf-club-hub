

# Plano: Auditoria do Sistema e Limpeza de Código

## Resumo Executivo

Este plano aborda quatro objetivos principais:
1. Melhorar a página de Histórico de Auditoria
2. Garantir auditoria completa para Eventos, Presenças e Rodízio
3. Remover completamente o código de "Solicitações de Troca" (swap_requests)
4. Garantir que todas as exclusões sejam soft delete

---

## Diagnóstico Atual

### O que já está funcionando:

**Auditoria (triggers automáticos no banco):**
- Athletes: INSERT, UPDATE, SOFT_DELETE, DELETE
- Events: INSERT, UPDATE, SOFT_DELETE, DELETE
- Rotation Duties: INSERT, UPDATE, SOFT_DELETE, DELETE
- Attendances: INSERT, UPDATE, DELETE

**Soft Delete implementado:**
- Athletes, Events, Rotation Duties, Debts

### Problemas identificados:

1. **Attendances sem soft delete** - tabela não possui coluna `deleted_at`
2. **swap_requests ainda referenciado** no código (AuditsPage, types.ts, SECURITY_IMPLEMENTATION.md)
3. **Página de Auditoria básica** - mostra apenas IDs, sem nomes de usuários
4. **Falta detalhamento visual** - valores antigos/novos não são exibidos de forma clara

---

## Implementação

### Fase 1: Limpeza do swap_requests

**Remover referências residuais:**

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/AuditsPage.tsx` | Remover "swap_requests" do `tableLabels` |
| `SECURITY_IMPLEMENTATION.md` | Remover menção a swap_requests |

*Nota: O enum `swap_status` em types.ts é auto-gerado pelo Supabase e será removido via migração.*

### Fase 2: Adicionar soft delete em Attendances

**Migração SQL:**
```sql
-- Adicionar coluna deleted_at
ALTER TABLE public.attendances 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Criar índice para consultas
CREATE INDEX IF NOT EXISTS idx_attendances_deleted_at 
ON public.attendances(deleted_at) 
WHERE deleted_at IS NULL;
```

**Atualizar hook `useAttendances.ts`:**
- Modificar queries para filtrar `deleted_at IS NULL`
- Adicionar função de soft delete se necessário

### Fase 3: Limpar enum swap_status do banco

**Migração SQL:**
```sql
-- Remover enum não utilizado
DROP TYPE IF EXISTS public.swap_status;
```

### Fase 4: Melhorar Página de Auditoria

**Atualizações em `useAudits.ts`:**
- Fazer join com tabela `profiles` para buscar nomes dos usuários
- Incluir informação do usuário no retorno

**Atualizações em `AuditsPage.tsx`:**

| Melhoria | Descrição |
|----------|-----------|
| Nome do usuário | Exibir nome ao invés de UUID truncado |
| Visualização de dados | Expandir para ver old_data/new_data |
| Mobile-first | Cards ao invés de tabela em telas pequenas |
| Resumo de mudanças | Mostrar campos alterados de forma legível |
| Filtro de data | Adicionar filtro por período |

**Nova estrutura visual:**

```text
+--------------------------------------------------+
| 03/02/2026 às 14:32:15                           |
| [Atualização] Atletas                            |
|                                                  |
| Por: João da Silva                               |
| Registro: Lucas Dutra De Oliveira                |
|                                                  |
| Alterações:                                      |
| • email: Dutralucas862@gmail.com                 |
|          → dutralucas862@gmail.com               |
+--------------------------------------------------+
```

---

## Arquivos a serem modificados

| Arquivo | Ação |
|---------|------|
| `src/pages/AuditsPage.tsx` | Atualizar UI, remover swap_requests, adicionar detalhes |
| `src/hooks/useAudits.ts` | Join com profiles, melhorar interface |
| `src/hooks/useAttendances.ts` | Filtrar deleted_at, garantir soft delete |
| `SECURITY_IMPLEMENTATION.md` | Remover referência swap_requests |

---

## Migração de Banco de Dados

```sql
-- 1. Adicionar soft delete em attendances
ALTER TABLE public.attendances 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_attendances_deleted_at 
ON public.attendances(deleted_at) WHERE deleted_at IS NULL;

-- 2. Atualizar RLS policy de attendances para excluir soft deleted
DROP POLICY IF EXISTS "Authenticated users can view attendances" ON public.attendances;
CREATE POLICY "Authenticated users can view non-deleted attendances"
ON public.attendances FOR SELECT
TO authenticated
USING (deleted_at IS NULL);

-- 3. Remover enum swap_status não utilizado
DROP TYPE IF EXISTS public.swap_status CASCADE;
```

---

## Detalhes Técnicos

### Interface de Audit melhorada

```typescript
export interface AuditWithUser {
  id: string;
  user_id: string | null;
  user_name: string | null;  // NOVO
  user_email: string | null; // NOVO
  action: AuditAction;
  table_name: string | null;
  record_id: string | null;
  record_name: string | null; // NOVO - extraído de new_data/old_data
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}
```

### Componente de detalhes expandível

Para exibir as mudanças de forma legível, será criada uma função utilitária que:
1. Compara `old_data` e `new_data`
2. Identifica campos alterados
3. Formata de maneira amigável (sem JSON técnico)

### Labels de campos

```typescript
const fieldLabels: Record<string, string> = {
  name: 'Nome',
  email: 'E-mail',
  birth_date: 'Data de Nascimento',
  gender: 'Gênero',
  category: 'Categoria',
  status: 'Status',
  event_type: 'Tipo de Evento',
  // ...
};
```

---

## Resultado Esperado

1. **Auditoria completa** - Todas as operações CRUD de Eventos, Presenças e Rodízio são registradas automaticamente

2. **Histórico legível** - Admin consegue ver:
   - Quem fez a ação (nome, não UUID)
   - O que foi alterado (campos legíveis)
   - Valores anteriores e novos

3. **Código limpo** - Nenhuma referência residual a swap_requests

4. **Soft delete universal** - Nenhum registro é excluído permanentemente

