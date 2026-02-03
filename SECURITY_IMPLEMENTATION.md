# Implementação de Segurança Multi-Tenant

## 📋 Resumo das Mudanças

Foram implementados 3 grandes blocos de segurança:

### 1. ✅ Login Apenas para Atletas Cadastrados
- Validação automática no login
- Usuários não cadastrados são bloqueados
- Mensagem clara de erro

### 2. ✅ Multi-Tenancy (Isolamento por Clube)
- Cada atleta pertence a um clube
- Dados completamente isolados entre clubes
- Impossível acessar dados de outro clube

### 3. ✅ Controle de Permissões Avançado
- **Roles disponíveis:**
  - `athlete`: Atleta comum
  - `admin`: Admin do clube (nomenclatura antiga, mantida por compatibilidade)
  - `club_admin`: Admin do clube
  - `super_admin`: Admin de todos os clubes

---

## 🗄️ Migrations Criadas

### 1. `20260122000000_create_clubs_table.sql`
- Cria tabela `clubs`
- Insere clube padrão
- RLS policies para clubs

### 2. `20260122000001_add_club_id_to_tables.sql`
- Adiciona `club_id` em:
  - athletes
  - events
  - attendances
  - training_confirmations
  - rotation_duties
- Migra dados existentes para clube padrão
- Cria índices de performance

### 3. `20260122000002_update_user_roles_with_clubs.sql`
- Adiciona roles: `club_admin` e `super_admin`
- Adiciona `club_id` em `user_roles`
- Atualiza funções `has_role()` e `get_user_role()`

### 4. `20260122000003_create_helper_functions.sql`
Funções SQL criadas:
- `get_user_club_id()`: Retorna clube do usuário
- `is_club_admin()`: Verifica se é admin do clube
- `is_super_admin()`: Verifica se é super admin
- `can_access_club()`: Verifica acesso ao clube
- `is_registered_athlete()`: Verifica se é atleta cadastrado
- `get_athlete_club_id()`: Retorna clube do atleta

### 5. `20260122000004_update_rls_policies.sql`
Atualização completa de todas as RLS policies:
- Athletes: isolamento por clube
- Events: isolamento por clube
- Attendances: acesso limitado
- Training confirmations: por clube
- Profiles: visibilidade limitada
- User roles: gestão por clube

### 6. `20260122000005_validate_athlete_login.sql`
- Função `validate_athlete_login()`: Valida no login
- Função `check_user_athlete_access()`: Verifica acesso completo
- Trigger de validação (se possível)

---

## 🔧 Mudanças no Frontend

### `src/contexts/AuthContext.tsx`
**Mudanças:**
1. Interface `AuthUser` agora inclui:
   - `clubId`: ID do clube do usuário
   - `athleteId`: ID do atleta (se aplicável)

2. Função `fetchUserData()`:
   - Valida se usuário é atleta cadastrado
   - Busca `club_id` do usuário
   - Força logout se não for atleta cadastrado

3. Função `login()`:
   - Valida acesso após autenticação
   - Bloqueia usuários não cadastrados
   - Mensagem de erro clara

4. Propriedade `isAdmin`:
   - Agora inclui: `admin`, `club_admin`, `super_admin`

### `src/types/index.ts`
- Tipo `UserRole` atualizado com novos roles

---

## 📊 Estrutura de Dados

### Clube Padrão
```sql
ID: 00000000-0000-0000-0000-000000000001
Nome: Hóquei Clube Desterro
Slug: hoquei-clube-desterro
```

Todos os dados existentes foram migrados para este clube (Hóquei Clube Desterro - Florianópolis).

---

## 🚀 Como Aplicar as Migrations

### Opção 1: Via Supabase CLI (Local)
```sh
npx supabase db reset
```

### Opção 2: Via Supabase Dashboard
1. Acesse: https://supabase.com/dashboard
2. Vá em **SQL Editor**
3. Execute cada migration na ordem:
   - `20260122000000_create_clubs_table.sql`
   - `20260122000001_add_club_id_to_tables.sql`
   - `20260122000002_update_user_roles_with_clubs.sql`
   - `20260122000003_create_helper_functions.sql`
   - `20260122000004_update_rls_policies.sql`
   - `20260122000005_validate_athlete_login.sql`

