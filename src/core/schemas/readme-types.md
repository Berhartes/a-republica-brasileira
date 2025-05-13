# Tipos e Interfaces (Types)

Este diretório contém as definições de tipos e interfaces TypeScript usadas no projeto República Brasileira, especificamente para a integração com a API do Senado Federal e o Firebase.

## Estrutura de Arquivos

- `axios.ts` - Definições de tipos para a biblioteca Axios (requisições HTTP)
- `firebase-types.ts` - Tipos para representação de dados no Firebase
- `firebase-types2.ts` - Tipos adicionais para análises e dados no Firebase
- `index.ts` - Arquivo de exportação principal dos tipos
- `senado-api-responses.ts` - Interfaces detalhadas para respostas da API do Senado
- `senado-types.ts` - Tipos unificados para o sistema do Senado

## Principais Definições

### Senadores e Parlamentares

`SenadorDetalhado` e `FirebaseSenador` contêm as definições para armazenar informações completas sobre senadores, incluindo dados pessoais, votações, mandatos e comissões.

### Votações

`Votacao`, `Voto` e tipos relacionados definem a estrutura para registrar e analisar votações no Senado, incluindo resultados, votos individuais por senador e estatísticas.

### Matérias Legislativas

`Proposicao` e `FirebaseProposicao` definem a estrutura para matérias legislativas, incluindo projetos de lei, emendas e tramitações.

### Análises

Os tipos em `firebase-types2.ts` fornecem interfaces para armazenar análises, séries históricas e configurações de dashboard.

## Uso

Para usar estes tipos em seus arquivos TypeScript:

```typescript
// Importe tipos específicos
import { Senador, Votacao, ResultadoVoto } from '../types';

// Ou importe todos os tipos de um arquivo específico
import * as SenadoTypes from '../types/senado-types';
```

## Extensões

Para adicionar novos tipos ao sistema, recomenda-se:

1. Adicionar os tipos em seu arquivo específico (ex: `senado-types.ts`)
2. Exportá-los no arquivo `index.ts`
3. Documentar os novos tipos aqui no README

## Integração API-Firebase

Os tipos definem tanto as estruturas recebidas da API do Senado (`Raw.*`, `*Response`) quanto os formatos normalizados para armazenamento no Firebase (`Firebase*`), facilitando a transformação entre esses formatos.