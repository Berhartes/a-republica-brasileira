# 🎤 Processamento de Discursos de Deputados

## 🎯 Funcionalidades Implementadas

### ✅ Sistema Completo de Discursos
- **Extração completa** de todos os discursos de deputados
- **Paginação automática** (75 itens por página)
- **Atualização incremental** dos últimos 60 dias
- **12 campos por discurso** com metadados completos
- **Estrutura otimizada no Firestore**

## 🚀 Comandos Disponíveis

### 📋 Modo Completo (todos os discursos)
```bash
# Processar todos os discursos de todos os deputados
npm run process:discursos

# Processar apenas 10 deputados (para testes)
npm run process:discursos:quick
```

### 🔄 Modo Atualização Incremental (60 dias)
```bash
# Atualizar discursos dos últimos 60 dias de todos os deputados
npm run process:discursos:atualizar

# Atualizar apenas 10 deputados (para testes)
npm run process:discursos:atualizar:quick
```

### ⚙️ Comandos Personalizados
```bash
# Modo completo com limite personalizado
ts-node scripts/initiators/processar_discursosdeputados.ts --limite 25

# Modo atualização com limite personalizado  
ts-node scripts/initiators/processar_discursosdeputados.ts --atualizar --limite 25

# Modo atualização com concorrência personalizada
ts-node scripts/initiators/processar_discursosdeputados.ts --atualizar --limite 10 --concorrencia 3
```

## 🔄 Como Funciona a Atualização Incremental

### 📅 Período Verificado
- **Últimos 60 dias**: a partir da data atual
- **Exemplo**: Em janeiro/2025, verifica discursos desde 23/novembro/2024

### 🔍 Lógica de Verificação
1. **Extrai todos os discursos** do deputado (modo completo)
2. **Filtra discursos dos últimos 60 dias** baseado em `dataHoraInicio`
3. **Compara com dados existentes** no Firestore por ID do discurso
4. **Identifica apenas discursos novos** (que não existem no Firestore)
5. **Adiciona novos discursos** aos dados existentes (não sobrescreve)
6. **Recalcula totais e estatísticas**
7. **Marca períodos como processados**

### 🏗️ Estrutura no Firestore

```
congressoNacional/camaraDeputados/discursos/
├── {codigo}/                              # Documento principal do deputado
│   ├── idDeputado: string
│   ├── totalDiscursos: number
│   ├── ultimaAtualizacao: timestamp
│   ├── periodosProcessados: [             # CONTROLE INCREMENTAL
│   │   { periodo: "2024-12", dataProcessamento: "2024-12-15T10:00:00Z" },
│   │   { periodo: "2025-01", dataProcessamento: "2025-01-10T10:00:00Z" }
│   │   ]
│   ├── estatisticasPorAno: array
│   └── estatisticasPorTipo: array
│   
└── {codigo}/dados/items                   # Array de discursos
    ├── items: DiscursoTransformado[]      # Todos os discursos
    ├── totalItems: number
    └── ultimaAtualizacao: timestamp
```

## 📊 Campos Extraídos por Discurso

```typescript
interface DiscursoTransformado {
  // Dados básicos
  id: string;
  dataHoraInicio: string;
  dataHoraFim: string;
  tipoDiscurso: string;
  
  // Conteúdo
  sumario: string;
  transcricao: string;
  palavrasChave: string[];
  
  // Evento/Contexto
  faseEvento: string;
  tipoEvento: string;
  codEvento: string;
  
  // URLs e recursos
  urlAudio: string;
  urlTexto: string;
  
  // Metadados
  idDeputado: string;
  dataExtracao: string;
  anoDiscurso: number;
  mesDiscurso: number;
}
```

## 🎛️ Configurações Avançadas

### ⚡ Performance
- **Concorrência**: 2 deputados processados simultaneamente
- **Delay entre páginas**: 1 segundo
- **Delay entre lotes**: 5 segundos
- **Retry automático**: 5 tentativas com 3s de delay
- **Ordenação**: Por `dataHoraInicio` descendente (mais recente primeiro)

