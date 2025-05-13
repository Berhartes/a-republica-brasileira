# Utilitários Compartilhados

Este diretório contém utilitários compartilhados que podem ser usados em todo o projeto.

## Estrutura

```
utils/
├── data/              # Manipulação de dados
│   ├── ensure-array.ts      # Garantia de array
│   ├── nested-property.ts   # Acesso a propriedades aninhadas
│   └── transformers.ts      # Transformadores de dados
├── date/              # Manipulação de datas
│   └── date-formatter.ts    # Formatação de datas
├── events/            # Manipulação de eventos
│   ├── event-handlers.ts    # Manipuladores de eventos
│   └── type-guards.ts       # Type guards para eventos
├── http/              # Comunicação HTTP
│   ├── content-type.ts      # Tipo de conteúdo
│   └── response-parser.ts   # Parser de resposta
├── strings/           # Manipulação de strings
│   └── string-utils.ts      # Utilidades para strings
├── theme/             # Temas e estilos
│   └── theme-utils.ts       # Utilidades de tema
└── index.ts           # Exportações
```

## Padrões

1. **Organização**
   - Utilitários agrupados por função
   - Um arquivo por responsabilidade
   - Nomes descritivos

2. **Implementação**
   - Funções puras quando possível
   - Tipagem forte com TypeScript + Zod
   - Documentação JSDoc completa

3. **Testes**
   - Testes unitários para cada utilitário
   - Casos de borda cobertos
   - Documentação de casos de teste

4. **Performance**
   - Funções otimizadas
   - Memoização quando apropriado
   - Bundle splitting suportado

## Uso

```typescript
// Importar utilitários individuais
import { formatDate } from '@/shared/utils/date/date-formatter';
import { ensureArray } from '@/shared/utils/data/ensure-array';

// Ou importar via barrel exports
import { formatDate, ensureArray } from '@/shared/utils';

// Exemplo de uso
const date = formatDate(new Date(), DateFormat.BR);
const items = ensureArray(possibleArray);
```

## Novos Utilitários

Ao criar novos utilitários, siga estas diretrizes:

1. **Localização**: Coloque-o na pasta adequada de acordo com sua função
2. **Validação**: Use Zod para validar parâmetros e opções
3. **Tipagem**: Forneça tipagem TypeScript completa
4. **Documentação**: Documente com JSDoc, incluindo exemplos
5. **Exportação**: Adicione-o ao arquivo index.ts da sua pasta
6. **Testes**: Crie testes unitários abrangentes
