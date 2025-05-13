# Guia Detalhado de Correções do Sistema ETL

## Índice
1. [Contexto e Visão Geral](#contexto-e-visão-geral)
2. [Configuração do TypeScript](#configuração-do-typescript)
3. [Correções por Tipo de Erro](#correções-por-tipo-de-erro)
4. [Passo a Passo Detalhado](#passo-a-passo-detalhado)
5. [Verificação e Testes](#verificação-e-testes)

## Contexto e Visão Geral

### Problema Atual
O sistema ETL está apresentando erros de compilação TypeScript devido à configuração `moduleResolution: "NodeNext"`. Esta configuração requer extensões explícitas em importações relativas, além de outros ajustes de tipagem e estrutura.

### Por que Manter NodeNext?
- Padrão moderno do Node.js
- Melhor compatibilidade com ESM
- Mais clara sobre o que está sendo importado
- Recomendada para Firebase Functions
- Evita problemas de ambiguidade nas importações

## Configuração do TypeScript

### tsconfig.json Atual
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "lib",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "allowJs": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": false,
    "declaration": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

## Correções por Tipo de Erro

### 1. Erros de Importação
#### Problema
```typescript
import api from '../utils/api';
import endpoints from '../config/endpoints';
import { logger } from '../utils/logger';
```

#### Solução
```typescript
import api from '../utils/api.js';
import endpoints from '../config/endpoints.js';
import { logger } from '../utils/logger.js';
```

### 2. Erros de Exportação do Logger
#### Problema
```typescript
import logger from '../utils/logger.js';
```

#### Solução
```typescript
import { logger } from '../utils/logger.js';
```

### 3. Erros de Tipagem
#### Problema
```typescript
.map(cargo => {
  // código
});
```

#### Solução
```typescript
.map((cargo: CargoType) => {
  // código
});
```

### 4. Erros do Firebase Functions
#### Problema
```typescript
import { Request, Response } from 'firebase-functions';
await blocosFunctions.processarBlocos.run();
```

#### Solução
```typescript
import { Request, Response } from 'firebase-functions/v2';
await blocosFunctions.processarBlocos.run({
  scheduleTime: new Date(),
  retry: {}
});
```

## Passo a Passo Detalhado

### Etapa 1: Correção das Importações

#### 1.1 Arquivos em src/extractors/
| Arquivo | Importações a Corrigir |
|---------|------------------------|
| blocos.ts | '../utils/api.js', '../config/endpoints.js', '../utils/logger.js' |
| comissoes.ts | '../utils/api.js', '../config/endpoints.js', '../utils/logger.js' |
| dadosAtuais.ts | '../utils/api.js', '../utils/logger.js' |
| legislatura.ts | '../utils/api.js', '../utils/logger.js' |
| liderancas.ts | '../utils/api.js', '../config/endpoints.js', '../utils/logger.js' |
| listaLegislaturas.ts | '../utils/api.js', '../utils/logger.js' |
| mesas.ts | '../utils/api.js', '../config/endpoints.js', '../utils/logger.js' |
| partidos.ts | '../utils/api.js', '../config/endpoints.js', '../utils/logger.js' |
| perfilsenadores.ts | '../utils/api.js', '../utils/logger.js', '../config/endpoints.js', '../utils/errors.js' |
| senadoresAtuais.ts | '../utils/api.js', '../utils/logger.js', '../utils/errors.js', '../config/endpoints.js' |

#### 1.2 Arquivos em src/functions/
| Arquivo | Importações a Corrigir |
|---------|------------------------|
| blocos.ts | '../config/firebase.js', '../utils/logger.js', '../utils/errors.js', '../utils/auth.js', '../utils/changes.js', '../extractors/blocos.js', '../transformers/blocos.js', '../loaders/storage.js' |
| comissoes.ts | '../config/firebase.js', '../utils/logger.js', '../utils/json-helper.js', '../utils/errors.js', '../utils/auth.js', '../extractors/comissoes.js', '../transformers/comissoes.js', '../loaders/storage.js' |
| dadosAtuais.ts | '../config/firebase.js', '../utils/logger.js', '../utils/errors.js', '../utils/auth.js', '../utils/changes.js', '../extractors/dadosAtuais.js', '../loaders/storage.js' |
| dadosHistoricos.ts | '../config/firebase.js', '../utils/logger.js', '../utils/errors.js', '../utils/auth.js', '../extractors/perfilsenadores.js', '../transformers/perfilsenadores.js', '../loaders/storage.js' |
| estrutura.ts | '../config/firebase.js', '../utils/logger.js', '../utils/errors.js', '../utils/auth.js', '../extractors/listaLegislaturas.js' |

### Etapa 2: Correção do Logger

#### 2.1 Arquivo src/utils/logger.ts
```typescript
// Antes
const logger = pino({
  // configurações
});

// Depois
const logger = pino.default({
  // configurações
});

export { logger };
```

### Etapa 3: Correção de Tipagens

#### 3.1 Em src/transformers/mesas.ts
```typescript
// Antes
mesa.cargos = cargosArray.map(cargo => {
  // código
});

// Depois
interface CargoType {
  id: number;
  nome: string;
  // outras propriedades necessárias
}

mesa.cargos = cargosArray.map((cargo: CargoType) => {
  // código
});
```

### Etapa 4: Correção das Firebase Functions

#### 4.1 Atualização das Importações
Em todos os arquivos que usam Firebase Functions:
```typescript
// Antes
import { Request, Response } from 'firebase-functions';

// Depois
import { Request, Response } from 'firebase-functions/v2';
import { ScheduledEvent } from 'firebase-functions/v2/scheduler';
```

#### 4.2 Correção das Chamadas run()
```typescript
// Antes
await blocosFunctions.processarBlocos.run();

// Depois
await blocosFunctions.processarBlocos.run({
  scheduleTime: new Date(),
  retry: {},
  data: {} // se necessário
} as ScheduledEvent);
```

### Etapa 5: Implementação de Métodos Faltantes

#### 5.1 Em src/extractors/legislatura.ts
```typescript
export const extractLegislaturaAtual = async (): Promise<LegislaturaData> => {
  try {
    // implementação
    return {
      // dados da legislatura
    };
  } catch (error) {
    logger.error('Erro ao extrair legislatura atual:', error);
    throw error;
  }
};
```

#### 5.2 Em src/transformers/liderancas.ts
```typescript
export const transformLiderancas = (data: ExtractedData): TransformedData => {
  try {
    // implementação
    return {
      // dados transformados
    };
  } catch (error) {
    logger.error('Erro ao transformar lideranças:', error);
    throw error;
  }
};
```

## Verificação e Testes

### 1. Verificação de Sintaxe
Após cada etapa de correção, execute:
```bash
pnpm run build
```

### 2. Testes Unitários (se existirem)
```bash
pnpm test
```

### 3. Verificação de Funcionalidade
- Testar cada função ETL individualmente
- Verificar logs de execução
- Confirmar salvamento correto no Firestore

### 4. Ordem de Execução Recomendada

1. Começar corrigindo o logger (src/utils/logger.ts)
2. Corrigir as importações em utils/
3. Corrigir as importações em extractors/
4. Corrigir as importações em transformers/
5. Corrigir as importações em functions/
6. Implementar as tipagens faltantes
7. Corrigir as Firebase Functions
8. Implementar os métodos faltantes
9. Testar cada componente

### 5. Verificações Pós-Correção

- [ ] Todas as importações têm extensão .js
- [ ] Logger está exportado e importado corretamente
- [ ] Todas as tipagens estão explícitas
- [ ] Firebase Functions estão usando v2
- [ ] Todos os métodos necessários estão implementados
- [ ] Build compila sem erros
- [ ] Testes passam (se existirem)
- [ ] Funções executam corretamente

## Possíveis Problemas e Soluções

### 1. Erro de Módulo não Encontrado
Se após adicionar .js nas importações o TypeScript ainda não encontrar os módulos:
- Verificar se o arquivo realmente existe no caminho especificado
- Confirmar que o arquivo está sendo compilado para JS
- Verificar se o caminho está correto em relação ao baseUrl

### 2. Erro no Pino Logger
Se o pino.default não funcionar:
```typescript
import pino from 'pino';
const logger = pino({
  // configurações
}) as pino.Logger;
```

### 3. Erros de Tipo no Firebase Functions
Se houver problemas com tipos do Firebase:
```typescript
import { https } from 'firebase-functions/v2';
type HttpsFunction = https.HttpsFunction;
type HttpsRequest = https.Request;
type HttpsResponse = https.Response;
```

## Conclusão

Após seguir todos estes passos, o sistema ETL deverá estar funcionando corretamente com:
- Importações ESM compatíveis
- Tipagem adequada
- Firebase Functions v2
- Logger configurado corretamente
- Todos os métodos necessários implementados

Lembre-se de fazer commits frequentes e testar cada alteração antes de prosseguir para a próxima etapa.