### 🔄 Atualização Inteligente
- **Filtro temporal**: Últimos 60 dias baseado em `dataHoraInicio`
- **Detecção de duplicatas**: Compara IDs de discursos existentes
- **Mesclagem segura**: Novos discursos são adicionados, não sobrescritos
- **Recálculo automático**: Totais e estatísticas são atualizados

## 📈 Logs e Monitoramento

### 🎯 Logs do Modo Atualização
```
🔄 Deputado 123456: encontrados 15 novos discursos dos últimos 60 dias
✅ Deputado 123456: atualizado - nenhum novo discurso nos últimos 60 dias
🎤 Total de novos discursos extraídos: 1.234
📅 Período verificado: últimos 60 dias
```

### 📊 Resumo Final
```
====================================================
📊 RESUMO DO PROCESSAMENTO DE DISCURSOS
====================================================
🔧 Modo: ATUALIZAÇÃO INCREMENTAL (últimos 60 dias)
✅ Deputados processados com sucesso: 485
🔄 Deputados já atualizados (sem novos dados): 203
❌ Deputados com erro: 2
🎤 Total de novos discursos extraídos: 12.345
📅 Período verificado: últimos 60 dias
====================================================
```

## 🆚 Diferenças entre Discursos e Despesas

| **Aspecto** | **Despesas** | **Discursos** |
|-------------|--------------|---------------|
| **Filtro Temporal** | API suporta `?ano=X&mes=Y` | Filtro client-side por data |
| **Período** | Últimos 2 meses | Últimos 60 dias |
| **Atualização** | Por mês específico | Por período contínuo |
| **Volume** | ~100-500 por deputado/mês | ~10-50 por deputado/60 dias |
| **Campos** | 16 campos + valores monetários | 12 campos + conteúdo textual |

## 🚨 Troubleshooting

### ❓ Problemas Comuns

**1. "Deputado já atualizado"**
- Normal no modo incremental
- Indica que não há novos discursos nos últimos 60 dias

**2. "Página vazia"**
- Normal: indica fim da paginação
- API retorna array vazio quando não há mais discursos

**3. "Erro ao verificar dados existentes"**
- Primeira execução: normal, será criado
- Problemas de conectividade: verificar Firebase

### 📝 Características da API de Discursos

**Parâmetros Suportados:**
- `idLegislatura`: Legislatura específica
- `pagina`: Número da página
- `itens`: Itens por página (máx: 75)
- `ordenarPor`: `dataHoraInicio`, `id`
- `ordem`: `ASC` ou `DESC`

**Limitações:**
- Sem filtros de data nativos (ano/mês)
- Filtros são aplicados no lado do cliente
- Necessário processar todos os discursos para filtrar por data

### 🔧 Recomendações

**Para Primeira Execução:**
- Use modo completo: `npm run process:discursos:quick`
- Teste com poucos deputados primeiro

**Para Manutenção Regular:**
- Use modo atualização: `npm run process:discursos:atualizar`
- Execute semanalmente ou quinzenalmente

**Para Troubleshooting:**
- Verifique logs detalhados
- Use `--limite 1` para deputado específico
- Verifique conectividade com Firebase

## 🆕 Exemplo de Uso

```bash
# 1. Primeira execução - extrair todos os discursos de 5 deputados
npm run process:discursos -- --limite 5

# 2. Execução de atualização - apenas novos discursos
npm run process:discursos:atualizar -- --limite 5

# 3. Verificar se funcionou
# Resultado esperado: "nenhum novo discurso" na segunda execução
```

## 🎯 Resultado Final Esperado

```
✅ Deputado 123456: 45 discursos em 3 páginas
✅ Deputado 789012: 23 novos discursos em 2 páginas
🎤 Total de discursos extraídos: 68
```

O sistema está 100% pronto e otimizado para processamento eficiente de discursos! 🚀
