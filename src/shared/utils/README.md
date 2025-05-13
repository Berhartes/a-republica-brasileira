# Utilitários Compartilhados

Esta pasta contém funções utilitárias e helpers que podem ser usados em toda a aplicação.

## Estrutura

```
utils/
├── data/            # Transformadores e manipuladores de dados
├── date/            # Formatação e manipulação de datas
├── events/          # Manipuladores de eventos
├── http/            # Utilitários relacionados a HTTP
├── strings/         # Manipulação de strings
└── theme/           # Utilitários relacionados ao tema
```

## Convenções

- Nomes de pastas em kebab-case
- Nomes de arquivos em kebab-case
- Funções em camelCase
- Exportações via index.ts em cada diretório

## Uso

Importe utilitários usando o caminho completo:

```typescript
import { formatDate } from '@/shared/utils/date/date-formatter';
import { transformData } from '@/shared/utils/data/data-transformers';
```

## Documentação

Cada utilitário deve ter:
- Tipos/interfaces bem definidos
- Parâmetros documentados
- Exemplo básico de uso
- Testes unitários

## Organização

- Funções relacionadas devem ser agrupadas em diretórios temáticos
- Cada diretório deve ter seu próprio index.ts para exportações
- Evitar dependências circulares entre utilitários
