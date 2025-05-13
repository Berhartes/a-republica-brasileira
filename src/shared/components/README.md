# Componentes Compartilhados

Esta pasta contém componentes React reutilizáveis que são compartilhados por toda a aplicação.

## Estrutura

```
components/
├── ui/              # Componentes UI básicos (botões, inputs, etc)
└── form/           # Sistema de formulários
```

## Convenções

- Nomes de pastas em kebab-case (ex: loading-spinner)
- Nomes de componentes em PascalCase (ex: Button.tsx)
- Cada componente deve ter seu próprio diretório
- Exportações via index.ts em cada diretório

## Uso

Importe componentes usando o caminho completo:

```typescript
import { Button } from '@/shared/components/ui/button';
import { Form } from '@/shared/components/form';
```

## Documentação

Cada componente deve ter:
- Tipos/interfaces bem definidos
- Props documentadas
- Exemplo básico de uso
- Story no Storybook (quando aplicável)
