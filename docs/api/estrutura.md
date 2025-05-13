# Estrutura do Projeto

## Visão Geral

O projeto está organizado em uma estrutura modular e escalável, seguindo os princípios de Clean Architecture e Domain-Driven Design (DDD). A estrutura foi projetada para facilitar a manutenção, teste e expansão do código.

## Estrutura de Diretórios

```
/
├── src/                              # Código fonte principal
│   ├── app/                          # Aplicação principal
│   │   ├── components/               # Componentes específicos da aplicação
│   │   ├── layouts/                  # Layouts da aplicação
│   │   ├── pages/                    # Páginas da aplicação
│   │   ├── providers/                # Providers do React
│   │   ├── routes/                   # Configuração de rotas
│   │   └── App.tsx                   # Componente raiz
│   │
│   ├── core/                         # Lógica central do negócio
│   │   ├── monitoring/               # Monitoramento e logs
│   │   ├── schemas/                  # Schemas de validação
│   │   └── types/                    # Tipos globais
│   │
│   ├── domains/                      # Domínios do negócio
│   │   └── congresso/               # Lógica específica do congresso
│   │       ├── components/          # Componentes específicos
│   │       ├── services/            # Serviços específicos
│   │       └── types/               # Tipos específicos
│   │
│   ├── shared/                       # Recursos compartilhados
│   │   ├── components/               # Componentes reutilizáveis
│   │   ├── hooks/                    # Hooks customizados
│   │   ├── styles/                   # Estilos globais
│   │   └── utils/                    # Utilitários compartilhados
│   │
│   └── services/                     # Serviços externos
│       ├── senado/                   # Integração com Senado
│       └── firebase/                 # Configuração do Firebase
│
├── config/                           # Configurações do projeto
│   ├── firebase/                     # Configurações do Firebase
│   ├── vite/                        # Configurações do Vite
│   └── typescript/                   # Configurações do TypeScript
│
├── tests/                            # Testes
│   ├── unit/                         # Testes unitários
│   ├── integration/                  # Testes de integração
│   └── e2e/                          # Testes end-to-end
│
└── docs/                             # Documentação
    └── estrutura.md                  # Este arquivo

## Domínios

### Congresso (`src/domains/congresso/`)

O domínio do Congresso é responsável por toda a lógica relacionada ao legislativo. Inclui:

- **Components**: Componentes React específicos do domínio
  - `ActionCard`: Exibe informações de uma proposição
  - `PriorityActions`: Lista de proposições prioritárias

- **Services**: Serviços para interação com APIs
  - `CongressoService`: Integração com APIs do Senado e Câmara

- **Types**: Definições de tipos TypeScript
  - Interfaces para proposições, parlamentares, votações, etc.

## Configuração

### Vite (`config/vite/`)
- `vite.config.ts`: Configuração principal do Vite
- `vite.config.alternativo.ts`: Configuração alternativa

### TypeScript (`config/typescript/`)
- `tsconfig.json`: Configuração do TypeScript

## Testes

Os testes estão organizados em três categorias:

1. **Testes Unitários** (`tests/unit/`)
   - Testes de componentes individuais
   - Testes de funções utilitárias
   - Testes de hooks

2. **Testes de Integração** (`tests/integration/`)
   - Testes de integração entre componentes
   - Testes de serviços

3. **Testes E2E** (`tests/e2e/`)
   - Testes de fluxos completos
   - Testes de interface do usuário

## Convenções

1. **Nomenclatura**
   - Componentes: PascalCase (ex: `ActionCard.tsx`)
   - Hooks: camelCase com prefixo "use" (ex: `useCongresso.ts`)
   - Utilitários: camelCase (ex: `formatDate.ts`)

2. **Importações**
   - Imports absolutos para módulos do projeto
   - Imports relativos apenas dentro do mesmo domínio

3. **Tipos**
   - Interfaces para tipos de objetos
   - Type para unions e tipos mais simples

4. **Testes**
   - Arquivos de teste com sufixo `.test.ts` ou `.spec.ts`
   - Um arquivo de teste por componente/módulo

## Próximos Passos

1. Completar a migração dos arquivos existentes
2. Implementar testes unitários para os novos componentes
3. Atualizar as importações em todo o projeto
4. Adicionar mais documentação específica por domínio 