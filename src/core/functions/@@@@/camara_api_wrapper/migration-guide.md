# 🔄 Guia de Migração - Sistema ETL v2.0

**Migração completa do sistema ETL do Senado Federal para arquitetura modular**

---

## 📋 **Índice**
- [🎯 Visão Geral da Migração](#-visão-geral-da-migração)
- [🚀 O Que Mudou](#-o-que-mudou)
- [📦 Novos Processadores](#-novos-processadores)
- [💻 Comandos Atualizados](#-comandos-atualizados)
- [🔧 Configurações](#-configurações)
- [📁 Estrutura de Arquivos](#-estrutura-de-arquivos)
- [🧪 Como Testar](#-como-testar)
- [🐛 Solução de Problemas](#-solução-de-problemas)
- [📚 Exemplos Práticos](#-exemplos-práticos)

---

## 🎯 **Visão Geral da Migração**

### ✅ **O Que Foi Feito**

A refatoração transformou o sistema ETL monolítico em uma **arquitetura modular profissional**:

1. **🏗️ Arquitetura Unificada**: Template Method pattern para todos os processadores
2. **📊 CLI Consistente**: Interface de linha de comando padronizada
3. **🔧 Configuração Centralizada**: Sistema de configuração único
4. **🛡️ Validação Robusta**: Validações automáticas em todas as camadas
5. **📈 Monitoramento**: Logs, progresso e estatísticas detalhadas
6. **🎯 Multi-destino**: Suporte a Firestore, Emulator e PC
7. **📦 Modularidade**: Cada processador é independente e reutilizável

### 📊 **Resultados da Refatoração**

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| **Scripts Refatorados** | 13 antigos | 9 modernos | ✅ Consolidação |
| **Linhas de Código** | ~2000 duplicadas | ~1500 reutilizáveis | ✅ -25% |
| **Arquitetura** | Monolítica | Modular | ✅ Escalável |
| **CLI** | Inconsistente | Unificado | ✅ Padronizado |
| **Validações** | Dispersas | Centralizadas | ✅ Robustas |
| **Logs** | Básicos | Profissionais | ✅ Detalhados |
| **Configuração** | Hardcoded | Flexível | ✅ Configurável |

---

## 🚀 **O Que Mudou**

### 🔄 **Scripts Transformados**

#### ✅ **Scripts Totalmente Refatorados**
- `0processar_comissoes.ts` → `processar_comissoes.ts` ✨
- `0processar_liderancas.ts` → `processar_liderancas.ts` ✨
- `0processar_votacoes.ts` → `processar_votacoes.ts` ✨
- `processar_mesas.ts` → **Melhorado** ✨
- `processar_senadores.ts` → **Melhorado** ✨
- `processar_senadomateria.ts` → `processar_materias.ts` ✨

#### ✅ **Scripts Já Funcionais (Mantidos)**
- `processar_perfilsenadores.ts` ✅ (modelo perfeito)
- `processar_blocos.ts` ✅
- `processar_discursos.ts` ✅

### 🎯 **Novas Funcionalidades**

#### 🔧 **CLI Unificado**
- **15+ opções** padronizadas em todos os processadores
- **Atalhos inteligentes**: `--57` = `--legislatura 57`
- **Validações automáticas** de parâmetros
- **Help contextual** para cada processador

#### 🏗️ **Arquitetura ETL**
- **Classe base `ETLProcessor`** para todos os processadores
- **Template Method pattern** garantindo fluxo consistente
- **Interfaces TypeScript** bem definidas
- **Sistema de callbacks** para progresso

#### 📊 **Sistema de Monitoramento**
- **Logs estruturados** com níveis configuráveis
- **Progress bars** em tempo real
- **Estatísticas detalhadas** de cada etapa
- **Tratamento robusto** de erros

---

## 📦 **Novos Processadores**

### 🆕 **Processadores Criados**

| Processador | Arquivo | Status | Funcionalidades |
|-------------|---------|--------|-----------------|
| **ComissoesProcessor** | `comissoes.processor.ts` | ✅ | Comissões + composições |
| **LiderancasProcessor** | `liderancas.processor.ts` | ✅ | Lideranças + membros |
| **MesasProcessor** | `mesas.processor.ts` | ✅ | Mesas + composições |
| **SenadoresProcessor** | `senadores.processor.ts` | ✅ | Senadores + filtros |
| **MateriasProcessor** | `materias.processor.ts` | ✅ | Matérias + mandatos |
| **VotacoesProcessor** | `votacoes.processor.ts` | ✅ | Votações + validações |

### 🔧 **Características Comuns**

Todos os novos processadores implementam:
- ✅ **Validação de entrada** robusta
- ✅ **Extração otimizada** com retry
- ✅ **Transformação padronizada** de dados
- ✅ **Carregamento multi-destino** (Firestore/PC/Emulator)
- ✅ **Logs detalhados** e progress tracking
- ✅ **Estatísticas completas** de processamento

---

## 💻 **Comandos Atualizados**

### 🔄 **Mapeamento de Comandos**

#### **Antes vs Depois**

| Comando Antigo | Comando Novo | Melhorias |
|---------------|--------------|-----------|
| ❌ Scripts inconsistentes | `npm run senado:perfil` | ✅ CLI unificado |
| ❌ Sem validações | `npm run senado:comissoes` | ✅ Validações automáticas |
| ❌ Logs básicos | `npm run senado:liderancas` | ✅ Logs profissionais |
| ❌ Sem progresso | `npm run senado:mesas` | ✅ Progress bars |
| ❌ Configuração rígida | `npm run senado:senadores` | ✅ Opções flexíveis |
| ❌ Tratamento simples de erros | `npm run senado:materias` | ✅ Error handling robusto |
| ❌ Apenas Firestore | `npm run senado:votacoes` | ✅ Multi-destino |
| ❌ Sem filtros | `npm run senado:blocos` | ✅ Filtros avançados |
| ❌ Configuração hardcoded | `npm run senado:discursos` | ✅ Configuração dinâmica |

### 🎯 **Novos Padrões de Uso**

#### **Estrutura Universal**
```bash
npm run senado:<processador> -- [legislatura] [opções]
```

#### **Exemplos por Processador**

##### 🏛️ **Perfis de Senadores**
```bash
# Básico
npm run senado:perfil

# Avançado
npm run senado:perfil -- 57 --limite 10 --pc --verbose
```

##### 🏛️ **Comissões**
```bash
# Todas as comissões
npm run senado:comissoes

# Com filtros
npm run senado:comissoes -- --incluir-composicoes --tipo-comissao PERMANENTE
```

##### 👑 **Lideranças**
```bash
# Básico
npm run senado:liderancas

# Com membros
npm run senado:liderancas -- --incluir-membros --tipo-lideranca GOVERNO
```

##### 🗳️ **Votações**
```bash
# ⚠️ Requer legislatura!
npm run senado:votacoes -- 57

# Com filtros
npm run senado:votacoes -- 53 --senador 123 --limite 5
```

---

## 🔧 **Configurações**

### ⚙️ **Novo Sistema de Configuração**

#### **Arquivo Principal**: `config/etl.config.ts`
```typescript
export const etlConfig: ETLConfig = {
  senado: {
    concurrency: 3,
    maxRetries: 3,
    timeout: 30000,
    pauseBetweenRequests: 1000
  },
  firestore: {
    batchSize: 500,
    pauseBetweenBatches: 2000
  },
  logging: {
    level: 'info',
    colorize: true
  }
};
```

#### **Variáveis de Ambiente**: `.env`
```bash
# Firestore
GOOGLE_APPLICATION_CREDENTIALS=./config/serviceAccountKey.json
FIRESTORE_PROJECT_ID=seu-projeto

# Emulator (opcional)
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080

# Logs
LOG_LEVEL=info
LOG_COLORIZE=true
```

### 🎯 **Opções Universais**

Todas as funções agora suportam:

| Opção | Atalho | Descrição |
|-------|--------|-----------|
| `--legislatura <num>` | `--57` | Legislatura específica |
| `--limite <num>` | `-l` | Limitar registros |
| `--senador <código>` | `-s` | Senador específico |
| `--partido <sigla>` | `-p` | Filtrar por partido |
| `--uf <sigla>` | `-u` | Filtrar por UF |
| `--firestore` | | Firestore produção |
| `--emulator` | | Firestore emulator |
| `--pc` | | Salvar no PC |
| `--verbose` | `-v` | Logs detalhados |
| `--dry-run` | | Executar sem salvar |
| `--help` | `-h` | Mostrar ajuda |

---

## 📁 **Estrutura de Arquivos**

### 🗂️ **Nova Organização**

```
📁 scripts/
├── 🏛️ core/
│   └── etl-processor.ts         # ✨ Classe base unificada
├── 📊 types/
│   └── etl.types.ts            # ✨ Tipos centralizados
├── ⚙️ config/
│   ├── etl.config.ts           # ✨ Configuração principal
│   └── environment.config.ts    # ✨ Variáveis de ambiente
├── 🔧 utils/
│   ├── cli/
│   │   └── etl-cli.ts          # ✨ Parser CLI unificado
│   ├── logging/
│   │   └── logger.ts           # ✨ Sistema de logs
│   └── [outros utilitários]
├── 🎯 processors/
│   ├── perfil-senadores.processor.ts  ✅
│   ├── comissoes.processor.ts         ✨
│   ├── liderancas.processor.ts        ✨
│   ├── mesas.processor.ts             ✨
│   ├── senadores.processor.ts         ✨
│   ├── materias.processor.ts          ✨
│   ├── votacoes.processor.ts          ✨
│   ├── blocos.processor.ts            ✅
│   └── discursos.processor.ts         ✅
├── 🚀 initiators/
│   ├── processar_perfilsenadores.ts   ✅
│   ├── processar_comissoes.ts         ✨
│   ├── processar_liderancas.ts        ✨
│   ├── processar_mesas.ts             ✨
│   ├── processar_senadores.ts         ✨
│   ├── processar_materias.ts          ✨
│   ├── processar_votacoes.ts          ✨
│   ├── processar_blocos.ts            ✅
│   ├── processar_discursos.ts         ✅
│   └── [arquivos .bak dos antigos]
└── [outras pastas existentes]
```

### 📋 **Legenda**
- ✅ **Funcionando perfeitamente** (mantido como estava)
- ✨ **Novo/Refatorado** (criado ou totalmente melhorado)
- 🗂️ **Arquivos .bak** (versões antigas preservadas)

---

## 🧪 **Como Testar**

### 🔍 **1. Teste de Sistema**
```bash
# Testar instalação completa
npm run test-etl
```

### 🔍 **2. Teste Individual (Dry-Run)**
```bash
# Testar sem salvar dados
npm run senado:perfil -- --dry-run --limite 1 --verbose
npm run senado:comissoes -- --dry-run --limite 1 --verbose
npm run senado:liderancas -- --dry-run --verbose
```

### 🔍 **3. Teste com Dados Reais (PC)**
```bash
# Salvar no PC (seguro)
npm run senado:perfil -- --pc --limite 5
npm run senado:comissoes -- --pc --limite 3
npm run senado:senadores -- --pc --limite 10
```

### 🔍 **4. Teste com Emulator**
```bash
# Iniciar emulator
firebase emulators:start --only firestore

# Testar com emulator
npm run senado:perfil -- --emulator --limite 2
```

---

## 🐛 **Solução de Problemas**

### ❌ **Problema**: "ProcessingStatus is not defined"
**✅ Solução**: Já corrigido! Import adicionado em todos os processadores.

### ❌ **Problema**: "ETLCommandParser not found"
**✅ Solução**: Arquivos refatorados com imports corretos.

### ❌ **Problema**: "Config não carregada"
**✅ Solução**: Sistema de configuração centralizado implementado.

### ❌ **Problema**: Scripts antigos não funcionam
**✅ Solução**: Renomeados para `.bak`, use os novos comandos.

### ❌ **Problema**: Logs muito verbosos
**✅ Solução**: Configure `LOG_LEVEL=error` no `.env` ou remova `--verbose`.

### ❌ **Problema**: Firestore não conecta
**✅ Solução**: Configure `GOOGLE_APPLICATION_CREDENTIALS` no `.env`.

### 🔧 **Debug Geral**
```bash
# Ver opções disponíveis
npm run senado:perfil -- --help

# Logs detalhados
npm run senado:perfil -- --verbose --dry-run

# Testar configuração
npm run test-etl
```

---

## 📚 **Exemplos Práticos**

### 🎯 **Cenário 1: Desenvolver/Testar**
```bash
# 1. Testar sistema
npm run test-etl

# 2. Dry-run para ver o que aconteceria
npm run senado:perfil -- --dry-run --limite 1 --verbose

# 3. Executar com dados reais no PC
npm run senado:perfil -- --pc --limite 5 --verbose
```

### 🎯 **Cenário 2: Produção Controlada**
```bash
# 1. Dados específicos no emulator
npm run senado:comissoes -- --emulator --limite 3

# 2. Verificar resultados, depois produção
npm run senado:comissoes -- --firestore --limite 10
```

### 🎯 **Cenário 3: Análise de Legislatura Específica**
```bash
# Votações de legislatura específica
npm run senado:votacoes -- 57 --limite 5 --pc

# Matérias de senador específico
npm run senado:materias -- --senador 5012 --pc

# Perfis de senadores de partido específico
npm run senado:senadores -- --partido PT --pc
```

### 🎯 **Cenário 4: Processamento em Lote**
```bash
# Perfis completos
npm run senado:perfil -- --firestore --limite 50

# Comissões com composições
npm run senado:comissoes -- --incluir-composicoes --firestore

# Lideranças com membros
npm run senado:liderancas -- --incluir-membros --firestore
```

---

## ✅ **Checklist de Migração**

### 🔍 **Antes de Usar**
- [ ] Executar `npm run test-etl`
- [ ] Configurar `.env` com credenciais
- [ ] Testar com `--dry-run` primeiro
- [ ] Verificar se Firestore/Emulator está funcionando

### 🚀 **Durante o Uso**
- [ ] Usar `--verbose` para debug
- [ ] Começar com `--limite` pequeno
- [ ] Monitorar logs e progresso
- [ ] Verificar estatísticas finais

### ✅ **Após o Uso**
- [ ] Verificar arquivos gerados (se `--pc`)
- [ ] Conferir dados no Firestore
- [ ] Revisar logs de erro
- [ ] Documentar problemas encontrados

---

## 🎉 **Conclusão da Migração**

### 🏆 **Benefícios Alcançados**

1. **🔄 Arquitetura Unificada**: Todos os processadores seguem o mesmo padrão
2. **📊 CLI Consistente**: Interface padronizada e intuitiva
3. **🛡️ Validação Robusta**: Validações automáticas e tratamento de erros
4. **📈 Monitoramento**: Logs profissionais e estatísticas detalhadas
5. **🎯 Flexibilidade**: Múltiplos destinos e configurações
6. **🧪 Testabilidade**: Modo dry-run e testes automatizados
7. **📚 Documentação**: Guias completos e exemplos práticos

### 🚀 **Sistema Pronto para Produção**

O **Sistema ETL do Senado Federal v2.0** está totalmente refatorado e pronto para uso profissional. A migração transformou um conjunto de scripts dispersos em uma solução robusta, escalável e bem documentada.

**✨ Próximos passos:**
1. Execute os testes: `npm run test-etl`
2. Configure suas credenciais no `.env`
3. Comece com processadores simples: `npm run senado:senadores -- --pc --limite 5`
4. Explore todas as funcionalidades disponíveis

---

*Guia de Migração criado em: $(date)*  
*Versão: 2.0*  
*Sistema ETL do Senado Federal - Refatoração Completa*