### Opção 3: Via Supabase CLI
```bash
npx supabase db push
```

---

## ⚠️ IMPORTANTE - Pós-Migração

### 1. Criar Primeiro Club Admin
Execute no SQL Editor do Supabase:

```sql
-- Substitua SEU_EMAIL pelo email do admin
UPDATE user_roles 
SET role = 'club_admin',
    club_id = '00000000-0000-0000-0000-000000000001'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'SEU_EMAIL@exemplo.com'
);
```

### 2. Garantir que Atletas Estão Vinculados
```sql
-- Verificar se todos atletas têm club_id
SELECT * FROM athletes WHERE club_id IS NULL;

-- Se houver, atualizar:
UPDATE athletes 
SET club_id = '00000000-0000-0000-0000-000000000001'
WHERE club_id IS NULL;
```

### 3. Criar Novo Clube (se necessário)
```sql
INSERT INTO clubs (name, slug, description)
VALUES ('Nome do Clube', 'slug-do-clube', 'Descrição');
```

---

## 🔐 Fluxo de Segurança

### Login de Atleta
1. Usuário faz login
2. Sistema verifica se email existe em `athletes`
3. Se não existe → Logout + Erro
4. Se existe → Login normal

### Login de Admin
1. Usuário faz login
2. Sistema verifica role em `user_roles`
3. Se é `admin`, `club_admin` ou `super_admin` → Login normal
4. Se não → Valida como atleta

### Acesso a Dados
1. Toda query passa por RLS
2. RLS verifica `club_id` do usuário
3. Apenas dados do mesmo clube são retornados
4. Super admin vê todos os clubes

---

## 🧪 Testes Recomendados

### Teste 1: Login Bloqueado
1. Criar usuário no Auth que NÃO está em athletes
2. Tentar fazer login
3. ✅ Deve ser bloqueado com erro

### Teste 2: Isolamento de Clubes
1. Criar 2 clubes diferentes
2. Criar atletas em clubes diferentes
3. Login com atleta do Clube A
4. ✅ Não deve ver dados do Clube B

### Teste 3: Permissões de Admin
1. Login como `club_admin`
2. ✅ Deve gerenciar apenas seu clube
3. ✅ Não deve ver outros clubes

### Teste 4: Super Admin
1. Login como `super_admin`
2. ✅ Deve ver todos os clubes
3. ✅ Deve gerenciar qualquer dado

---

## 📝 Notas Importantes

1. **Compatibilidade**: A role `admin` foi mantida por compatibilidade. Equivale a `club_admin`.

2. **Performance**: Todos os índices necessários foram criados para otimizar queries com `club_id`.

3. **Extensibilidade**: Sistema pronto para múltiplos clubes. Basta inserir novo clube e vincular atletas.

4. **Segurança**: RLS garante isolamento no nível do banco de dados. Mesmo com bug no frontend, dados ficam protegidos.

---

## 🆘 Troubleshooting

### Erro: "Only registered athletes can login"
**Causa**: Email não existe na tabela athletes  
**Solução**: Cadastrar atleta no sistema primeiro

### Erro: "RLS policy violation"
**Causa**: club_id NULL ou usuário sem acesso  
**Solução**: Verificar user_roles e athletes.club_id

### Erro ao criar evento/atleta
**Causa**: club_id não está sendo passado  
**Solução**: Frontend deve incluir club_id nas mutations (será ajustado automaticamente pelas RLS policies)

---

## ✅ Checklist de Validação

- [ ] Migrations aplicadas com sucesso
- [ ] Clube padrão criado
- [ ] Atletas existentes vinculados ao clube
- [ ] Primeiro admin criado
- [ ] Login de atleta cadastrado funciona
- [ ] Login de não-cadastrado é bloqueado
- [ ] Dados isolados por clube
- [ ] Admin vê apenas seu clube
- [ ] Frontend atualizado e funcionando
