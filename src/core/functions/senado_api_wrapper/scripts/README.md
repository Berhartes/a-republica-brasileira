# Sistema ETL Modular - Senado Federal

## 📋 Visão Geral

Sistema ETL (Extract, Transform, Load) profissional e modular para processamento de dados do Senado Federal brasileiro. O sistema foi projetado com arquitetura limpa, reutilização de código e facilidade de manutenção.

## 🏗️ Arquitetura

### Estrutura de Diretórios

```
scripts/
├── config/                     # Configurações centralizadas
│   └── etl.config.ts          # Configuração principal do sistema
├── types/                      # Tipos TypeScript
│   └── etl.types.ts           # Interfaces e tipos do sistema
├── core/                       # Core do sistema
│   └── etl-processor.ts       # Processador base abstrato
├── processors/                 # Processadores específicos
│   └── perfil-senadores.processor.ts
├── utils/                      # Utilitários
│   ├── cli/
│   │   └── etl-cli.ts         # Parser de linha de comando
│   ├── api.ts                 # Comunicação com API
│   ├── common.ts              # Funções comuns
│   ├── date.ts                # Manipulação de datas
│   ├── logging.ts             # Sistema de logs
│   └── storage.ts             # Integração com Firestore
├── extracao/                   # Módulos de extração
├── transformacao/              # Módulos de transformação
├── carregamento/               # Módulos de carregamento
└── initiators/                 # Scripts executáveis
```

### Componentes Principais

#### 1. **Configuração Centralizada** (`config/etl.config.ts`)
- Configurações do sistema em um único local
- Suporte a variáveis de ambiente
- Validação automática de configurações

#### 2. **Tipos Unificados** (`types/etl.types.ts`)
- Interfaces TypeScript para todo o sistema
- Garante type safety e consistência
- Documentação inline dos tipos

#### 3. **Processador Base** (`core/etl-processor.ts`)
- Implementa o padrão Template Method
- Fluxo ETL padronizado
- Métricas e logging automáticos
- Callbacks de progresso

#### 4. **Parser CLI Unificado** (`utils/cli/etl-cli.ts`)
- Parsing profissional de argumentos
- Validações automáticas
- Mensagens de ajuda padronizadas
- Suporte a atalhos e valores padrão

## 🚀 Uso

### Comandos Disponíveis

```bash
# Processar perfis de senadores
npm run senado:perfil                       # Legislatura atual
npm run senado:perfil -- 57                 # Legislatura específica
npm run senado:perfil -- --limite 10        # Com limite
npm run senado:perfil -- --pc               # Salvar localmente
npm run senado:perfil -- --emulator         # Usar emulador
npm run senado:perfil -- --verbose          # Logs detalhados

# Outros processadores
npm run senado:discursos
npm run senado:blocos
npm run senado:comissoes
npm run senado:liderancas
npm run senado:votacoes

# Processar todos
npm run senado:all
```

### Opções Comuns

| Opção | Descrição | Exemplo |
|-------|-----------|---------|
| `[legislatura]` | Número da legislatura | `57` |
| `--limite <n>` | Limitar processamento | `--limite 10` |
| `--senador <codigo>` | Processar senador específico | `--senador 12345` |
| `--firestore` | Salvar no Firestore (padrão) | `--firestore` |
| `--emulator` | Usar Firestore Emulator | `--emulator` |
| `--pc` | Salvar localmente | `--pc` |
| `--verbose` | Logs detalhados | `--verbose` |
| `--dry-run` | Simular execução | `--dry-run` |
| `--force` | Forçar atualização | `--force` |
| `--partido <sigla>` | Filtrar por partido | `--partido PT` |
| `--uf <sigla>` | Filtrar por estado | `--uf SP` |
| `--data-inicio` | Data inicial | `--data-inicio 2024-01-01` |
| `--data-fim` | Data final | `--data-fim 2024-12-31` |
| `--help` | Exibir ajuda | `--help` |

### Atalhos de Legislatura

```bash
npm run senado:perfil -- --57    # Atalho para legislatura 57
npm run senado:perfil -- --58    # Atalho para legislatura 58
```

## 📦 Criando Novos Processadores

### 1. Criar o Processador

```typescript
// processors/meu-processador.processor.ts
import { ETLProcessor } from '../core/etl-processor';
import { ValidationResult } from '../types/etl.types';

interface ExtractedData {
  // Estrutura dos dados extraídos
}

interface TransformedData {
  // Estrutura dos dados transformados
}

export class MeuProcessador extends ETLProcessor<ExtractedData, TransformedData> {
  protected getProcessName(): string {
    return 'Meu Processador';
  }

  async validate(): Promise<ValidationResult> {
    // Implementar validações
    return { valido: true, erros: [], avisos: [] };
  }

  async extract(): Promise<ExtractedData> {
    // Implementar extração
  }

  async transform(data: ExtractedData): Promise<TransformedData> {
    // Implementar transformação
  }

  async load(data: TransformedData): Promise<any> {
    // Implementar carregamento
  }
}
```

