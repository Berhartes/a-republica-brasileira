# Estrutura do Código Fonte

Este diretório contém o código fonte do projeto A República Brasileira, organizado seguindo princípios de Domain-Driven Design (DDD).

## Estrutura Principal

```
src/
├── domains/           # Domínios de negócio
│   ├── congresso-nacional/  # Domínio do Congresso Nacional
│   │   ├── senado/         # Subdomínio do Senado
│   │   └── camara/         # Subdomínio da Câmara
│   └── usuario/            # Domínio do usuário
├── core/             # Funcionalidades centrais
│   ├── monitoring/   # Monitoramento e analytics
│   ├── contexts/     # Contextos globais
│   └── schemas/      # Schemas compartilhados
├── shared/           # Código compartilhado
│   ├── components/   # Componentes reutilizáveis
│   ├── hooks/        # Hooks genéricos
│   └── utils/        # Utilitários comuns
└── pages/           # Páginas da aplicação
```

## Organização por Domínio

Cada domínio segue a estrutura:

```
dominio/
├── components/   # Componentes específicos
├── hooks/        # Hooks customizados
├── services/     # Serviços e APIs
└── types/        # Tipos e interfaces
```

## Padrões de Código

### Importações
```typescript
// Importar de domínios
import { SenadorCard } from '@/domains/congresso-nacional/senado';
import { DeputadoCard } from '@/domains/congresso-nacional/camara';

// Importar código compartilhado
import { Button } from '@/shared/components';
import { useAuth } from '@/shared/hooks';

// Importar funcionalidades core
import { logger } from '@/core/monitoring';
```

### Testes
- Testes junto aos componentes
- Testes de integração em `__tests__`
- Testes E2E separados

### Componentes
- Um componente por arquivo
- Styles junto ao componente
- Props tipadas com TypeScript

## Boas Práticas

1. **Organização**
   - Código relacionado junto
   - Estrutura domain-driven
   - Barrel exports

2. **Performance**
   - Code splitting
   - Lazy loading
   - Memoização

3. **Manutenção**
   - Documentação clara
   - Testes abrangentes
   - Código limpo

4. **Tipagem**
   - TypeScript strict
   - Interfaces bem definidas
   - Zod schemas
