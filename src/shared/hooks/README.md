# Hooks Compartilhados

Esta pasta contém hooks React reutilizáveis que podem ser usados em toda a aplicação.

## Estrutura

```
hooks/
├── use-dark-mode/    # Hook para controle de tema escuro
└── use-pagination/   # Hook para paginação
```

## Convenções

- Nomes de pastas em kebab-case (ex: use-dark-mode)
- Nomes de hooks em camelCase começando com "use" (ex: useDarkMode)
- Cada hook deve ter seu próprio diretório
- Exportações via index.ts em cada diretório

## Uso

Importe hooks usando o caminho completo:

```typescript
import { useDarkMode } from '@/shared/hooks/use-dark-mode';
import { usePagination } from '@/shared/hooks/use-pagination';
```

## Documentação

Cada hook deve ter:
- Tipos/interfaces bem definidos
- Parâmetros documentados
- Exemplo básico de uso
- Testes unitários
