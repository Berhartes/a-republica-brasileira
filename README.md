# República de Bolso

![República de Bolso Logo](public/flags/flag_circle_brazil.png)

## Stack Tecnológica - A República Brasileira Atual

### Frontend
- React 18.3.1
- TypeScript 5.8.2
- Vite 6.3.4 (bundler)
- Tailwind CSS 3.4.17 (sistema de estilização)
- Radix UI (componentes primitivos)
- Jotai 2.12.2 & Zustand 5.0.3 (gerenciamento de estado)
- TanStack Query 5.69.0 (gerenciamento de dados/cache)
- React Router DOM 6.30.0 (roteamento)
- React Hook Form 7.54.2 (formulários)
- Recharts 2.15.1 (visualização de dados)
- Lucide React (ícones)

### Testes
- Vitest 1.6.1 (framework de testes)
- Testing Library (testes de componentes)
- Playwright (testes E2E)
- Storybook 8.6 (documentação de componentes)

### Backend/Infraestrutura
- Firebase 10.7.1
- Firebase Functions
- Firebase Admin
- Socket.io (comunicação em tempo real)

### Monitoramento/Analytics
- Sentry
- Datadog
- Amplitude
- PostHog
- Mixpanel
- Vercel Analytics

### Qualidade de Código
- ESLint 9.25.1
- Prettier 3.5.3
- Stylelint 16.19.1
- TypeScript strict mode
- Snyk (análise de segurança)

### Build/Deploy
- pnpm (gerenciador de pacotes)
- Vite (build tool)
- Firebase Deploy

### Principais Mudanças Recentes
- Migração completa para Tailwind CSS 3.4
- Remoção de arquivos CSS customizados
- Implementação de design system baseado em utilitários
- Suporte a dark mode nativo do Tailwind
- Plugins: @tailwindcss/forms, @tailwindcss/typography, tailwindcss-animate

### Atualizações Importantes
- TanStack Query v5.69.0
- React 18.3.1
- TypeScript 5.8.2
- Vite 6.3.4

## 📋 Descrição

República de Bolso é uma aplicação web interativa que fornece visualizações e análises de dados políticos do Brasil. A plataforma permite aos cidadãos acompanhar a atividade política em diferentes níveis governamentais (federal, estadual e municipal), oferecendo dashboards personalizados por estado, rankings de atividades parlamentares, e informações detalhadas sobre representantes eleitos.

O projeto visa aumentar a transparência política e facilitar o acesso a informações sobre o funcionamento das instituições democráticas brasileiras.

## 🚀 Tecnologias Utilizadas

- **Frontend**:
  - React 18
  - TypeScript
  - Tailwind CSS
  - Shadcn UI (componentes baseados em Radix UI)
  - Lucide React (ícones)
  - Recharts (visualização de dados)
  - React Router DOM (navegação)

- **Backend/Serviços**:
  - Firebase (autenticação e banco de dados)
  - Axios (requisições HTTP)
  - API Dados Abertos da Câmara dos Deputados

- **Ferramentas de Desenvolvimento**:
  - React App Rewired (configuração personalizada)
  - ESLint (linting)

## 🛠️ Instalação e Configuração

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Conta no Firebase (para funcionalidades de backend)

### Passos para Instalação

