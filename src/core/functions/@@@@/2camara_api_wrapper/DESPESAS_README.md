# 💰 Processamento de Despesas de Deputados

## 🎯 Funcionalidades Implementadas

### ✅ Sistema Completo de Despesas
- **Extração completa** de todas as despesas de deputados
- **Paginação automática** (75 itens por página)
- **Atualização incremental** dos últimos 60 dias
- **16 campos por despesa** com validação de tipos
- **Estrutura otimizada no Firestore**

## 🚀 Comandos Disponíveis

### 📋 Modo Completo (todas as despesas)
```bash
# Processar todas as despesas de todos os deputados
npm run process:despesas

# Processar apenas 10 deputados (para testes)
npm run process:despesas:quick
```

### 🔄 Modo Atualização Incremental (60 dias)
```bash
# Atualizar despesas dos últimos 60 dias de todos os deputados
npm run process:despesas:atualizar

# Atualizar apenas 10 deputados (para testes)
npm run process:despesas:atualizar:quick
```

### ⚙️ Comandos Personalizados
```bash
# Modo completo com limite personalizado
ts-node scripts/initiators/processar_despesasdeputados.ts --limite 25

# Modo atualização com limite personalizado  
ts-node scripts/initiators/processar_despesasdeputados.ts --atualizar --limite 25

# Modo atualização com concorrência personalizada
ts-node scripts/initiators/processar_despesasdeputados.ts --atualizar --limite 10 --concorrencia 3
```

## 🔄 Como Funciona a Atualização Incremental

### 📅 Período Verificado
- **Últimos 60 dias**: mês atual + mês anterior
- **Exemplo**: Em janeiro/2025, verifica dezembro/2024 e janeiro/2025

### 🔍 Lógica de Verificação
1. **Lê dados existentes** do Firestore
2. **Verifica meses processados** na estrutura `mesesProcessados`
3. **Identifica meses faltantes** ou desatualizados (>5 dias)
4. **Processa apenas os meses necessários** usando filtros `?ano=2025&mes=01`
5. **Adiciona novas despesas** aos dados existentes (não sobrescreve)
6. **Recalcula totais e estatísticas**
7. **Marca meses como processados**

### 🏗️ Estrutura no Firestore

```
congressoNacional/camaraDeputados/despesas/
├── {codigo}/                              # Documento principal do deputado
│   ├── idDeputado: string
│   ├── totalDespesas: number
│   ├── valorTotal: number
│   ├── ultimaAtualizacao: timestamp
│   ├── mesesProcessados: {                # CONTROLE INCREMENTAL
│   │   "2024-12": "2024-12-15T10:00:00Z",
│   │   "2025-01": "2025-01-10T10:00:00Z"
│   │   }
│   ├── estatisticasPorAno: array
│   └── estatisticasPorTipo: array
│   
└── {codigo}/dados/items                   # Array de despesas
    ├── items: DespesaTransformada[]       # Todas as despesas
    ├── totalItems: number
    └── ultimaAtualizacao: timestamp
```

## 📊 Campos Extraídos por Despesa

```typescript
interface DespesaTransformada {
  // Dados básicos
  ano: number;
  mes: number;
  tipoDespesa: string;
  
  // Documento
  codDocumento: string;
  tipoDocumento: string;
  codTipoDocumento: string;
  dataDocumento: string;
  numDocumento: string;
  urlDocumento: string;
  
  // Valores
  valorDocumento: number;
  valorLiquido: number;
  valorGlosa: number;
  
  // Fornecedor
  nomeFornecedor: string;
  cnpjCpfFornecedor: string;
  
  // Controle
  numRessarcimento: string;
  codLote: string;
  parcela: number;
  
  // Metadados
  idDeputado: string;
  dataExtracao: string;
}
```

## 🎛️ Configurações Avançadas

### ⚡ Performance
- **Concorrência**: 2 deputados processados simultaneamente
- **Delay entre páginas**: 1 segundo
- **Delay entre meses**: 1.5 segundos  
- **Delay entre lotes**: 5 segundos
- **Retry automático**: 5 tentativas com 3s de delay

### 🔄 Atualização Inteligente
- **Reprocessamento**: Meses desatualizados há mais de 5 dias
- **Filtragem eficiente**: API suporta filtros `?ano=X&mes=Y`
- **Mesclagem segura**: Novas despesas são adicionadas, não sobrescritas
- **Recálculo automático**: Totais e estatísticas são atualizados

## 📈 Logs e Monitoramento

### 🎯 Logs do Modo Atualização
```
🔄 Deputado 123456: processando 2 mês(es) faltante(s): 2024-12, 2025-01
✅ Deputado 123456: atualizado - nenhuma nova despesa nos últimos 60 dias
💰 Total de novas despesas extraídas: 1.234
💵 Valor total das novas despesas: R$ 45.678,90
📅 Período verificado: últimos 60 dias (mês atual e anterior)
```

### 📊 Resumo Final
```
====================================================
📊 RESUMO DO PROCESSAMENTO DE DESPESAS
====================================================
🔧 Modo: ATUALIZAÇÃO INCREMENTAL (últimos 60 dias)
✅ Deputados processados com sucesso: 485
🔄 Deputados já atualizados (sem novos dados): 203
❌ Deputados com erro: 2
💰 Total de novas despesas extraídas: 12.345
💵 Valor total das novas despesas: R$ 1.234.567,89
📅 Período verificado: últimos 60 dias (mês atual e anterior)
====================================================
```

## 🚨 Troubleshooting

### ❓ Problemas Comuns

**1. "Deputado já atualizado"**
- Normal no modo incremental
- Indica que não há novas despesas nos últimos 60 dias

**2. "Erro ao verificar dados existentes"**
- Primeira execução: normal, será criado
- Problemas de conectividade: verificar Firebase

**3. "Página não encontrada"**
- Normal: indica fim da paginação
- API da Câmara retorna 404 quando não há mais páginas

### 🔧 Recomendações

**Para Primeira Execução:**
- Use modo completo: `npm run process:despesas:quick`
- Teste com poucos deputados primeiro

**Para Manutenção Regular:**
- Use modo atualização: `npm run process:despesas:atualizar`
- Execute diariamente ou semanalmente

**Para Troubleshooting:**
- Verifique logs detalhados
- Use `--limite 1` para deputado específico
- Verifique conectividade com Firebase
