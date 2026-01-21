# Regras de Negócio - Sistema de Presença

## Visão Geral

O sistema de presença do clube controla a frequência dos atletas em treinos, calculando taxas de presença, pontos acumulados e classificação em faixas de desempenho. O sistema considera treinos principais (obrigatórios) e treinos extras (opcionais/bônus).

---

## 1. Tipos de Treino

### 1.1 Treino Principal
- **Descrição**: Treinos regulares obrigatórios do calendário
- **Peso**: 1.0 ponto por presença
- **Obrigatoriedade**: Esperado que todos os atletas participem
- **Impacto na Meta**: Conta para o cálculo da meta de presença

### 1.2 Treino Extra
- **Descrição**: Treinos adicionais opcionais (ex: preparação física, técnica específica)
- **Peso**: 0.25 pontos por presença (25% de um treino principal)
- **Obrigatoriedade**: Completamente opcional
- **Impacto na Meta**: NÃO conta para meta - apenas adiciona bônus
- **Importante**: Não participar de treinos extras NÃO penaliza o atleta

---

## 2. Status de Presença

### 2.1 Presente
- Atleta compareceu ao treino
- **Treino Principal**: +1.0 ponto
- **Treino Extra**: +0.25 pontos (bônus)

### 2.2 Falta (Ausente)
- Atleta não compareceu sem justificativa
- **Treino Principal**: 0 pontos, conta negativamente na taxa de presença
- **Treino Extra**: Sem impacto negativo (é opcional)

### 2.3 Falta Justificada
- Atleta não compareceu mas apresentou justificativa válida
- **Treino Principal**: 0 pontos, MAS reduz a meta do atleta
- **Efeito**: Não penaliza a taxa de presença do atleta
- **Exemplos**: Lesão, compromisso familiar, atestado médico

---

## 3. Cálculo da Meta de Presença

### 3.1 Meta Baseada em Eventos Realizados
```
Meta = Total de Treinos Principais Realizados - Faltas Justificadas
```

**Exemplo no início do ano:**
- 5 treinos principais realizados
- 1 falta justificada
- Meta = 5 - 1 = 4 pontos necessários

**Vantagem**: Meta justa e proporcional ao que já aconteceu no ano

### 3.2 Meta NÃO considera treinos extras
- Treinos extras não aumentam a meta
- São puramente opcionais e de bônus

---

## 4. Cálculo da Taxa de Presença

### 4.1 Fórmula em Duas Partes

**Parte 1 - Taxa Base (Treinos Principais):**
```
Taxa Base = ((Presenças Principais + Justificadas) / Total Treinos Principais) × 100
```

**Parte 2 - Bônus de Extras:**
```
Bônus Extra = (Presenças em Extras / Total Treinos Principais) × 100 × 0.25
```

**Taxa Final:**
```
Taxa de Presença = Taxa Base + Bônus Extra
```

### 4.2 Exemplo Prático

**Cenário:**
- 10 treinos principais realizados
- Atleta: 8 presenças principais, 0 justificadas, 2 faltas
- Atleta participou de 4 treinos extras

**Cálculo:**
- Taxa Base = (8 + 0) / 10 × 100 = 80%
- Bônus Extra = 4 / 10 × 100 × 0.25 = 10%
- **Taxa Final = 80% + 10% = 90%**

### 4.3 Observações Importantes

- A taxa de presença pode ultrapassar 100% devido aos bônus de treinos extras
- Um atleta com 100% nos treinos principais que participar de todos os extras terá taxa superior a 100%
- A taxa base (apenas principais) é usada para classificação em faixas

---

## 5. Sistema de Pontos

### 5.1 Acúmulo de Pontos
```
Pontos Totais = (Presenças Principais × 1.0) + (Presenças Extras × 0.25)
```

### 5.2 Meta de Pontos Ajustada
```
Meta Ajustada = Treinos Principais - Faltas Justificadas
```

### 5.3 Exemplo
- 10 treinos principais realizados
- 2 faltas justificadas
- 7 presenças principais
- 3 presenças extras

**Cálculo:**
- Pontos = (7 × 1.0) + (3 × 0.25) = 7.75 pontos
- Meta = 10 - 2 = 8 pontos
- Progresso = 7.75 / 8 = 96.9%

---

## 6. Faixas de Classificação (Tiers)

### 6.1 Critério de Classificação
A classificação é baseada **APENAS na taxa base** (treinos principais), garantindo equidade entre atletas que participam ou não de extras.

### 6.2 Faixas

| Faixa | Taxa Base | Status | Descrição |
|-------|-----------|--------|-----------|
| **Faixa 1** | ≥ 90% | Excelente | Frequência exemplar, comprometimento máximo |
| **Faixa 2** | 75% - 89% | Boa | Boa frequência, comprometimento sólido |
| **Faixa 3** | 60% - 74% | Regular | Frequência aceitável, pode melhorar |
| **Faixa 4** | 45% - 59% | Abaixo da Média | Frequência preocupante, necessita atenção |
| **Faixa 5** | < 45% | Crítica | Frequência crítica, intervenção necessária |

### 6.3 Cores das Faixas
- **Faixa 1**: Verde (sucesso)
- **Faixa 2**: Azul claro (bom)
- **Faixa 3**: Amarelo (atenção)
- **Faixa 4**: Laranja (alerta)
- **Faixa 5**: Vermelho (crítico)

