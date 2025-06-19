# Estrutura do Código Fonte

Este diretório contém o código fonte do projeto A República Brasileira, organizado seguindo princípios de Domain-Driven Design (DDD).

## Estrutura Principal

```
src/
├── app/              # Orquestrador da aplicação frontend (inicialização, layouts, providers, contextos globais, monitoramento)
├── domains/           # Domínios de negócio
│   ├── congresso-nacional/  # Domínio do Congresso Nacional
│   │   ├── senado/         # Subdomínio do Senado
│   │   └── camara/         # Subdomínio da Câmara
│   └── usuario/            # Domínio do usuário
├── core/             # Funcionalidades centrais (ATENÇÃO: Esta pasta está sendo revisada/remodelada. Funcionalidades como monitoring, contexts e schemas estão sendo movidas para app/ ou shared/ conforme apropriado)
│   ├── monitoring/   # (Movido para app/monitoring)
│   ├── contexts/     # (Movido para app/contexts ou shared/contexts)
│   └── schemas/      # (Movido para app/config/schemas ou shared/schemas)
├── shared/           # Código compartilhado
│   ├── components/   # Componentes reutilizáveis
│   ├── hooks/        # Hooks genéricos
│   ├── utils/        # Utilitários comuns
│   ├── constants/    # Constantes globais
│   └── types/        # Tipos e interfaces globais
└── pages/           # Páginas da aplicação (componentes de rota)
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
