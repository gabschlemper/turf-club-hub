

# Multi-Tenancy: Isolamento por Clube

## Situacao Atual

As migrations de multi-tenancy (`20260122000000` a `20260122000006`) existem nos arquivos mas **nao foram aplicadas** -- a tabela `clubs` nao existe e nenhuma tabela possui coluna `club_id`. O sistema opera como single-tenant.

## Arquitetura Proposta

```text
┌──────────────┐      ┌──────────────┐
│    clubs     │      │  user_roles  │
│  id, name,   │◄─────│  + club_id   │
│  slug        │      │  user_id,    │
└──────┬───────┘      │  role        │
       │              └──────────────┘
       │
       ├──► athletes.club_id
       ├──► events.club_id
       ├──► attendances.club_id
       ├──► training_confirmations.club_id
       ├──► rotation_duties.club_id
       └──► debts.club_id
```

## Plano de Implementacao

### 1. Banco de Dados (Migrations)

- **Criar tabela `clubs`** com `id`, `name`, `slug`, `created_at`
- **Adicionar `club_id`** (UUID, FK para clubs) em: `athletes`, `events`, `attendances`, `training_confirmations`, `rotation_duties`, `debts`
- **Adicionar `club_id`** em `user_roles` para vincular admin ao clube
- **Migrar dados existentes** para um clube padrao (ex: "Hoquei Clube Desterro")
- **Criar funcoes helper** (`get_user_club_id()`, `can_access_club()`) com `SECURITY DEFINER` para evitar recursao RLS
- **Atualizar todas as RLS policies** para filtrar por `club_id`, garantindo que usuarios so vejam dados do proprio clube
- **Indices** em todas as colunas `club_id` para performance

### 2. Backend (AuthContext)

- Buscar `club_id` do usuario logado (via `user_roles` ou `athletes`)
- Expor `clubId` no contexto de autenticacao
- Bloquear acesso se usuario nao tiver clube vinculado

### 3. Frontend (Hooks e Mutations)

- Incluir `club_id` em todas as mutations de criacao (athletes, events, debts, etc.)
- Filtrar queries por `club_id` quando necessario (RLS ja faz isso, mas e boa pratica)
- Nenhuma mudanca visual necessaria -- o isolamento e transparente

### 4. Edge Function de Backup

- Atualizar para filtrar por clube do admin (ou exportar todos se super_admin)

## Detalhes Tecnicos

### Funcao helper principal (evita recursao RLS)
```sql
CREATE FUNCTION get_user_club_id(_user_id uuid) RETURNS uuid
-- Busca club_id do usuario via user_roles ou athletes
-- SECURITY DEFINER para nao passar por RLS
```

### Exemplo de RLS atualizada
```sql
-- Athletes: usuario so ve atletas do seu clube
CREATE POLICY "Club isolation" ON athletes
FOR SELECT USING (
  club_id = get_user_club_id(auth.uid())
);
```

### Roles
- `admin` / `club_admin`: gerencia apenas seu clube
- `super_admin`: acesso a todos os clubes (para voce gerenciar a plataforma)
- `athlete`: acesso restrito ao proprio clube

## Fluxo para Adicionar Novo Clube

1. Inserir registro na tabela `clubs`
2. Cadastrar atletas com o `club_id` do novo clube
3. Criar usuario admin e atribuir `club_admin` + `club_id` na `user_roles`
4. Pronto -- RLS garante isolamento automatico

## Riscos e Mitigacoes

- **Dados existentes**: todos migrados para clube padrao, sem perda
- **Performance**: indices em `club_id` garantem queries rapidas
- **Seguranca**: isolamento no nivel do banco (RLS), nao depende do frontend

