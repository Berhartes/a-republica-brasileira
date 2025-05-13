# Estilos Compartilhados

Esta pasta contém estilos, temas e utilitários de estilização compartilhados para toda a aplicação.

## Estrutura

```
styles/
├── theme/           # Configurações de tema
│   ├── colors.ts    # Paleta de cores
│   ├── tokens.ts    # Design tokens
│   └── index.ts     # Exportações do tema
├── utils/           # Utilitários de estilização
└── index.css        # Estilos globais
```

## Convenções

- Nomes de pastas em kebab-case
- Nomes de arquivos em kebab-case
- Uso do TailwindCSS para estilização
- Tokens de design centralizados
- Exportações via index.ts em cada diretório

## Uso

```typescript
// Importando tema
import { theme } from '@/shared/styles/theme';

// Importando utilitários
import { twMerge } from '@/shared/styles/utils/tailwind-merge';

// CSS global é importado automaticamente em src/main.tsx
```

## Documentação

### Tema

O tema define:
- Paleta de cores
- Tipografia
- Espaçamentos
- Breakpoints
- Outros tokens de design

### Utilitários

Funções auxiliares para:
- Merge de classes Tailwind
- Manipulação de estilos
- Conversões de unidades

## Organização

- Manter tokens de design centralizados
- Seguir princípios do design system
- Documentar alterações no tema
- Evitar CSS global quando possível