---

## 7. Categorias de Atletas

### 7.1 Categoria GF (Geral Feminina)
- **Nome**: Geral Feminina
- **Meta Anual**: 52 pontos (1 treino/semana durante o ano)
- **Descrição**: Categoria principal feminina

### 7.2 Categoria SC (Sub-18 Categoria)
- **Nome**: Sub-18 Categoria
- **Meta Anual**: 40 pontos
- **Descrição**: Atletas em formação, até 18 anos

### 7.3 Categoria OE (Outros Escalões)
- **Nome**: Outros Escalões
- **Meta Anual**: 30 pontos
- **Descrição**: Categorias de base ou veteranos

### 7.4 Observação
As metas anuais são **referências indicativas** para final de temporada. O cálculo real usa eventos já realizados (meta dinâmica).

---

## 8. Filtros e Segmentação

### 8.1 Filtro por Gênero
Os treinos podem ser específicos para:
- **Masculino**: Apenas atletas homens
- **Feminino**: Apenas atletas mulheres
- **Ambos**: Todos os atletas

### 8.2 Aplicação
- Um atleta só é avaliado em treinos do seu gênero ou "ambos"
- Treinos de outro gênero não contam na meta nem na taxa

---

## 9. Regras Especiais

### 9.1 Início de Temporada
- No início do ano, com poucos treinos realizados, a meta é proporcional
- Exemplo: 5 treinos = meta de 5 pontos (não 52)
- Evita taxas artificialmente baixas no começo

### 9.2 Atleta com 100% + Extras
- Atleta com 100% presença em principais: permanece em 100%
- Cada extra adiciona bônus: pode chegar a 125%, 150%, etc.
- **Não penaliza** quem não faz extras

### 9.3 Faltas Justificadas Estratégia
- Reduzem a meta, tornando-a mais alcançável
- Não contam como pontos, mas também não penalizam
- Uso correto: situações genuínas (lesão, doença, emergência)

---

## 10. Exemplos de Cenários

### Cenário A: Atleta Padrão
```
Treinos principais: 20 realizados
Atleta: 18 presenças, 0 justificadas, 2 faltas, 0 extras

Taxa Base: 18/20 × 100 = 90%
Bônus: 0
Taxa Final: 90%
Faixa: 1 (Excelente)
Pontos: 18.0 de meta 20.0
```

### Cenário B: Atleta com Extras
```
Treinos principais: 20 realizados
Atleta: 15 presenças, 0 justificadas, 5 faltas, 8 extras

Taxa Base: 15/20 × 100 = 75%
Bônus: 8/20 × 100 × 0.25 = 10%
Taxa Final: 85%
Faixa: 2 (Boa) - baseada nos 75%
Pontos: 17.0 (15 + 8×0.25) de meta 20.0
```

### Cenário C: Atleta com Justificadas
```
Treinos principais: 20 realizados
Atleta: 16 presenças, 3 justificadas, 1 falta, 0 extras

Taxa Base: (16+3)/20 × 100 = 95%
Bônus: 0
Taxa Final: 95%
Faixa: 1 (Excelente)
Pontos: 16.0 de meta 17.0 (20-3)
```

### Cenário D: Atleta Superstar
```
Treinos principais: 20 realizados
Atleta: 20 presenças, 0 justificadas, 0 faltas, 10 extras

Taxa Base: 20/20 × 100 = 100%
Bônus: 10/20 × 100 × 0.25 = 12.5%
Taxa Final: 112.5%
Faixa: 1 (Excelente)
Pontos: 22.5 (20 + 10×0.25) de meta 20.0
```

---

## 11. Implementação no Sistema

### 11.1 Arquivo Principal: `frequencyUtils.ts`
Contém toda a lógica de cálculo:
- `calculateFrequencyStats()`: Função principal
- `getTierInfo()`: Determina faixa baseada na taxa base
- `getMotivationalMessage()`: Mensagens motivacionais por faixa

### 11.2 Componentes de Visualização
- **AdminFrequencyView**: Visão administrativa com todos os atletas
- **AthleteFrequencyView**: Visão individual do atleta (minimalista)
- **AttendancePage**: Marcação de presença e histórico

### 11.3 Consistência de Dados
Todas as páginas usam a mesma função `calculateFrequencyStats()` garantindo cálculos idênticos em todas as visualizações.

---

## 12. Considerações Finais

### 12.1 Filosofia do Sistema
- **Justo**: Meta proporcional ao que foi realizado
- **Motivador**: Treinos extras como bônus, não obrigação
- **Transparente**: Regras claras e cálculos visíveis
- **Flexível**: Considera situações especiais (justificadas)

### 12.2 Benefícios
- Atletas não são penalizados no início do ano
- Treinos extras incentivam sem pressionar
- Sistema de faixas justo (não considera bônus)
- Faltas justificadas tratadas apropriadamente

### 12.3 Próximos Passos Sugeridos
- Relatórios mensais de frequência
- Alertas automáticos para faixas críticas
- Gamificação com badges para conquistas
- Histórico longitudinal de evolução

---

**Documento criado em:** 21 de Janeiro de 2026  
**Versão:** 1.0  
**Sistema:** Turf Club Hub - Gestão de Presenças
