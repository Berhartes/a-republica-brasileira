# A República Brasileira

## Estrutura do Projeto

```
/
├── src/                                    # Código fonte principal
│   ├── app/                                # Aplicação principal
│   │   ├── components/                     # Componentes específicos da aplicação
│   │   ├── layouts/                        # Layouts da aplicação
│   │   ├── pages/                         # Páginas da aplicação
│   │   ├── providers/                     # Providers do React
│   │   ├── routes/                        # Configuração de rotas
│   │   └── App.tsx                        # Componente raiz
│   │
│   ├── core/                              # Lógica central do negócio
│   │   ├── monitoring/                    # Monitoramento e logs
│   │   ├── contexts/                      # Contextos globais
│   │   ├── schemas/                       # Schemas de validação
│   │   ├── functions/                     # Funções compartilhadas
│   │   └── types/                         # Tipos globais
│   │
│   ├── domains/                           # Domínios do negócio
│   │   ├── congresso-nacional/            # Domínio do Congresso Nacional
│   │   │   ├── senado/                    # Subdomínio do Senado
│   │   │   │   ├── components/            # Componentes específicos
│   │   │   │   ├── services/             # Serviços específicos
│   │   │   │   ├── hooks/                # Hooks específicos
│   │   │   │   └── types/                # Tipos específicos
│   │   │   │
│   │   │   └── camara/                   # Subdomínio da Câmara
│   │   │       ├── components/            # Componentes específicos
│   │   │       ├── services/             # Serviços específicos
│   │   │       ├── hooks/                # Hooks específicos
│   │   │       └── types/                # Tipos específicos
│   │   │
│   │   └── usuario/                      # Domínio do usuário
│   │       ├── components/               # Componentes específicos
│   │       ├── services/                # Serviços específicos
│   │       ├── hooks/                   # Hooks específicos
│   │       └── types/                   # Tipos específicos
│   │
│   ├── shared/                           # Recursos compartilhados
│   │   ├── components/                   # Componentes reutilizáveis
│   │   ├── hooks/                       # Hooks customizados
│   │   ├── styles/                      # Estilos globais
│   │   └── utils/                       # Utilitários compartilhados
│   │
│   └── services/                         # Serviços externos
│       ├── api/                         # Configuração de APIs
│       └── firebase/                    # Configuração do Firebase
```

## Organização

### `/src/app`
Contém a lógica específica da aplicação, incluindo componentes, layouts, páginas e configurações de rotas.

### `/src/core`
Contém a lógica central do negócio, incluindo:
- Monitoramento e logs
- Contextos globais
- Schemas de validação
- Funções compartilhadas
- Tipos globais

### `/src/domains`
Organiza o código por domínios de negócio:

#### Congresso Nacional
- **Senado**: Componentes, serviços e lógica específica do Senado
- **Câmara**: Componentes, serviços e lógica específica da Câmara

#### Usuário
Gerenciamento de usuários e autenticação

### `/src/shared`
Recursos compartilhados entre diferentes partes da aplicação.

### `/src/services`
Integrações com serviços externos.

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

## Scripts

- `pnpm dev` - Inicia o servidor de desenvolvimento
- `pnpm build` - Gera o build de produção
- `pnpm test` - Executa os testes
- `pnpm storybook` - Inicia o Storybook

## Tecnologias

- React
- TypeScript
- Vite
- TanStack Query
- Firebase
- Storybook
- Vitest
- Tailwind CSS

## Desenvolvimento

1. Clone o repositório
2. Instale as dependências: `pnpm install`
3. Inicie o servidor de desenvolvimento: `pnpm dev`

## Testes

- Unitários: `pnpm test`
- Cobertura: `pnpm test:coverage`
- E2E: `pnpm test:e2e`

## Documentação

A documentação detalhada está disponível no diretório `/docs`, incluindo:
- Schemas de validação
- Documentação da API
- Guias de desenvolvimento 