### 2. Criar o Script Initiator

```typescript
// initiators/processar_meu_processador.ts
import { ETLCommandParser } from '../utils/cli/etl-cli';
import { MeuProcessador } from '../processors/meu-processador.processor';
import { logger } from '../utils/logging';

async function main(): Promise<void> {
  const cli = new ETLCommandParser(
    'meu:processador',
    'Descrição do meu processador'
  );

  // Adicionar opções customizadas se necessário
  cli.addCustomOption('--minha-opcao', (valor) => parseInt(valor));

  const options = cli.parse();
  const processor = new MeuProcessador(options);
  const resultado = await processor.process();

  logger.info('Processamento concluído!', resultado);
  process.exit(0);
}

if (require.main === module) {
  main();
}
```

### 3. Adicionar Script ao package.json

```json
{
  "scripts": {
    "meu:processador": "npx ts-node -P tsconfig.scripts.json src/.../processar_meu_processador.ts"
  }
}
```

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# API do Senado
SENADO_CONCURRENCY=3              # Requisições simultâneas
SENADO_MAX_RETRIES=5              # Tentativas máximas
SENADO_TIMEOUT=30000              # Timeout em ms
SENADO_PAUSE_BETWEEN_REQUESTS=3000 # Pausa entre requisições

# Firestore
FIRESTORE_BATCH_SIZE=10           # Tamanho do batch
FIRESTORE_PAUSE_BETWEEN_BATCHES=500 # Pausa entre batches
FIRESTORE_EMULATOR_HOST=localhost:8080 # Host do emulador

# Exportação
EXPORT_BASE_DIR=dados_extraidos   # Diretório base
EXPORT_FORMATS=json               # Formatos (json,csv)
EXPORT_COMPRIMIR=false            # Comprimir arquivos

# Logging
LOG_LEVEL=info                    # Nível de log
LOG_TIMESTAMP=true                # Incluir timestamp
```

## 📊 Métricas e Monitoramento

### Métricas Automáticas

- ✅ Total de itens processados
- ❌ Total de falhas
- ⚠️ Total de avisos
- ⏱️ Tempo de processamento
- 📥 Tempo de extração
- 🔄 Tempo de transformação
- 📤 Tempo de carregamento

### Eventos de Progresso

```typescript
processor.onProgress((event) => {
  console.log(`${event.progresso}% - ${event.mensagem}`);
});
```

## 🛡️ Tratamento de Erros

- Validação prévia de opções
- Retry automático com backoff exponencial
- Logs detalhados de erros
- Fallback para dados parciais
- Relatório de erros no resultado final

## 🎯 Boas Práticas

1. **Modularização**: Cada etapa ETL em seu próprio método
2. **Tipagem Forte**: Usar interfaces TypeScript
3. **Logs Informativos**: Registrar cada etapa importante
4. **Validação Prévia**: Validar antes de processar
5. **Tratamento de Erros**: Nunca deixar erros não tratados
6. **Configuração Externa**: Usar variáveis de ambiente
7. **Documentação**: Documentar cada método e parâmetro

## 📈 Performance

- Processamento em lotes configurável
- Concorrência limitada para não sobrecarregar API
- Pausas entre requisições
- Cache de resultados (quando aplicável)
- Commit em batches no Firestore

## 🔍 Debug e Troubleshooting

```bash
# Modo verbose para logs detalhados
npm run senado:perfil -- --verbose

# Modo dry-run para testar sem salvar
npm run senado:perfil -- --dry-run

# Usar emulador para testes
npm run senado:perfil -- --emulator

# Limitar processamento para debug
npm run senado:perfil -- --limite 1 --verbose
```

## 📝 Exemplos de Uso

### Processar Senadores de SP da Legislatura 57

```bash
npm run senado:perfil -- 57 --uf SP --firestore
```

### Processar Apenas Senadores do PT com Limite

```bash
npm run senado:perfil -- --partido PT --limite 5 --pc
```

### Processar com Período Específico

```bash
npm run senado:discursos -- --data-inicio 2024-01-01 --data-fim 2024-06-30
```

### Modo Debug Completo

```bash
npm run senado:perfil -- --limite 1 --verbose --dry-run
```

## 🤝 Contribuindo

1. Sempre usar o processador base `ETLProcessor`
2. Seguir a estrutura de diretórios estabelecida
3. Adicionar tipos em `etl.types.ts`
4. Documentar novos parâmetros CLI
5. Incluir testes unitários
6. Atualizar esta documentação

## 📄 Licença

[Sua licença aqui]