1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/republica-de-bolso.git
cd republica-de-bolso
```

2. Instale as dependências
```bash
npm install
# ou
yarn install
```

3. Configure as variáveis de ambiente
   - Crie um arquivo `.env` na raiz do projeto
   - Adicione as configurações do Firebase:
```
REACT_APP_FIREBASE_API_KEY=sua_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=seu_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=seu_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=seu_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=seu_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=seu_app_id
```

4. Inicie o servidor de desenvolvimento
```bash
npm start
# ou
yarn start
```

5. Para build de produção
```bash
npm run build
# ou
yarn build
```

## 📁 Estrutura do Projeto

```
a-republica-brasileira-atual/
├── public/                  # Arquivos estáticos
│   ├── flags/               # Bandeiras dos estados
│   ├── favicon.ico          # Ícone do site
│   └── index.html           # Template HTML
│
├── src/                     # Código fonte principal
│   ├── app/                 # App principal, providers, layouts, contexts
│   ├── cli/                 # CLI e utilitários de linha de comando
│   ├── config/              # Configurações (ex: Firebase)
│   ├── congresso-nacional/  # Integrações e lógica do Congresso Nacional
│   ├── core/                # Funções centrais, schemas, monitoring
│   ├── domains/             # Domínios de negócio (congresso, usuario, etc)
│   ├── scripts/             # Scripts utilitários
│   ├── services/            # Serviços de API
│   ├── shared/              # Componentes, hooks e utilitários compartilhados
│   ├── styles/              # Estilos globais
│   ├── usuario/             # Funcionalidades do usuário
│   ├── utils/               # Funções utilitárias
│   ├── index.ts             # Ponto de entrada
│   ├── main.ts              # Inicialização principal
│   ├── main.tsx             # Inicialização React
│   ├── setupTests.ts        # Setup de testes
│   ├── constants.ts         # Constantes globais
│   ├── types.ts             # Tipos globais
│   └── README.md            # Documentação interna
│
├── ainda-falta-migrar - functions/ # Código legado a migrar
├── build/                  # Build de produção
├── config/                 # Configurações globais
├── dist/                   # Build final
├── docs/                   # Documentação
├── install-instructions/   # Instruções de instalação
├── logs/                   # Logs de execução
├── node_modules/           # Dependências
├── tests/                  # Testes automatizados
├── tools/                  # Ferramentas e scripts auxiliares
├── .github/                # Workflows e configs do GitHub
├── .firebaserc             # Configuração do Firebase CLI
├── .gitignore              # Arquivos ignorados pelo Git
├── eslint.config.js        # Configuração do ESLint
├── package.json            # Dependências e scripts
├── pnpm-lock.yaml          # Lockfile do pnpm
├── postcss.config.js       # Configuração do PostCSS
├── tailwind.config.js      # Configuração do Tailwind CSS
├── tsconfig.json           # Configuração do TypeScript
├── vite.config.ts          # Configuração do Vite
└── index.html              # HTML principal
```

## 🌟 Principais Funcionalidades

### 1. Dashboards por Estado

- **Dashboard Unificado**: Visualização de dados políticos por estado brasileiro
- **Três níveis de governo**:
  - **Congresso Nacional**: Representantes federais do estado
  - **Assembleia Legislativa**: Deputados estaduais
  - **Governo Estadual**: Informações sobre o executivo estadual

### 2. Ranking de Atividades Parlamentares

- Visualização dos deputados mais ativos
- Filtros por estado, partido, tipo de despesa
- Gráficos comparativos de atividade parlamentar
- Detalhamento de gastos e atividades

### 3. Navegação por Estado

- Seletor de estados com bandeiras
- Visualização nacional ou por unidade federativa
- Organização por regiões geográficas

### 4. Integração com APIs Governamentais

- Dados da Câmara dos Deputados
- Informações sobre despesas, projetos de lei e atividades parlamentares
- Cache inteligente para otimização de requisições

### 5. Modo Escuro e Acessibilidade

- Suporte a tema claro/escuro
- Recursos de acessibilidade
- Design responsivo para dispositivos móveis e desktop

## 🔄 Fluxo de Dados

1. **Coleta de Dados**:
   - Integração com a API de Dados Abertos da Câmara dos Deputados
   - Armazenamento em cache para otimização de performance
   - Sincronização periódica para dados atualizados

2. **Processamento**:
   - Filtragem por estado, partido, período
   - Cálculo de métricas de atividade parlamentar
   - Geração de rankings e estatísticas

3. **Visualização**:
   - Dashboards interativos
   - Gráficos e tabelas
   - Cards informativos com detalhes sob demanda

## 🧩 Componentes Principais

### Dashboards

- **DashboardUnificadoUF**: Componente principal que gerencia a exibição de dashboards por UF
- **DashboardCard**: Card individual dentro de um dashboard
- **CardDetailView**: Visualização detalhada de um card específico

### Ranking de Atividades

- **RankingCard**: Componente principal do ranking
- **RankingList**: Lista de deputados ordenados por atividade
- **RankingChart**: Visualização gráfica do ranking
- **RankingFilters**: Filtros para personalizar o ranking

### Header e Navegação

- **Header**: Barra de navegação principal
- **StateSelector**: Seletor de estados
- **NavigationMenu**: Menu de navegação lateral
- **BottomNav**: Navegação inferior para dispositivos móveis

## 🔌 Integração com APIs

### API da Câmara dos Deputados

O projeto utiliza a API de Dados Abertos da Câmara dos Deputados para obter informações sobre:

- Lista de deputados federais
- Detalhes de deputados específicos
- Despesas parlamentares
- Legislaturas
- Partidos políticos

Exemplo de uso:

```javascript
// Buscar todos os deputados
const deputados = await camaraApi.buscarTodosDeputados();

// Buscar despesas de um deputado específico
const despesas = await camaraApi.buscarTodasDespesasDeputado(idDeputado);
```

### Firebase

Utilizado para:

- Autenticação de usuários
- Armazenamento de dados personalizados
- Sincronização em tempo real

## 🔒 Segurança e Performance

### Segurança

- Autenticação via Firebase
- Validação de dados em requisições
- Sanitização de inputs
- Vulnerabilidades conhecidas:
  - **CVE-2023-45133**: Vulnerabilidade moderada no esbuild (versão <=0.24.2)
    - Afeta apenas o servidor de desenvolvimento local
    - Não impacta a build de produção
    - Risco mitigado por:
      - Servidor de desenvolvimento executado apenas localmente
      - Nenhuma exposição à internet
      - Monitoramento contínuo de atualizações de segurança

### Performance

- Estratégia de cache para reduzir requisições à API
- Lazy loading de componentes
- Otimização de imagens e assets

## 📱 Responsividade

A aplicação é totalmente responsiva, adaptando-se a diferentes tamanhos de tela:

- **Desktop**: Layout completo com todas as funcionalidades
- **Tablet**: Layout adaptado com reorganização de elementos
- **Mobile**: Interface simplificada com navegação otimizada para toque

## 🧪 Testes

Para executar os testes:

```bash
npm test
# ou
yarn test
```

## 🚀 Deploy

### Deploy no Firebase Hosting

1. Faça login no Firebase CLI
```bash
firebase login
```

2. Inicialize o projeto Firebase (se ainda não estiver configurado)
```bash
firebase init
```

3. Construa a aplicação
```bash
npm run build
# ou
yarn build
```

4. Faça o deploy
```bash
firebase deploy
```

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Faça commit das suas alterações (`git commit -m 'Adiciona nova funcionalidade'`)
4. Faça push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### Padrões de Código

- Utilize TypeScript sempre que possível
- Siga as convenções de nomenclatura do projeto
- Documente funções e componentes complexos
- Escreva testes para novas funcionalidades

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo LICENSE para detalhes.

## 📞 Contato

Para questões, sugestões ou colaborações, entre em contato através de:

- Email: seu-email@exemplo.com
- GitHub: [seu-usuario](https://github.com/seu-usuario)

---

Desenvolvido com ❤️ para aumentar a transparência política no Brasil.
