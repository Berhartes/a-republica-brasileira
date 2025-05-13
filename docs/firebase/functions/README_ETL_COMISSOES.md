# ETL de Comissões do Senado Federal

## Visão Geral

O módulo ETL de Comissões é responsável por extrair, transformar e carregar dados sobre comissões do Senado Federal e Congresso Nacional brasileiro para o Firestore. São tratados dados sobre comissões permanentes, temporárias, CPIs e comissões mistas, incluindo seus membros, cargos e outras informações relevantes.

## Componentes Principais

### 1. Modelo de Dados

Os principais modelos de dados estão definidos em `/src/domains/congresso/senado/models/comissao.ts`:

- `ComissaoBasica`: Informações básicas de uma comissão
- `MembroComissao`: Membro de uma comissão
- `ComposicaoComissao`: Composição completa de uma comissão
- `DetalhesComissao`: Detalhes adicionais de uma comissão
- `IndicesComissao`: Índices para consulta rápida de comissões

### 2. Entidades

A entidade principal está definida em `/src/domains/congresso/senado/entities/comissao.ts`:

- `Comissao`: Classe que representa uma comissão com seus dados e métodos

### 3. Componentes ETL

- **Extrator** (`/src/etl/extractors/comissao-extractor.ts`): Responsável por extrair dados de comissões da API do Senado
  - `extract()`: Extrai todos os dados de comissões
  - `extractComissoesSenado(tipo)`: Extrai comissões do Senado por tipo
  - `extractComissoesCongresso(tipo)`: Extrai comissões do Congresso por tipo
  - `extractComissoesMistas()`: Extrai comissões mistas
  - `extractDetalhesComissao(codigo)`: Extrai detalhes de uma comissão específica
  - `extractComposicaoComissao(codigo, origem)`: Extrai composição de uma comissão

- **Transformador** (`/src/etl/transformers/comissao-transformer.ts`): Transforma os dados brutos em formato adequado
  - `transform()`: Transforma todos os dados de comissões
  - `transformComissoesSenado()`: Transforma comissões do Senado
  - `transformComissoesCongresso()`: Transforma comissões do Congresso
  - `transformTiposComissoes()`: Transforma tipos de comissões
  - `extrairDetalhesComissao()`: Extrai detalhes de comissões
  - `extrairComposicaoComissao()`: Extrai composição de comissões
  - `criarIndices()`: Cria índices para consulta rápida

- **Carregador** (`/src/etl/loaders/comissao-loader.ts`): Carrega os dados no Firestore
  - `load()`: Carrega os dados transformados no Firestore
  - `detectMudancas()`: Detecta mudanças em relação aos dados existentes
  - `detectarMudancasMembros()`: Detecta mudanças específicas em membros

- **Processador** (`/src/etl/processors/comissao-processor.ts`): Orquestra o processo ETL completo
  - `process()`: Executa o fluxo completo de ETL
  - `processComissao()`: Processa uma comissão específica
  - `processComissoesPorTipo()`: Processa comissões de um tipo específico

### 4. Cloud Functions

As funções expostas estão definidas em `/src/functions/comissao-functions.ts`:

- `processarComissoes`: Função agendada que executa diariamente
- `triggerComissoes`: Endpoint HTTP para processamento manual
- `triggerComissaoEspecifica`: Endpoint HTTP para processar uma comissão específica
- `triggerComissoesPorTipo`: Endpoint HTTP para processar comissões por tipo

## Estrutura de Dados no Firestore

Os dados são armazenados nas seguintes coleções:

```
congressoNacional/
├── senadoFederal/
│   ├── legislaturas/{legislatura}/
│   │   └── comissoes/
│   │       ├── senado/
│   │       │   ├── permanente/{codigo} - Comissões permanentes
│   │       │   ├── cpi/{codigo} - CPIs
│   │       │   ├── temporaria/{codigo} - Comissões temporárias
│   │       │   └── especiais/{codigo} - Comissões especiais
│   │       └── congresso/
│   │           ├── cpmi/{codigo} - CPMIs
│   │           ├── permanente/{codigo} - Comissões permanentes
│   │           ├── representacao/{codigo} - Comissões de representação
│   │           ├── mpv/{codigo} - Comissões de MPs
│   │           └── mista/{codigo} - Outras comissões mistas
│   ├── atual/
│   │   └── comissoes/
│   │       └── dados/{id} - Dados atuais (acesso rápido)
│   ├── metadata/
│   │   ├── comissoes - Metadados de comissões
│   │   └── tiposComissoes - Tipos de comissões
│   ├── indices/
│   │   ├── comissoes - Índice de comissões por código
│   │   ├── parlamentaresComissoes - Índice de comissões por parlamentar
│   │   └── parlamentaresComissoesChunks - Referência a chunks (se índice grande)
│   └── mudancas/
│       └── comissoes_{timestamp} - Registro de mudanças
```

## Índices

São criados dois tipos principais de índices:

1. **Por Código**: Permite buscar rapidamente uma comissão pelo seu código
   - Estrutura: `{ codigo -> { tipo, casa, sigla, nome } }`

2. **Por Parlamentar**: Permite buscar rapidamente todas as comissões de um parlamentar
   - Estrutura: `{ codigoParlamentar -> { nome, partido, uf, comissoes[] } }`

## Agendamento

A função `processarComissoes` é executada diariamente às 03:00 (horário de Brasília).

## Uso

### Processamento Completo de Comissões

```typescript
import { comissaoProcessor } from './etl/processors/comissao-processor';

// Executa o processamento completo
await comissaoProcessor.process();
```

### Processamento de Comissão Específica

```typescript
import { comissaoProcessor } from './etl/processors/comissao-processor';

// Processa uma comissão específica
await comissaoProcessor.processComissao('357', 'senado');
```

### Processamento de Comissões por Tipo

```typescript
import { comissaoProcessor } from './etl/processors/comissao-processor';

// Processa comissões de um tipo específico
await comissaoProcessor.processComissoesPorTipo('permanente', 'senado');
```

## Detecção de Mudanças

O sistema detecta automaticamente mudanças na composição das comissões, registrando:

1. Novos membros adicionados
2. Membros removidos
3. Alterações de cargo ou titularidade

As mudanças são armazenadas na coleção `mudancas` para posterior análise.
