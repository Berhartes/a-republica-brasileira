# 🏛️ Sistema ETL - Câmara dos Deputados

## 📋 Visão Geral

Sistema completo de **Extração, Transformação e Carregamento (ETL)** dos dados da API da Câmara dos Deputados para o Firebase Firestore.

### ✅ **Módulos Implementados:**

| **Módulo** | **Status** | **Características** | **Atualização Incremental** |
|------------|-----------|---------------------|---------------------------|
| 🎤 **Discursos** | ✅ Completo | 12 campos + conteúdo textual | ✅ Últimos 60 dias |
| 💰 **Despesas** | ✅ Completo | 16 campos + valores monetários | ✅ Últimos 60 dias (2 meses) |
| 👤 **Perfis** | ✅ Completo | 7 endpoints + dados completos | ❌ Sem atualização incremental |

## 🚀 Comandos Rápidos

### 🧪 **Testes de Validação**
```bash
# Testar sistema de despesas
npm run test:despesas:incremental

# Testar sistema de discursos
npm run test:discursos:incremental
```

### 🎤 **Discursos de Deputados**
```bash
# Teste rápido - 10 deputados - modo atualização
npm run process:discursos:atualizar:quick

# Teste rápido - 10 deputados - modo completo
npm run process:discursos:quick

# Produção - todos os deputados - modo atualização
npm run process:discursos:atualizar

# Produção - todos os deputados - modo completo
npm run process:discursos
```

### 💰 **Despesas de Deputados**
```bash
# Teste rápido - 10 deputados - modo atualização
npm run process:despesas:atualizar:quick

# Teste rápido - 10 deputados - modo completo
npm run process:despesas:quick

# Produção - todos os deputados - modo atualização
npm run process:despesas:atualizar

# Produção - todos os deputados - modo completo
npm run process:despesas
```

## 🏗️ Estrutura do Firestore

```
congressoNacional/camaraDeputados/
├── perfis/                    # ✅ Perfis completos dos deputados
│   └── {codigo}/              # Dados de 7 endpoints integrados
│
├── legislaturas/              # ✅ Dados básicos por legislatura
│   └── 57/deputados/{codigo}/ # Dados simplificados da legislatura
│
├── despesas/                  # ✅ Despesas com atualização incremental
│   └── {codigo}/
│       ├── mesesProcessados   # Controle de meses já processados
│       └── dados/items        # Array de despesas
│
└── discursos/                 # ✅ Discursos com atualização incremental
    └── {codigo}/
        ├── periodosProcessados # Controle de períodos já processados
        └── dados/items         # Array de discursos
```

## 🔄 Atualização Incremental

### 🎯 **Estratégias por Módulo:**

| **Módulo** | **Método** | **Período** | **Filtro** | **Controle** |
|------------|------------|-------------|------------|--------------|
| **Despesas** | API Server-side | 60 dias (2 meses) | `?ano=X&mes=Y` | `mesesProcessados` |
| **Discursos** | Client-side | 60 dias corridos | `dataHoraInicio >= dataLimite` | `periodosProcessados` |

### 📅 **Lógica de Atualização:**

1. **Verificar dados existentes** no Firestore
2. **Calcular período faltante** (últimos 60 dias)
3. **Extrair apenas dados novos** da API
4. **Mesclar com dados existentes** (não sobrescrever)
5. **Recalcular estatísticas** automaticamente
6. **Marcar períodos como processados**

## ⚡ Performance e Otimizações

### 🛠️ **Configurações:**
- **Concorrência**: 2 deputados simultâneos
- **Paginação**: 75 itens por página
- **Retry**: 5 tentativas com 3s de delay
- **Rate Limiting**: 1s entre páginas, 5s entre lotes

### 📊 **Volumes Esperados:**
- **Deputados ativos**: ~513 na legislatura 57
- **Despesas**: ~200-500 por deputado/mês
- **Discursos**: ~10-50 por deputado/60 dias

## 🚨 Troubleshooting

### ❓ **Problemas Comuns:**

**1. Erro de TypeScript**
```bash
# Verificar se o arquivo foi salvo corretamente
ls -la scripts/initiators/processar_*deputados.ts
```

**2. "Deputado já atualizado"**
- ✅ **Normal** no modo incremental
- Indica que não há novos dados no período verificado

**3. "Página não encontrada" (404)**
- ✅ **Normal** - indica fim da paginação
- API retorna 404 quando não há mais páginas

**4. Erro de conectividade Firebase**
```bash
# Verificar se o arquivo de credenciais existe
ls -la config/serviceAccountKey.json
```

### 🔧 **Comandos de Debug:**

```bash
# Testar com 1 deputado específico
ts-node scripts/initiators/processar_despesasdeputados.ts --limite 1
ts-node scripts/initiators/processar_discursosdeputados.ts --limite 1

# Modo verbose (se implementado)
ts-node scripts/initiators/processar_despesasdeputados.ts --limite 1 --verbose
```

## 📖 Documentação Detalhada

### 📚 **Documentos Específicos:**
- [`DESPESAS_README.md`](./DESPESAS_README.md) - Sistema de despesas completo
- [`DISCURSOS_README.md`](./DISCURSOS_README.md) - Sistema de discursos completo

### 🌐 **API da Câmara:**
- **Base URL**: `https://dadosabertos.camara.leg.br/api/v2`
- **Documentação**: [Swagger UI](https://dadosabertos.camara.leg.br/swagger/api.html)
- **Rate Limits**: Não especificados (usamos 1s entre requests)

## 🎯 Próximos Passos

### 🚧 **Módulos Futuros:**
- **Votações** de deputados
- **Comissões** e membros
- **Proposições** e autoria
- **Eventos** e participação

### 🔄 **Melhorias Planejadas:**
- Implementar atualização incremental para **Perfis**
- Adicionar **webhooks** para atualizações automáticas
- Implementar **cache** inteligente
- Adicionar **métricas** de qualidade de dados

## 🚀 Como Começar

### 1️⃣ **Setup Inicial:**
```bash
cd src/core/functions/camara-Copia
npm install
```

### 2️⃣ **Configurar Firebase:**
- Colocar `serviceAccountKey.json` em `config/`
- Verificar configurações de conexão

### 3️⃣ **Testar Funcionalidades:**
```bash
# Testar parsing e lógica
npm run test:despesas:incremental
npm run test:discursos:incremental

# Testar com dados reais (poucos deputados)
npm run process:despesas:quick
npm run process:discursos:quick
```

### 4️⃣ **Produção:**
```bash
# Executar processamento completo
npm run process:despesas
npm run process:discursos

# Configurar execução periódica (cron)
# Sugestão: executar atualização a cada 2 dias
npm run process:despesas:atualizar
npm run process:discursos:atualizar
```

---

**Sistema desenvolvido com TypeScript + Node.js + Firebase Firestore** 🔥

**Status**: ✅ **Produção** - Pronto para uso em larga escala
