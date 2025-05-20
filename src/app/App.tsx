import React from 'react';
import { Router, RouterProvider, Route, RootRoute } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { MonitoringProvider } from '@/app/monitoring';
import { DarkModeProvider } from '@/app/contexts/DarkModeContext';
import { DashboardStyleProvider } from '@/domains/congresso/contexts/DashboardStyleContext';
import AppLayout from '@/app/layouts/app/AppLayout';

// Importações das páginas do Senado
import SenadoPage from '@/domains/congresso/pages/SenadoPage';
import SenadoMapaVotacoes from '@/domains/congresso/pages/SenadoMapaVotacoes';
import SenadoProposicoes from '@/domains/congresso/pages/SenadoProposicoes';
import SenadoRanking from '@/domains/congresso/pages/SenadoRanking';
import SenadorPerfilPage from '@/domains/congresso/pages/SenadorPerfilPage';

// Importações das páginas adicionais
import AdminPage from '@/domains/congresso/pages/AdminPage';
import BuscarPoliticos from '@/domains/congresso/pages/BuscarPoliticos';
import ChartsPage from '@/domains/congresso/pages/ChartsPage';
import CriarPeticao from '@/domains/congresso/pages/CriarPeticao';
import HomePage from '@/domains/congresso/pages/HomePage';
import MapaPolitico from '@/domains/congresso/pages/MapaPolitico';
import PetitionsPage from '@/domains/congresso/pages/PetitionsPage';
import ProfilePage from '@/domains/congresso/pages/ProfilePage';
import ProjetosDeLei from '@/domains/congresso/pages/ProjetosDeLei';
import TesteDashboard from '@/domains/congresso/pages/TesteDashboard';
import TesteDashboardSimples from '@/domains/congresso/pages/TesteDashboardSimples';
import NovoTesteDashboard from '@/domains/congresso/pages/NovoTesteDashboard';
import DadosETLPage from '@/domains/congresso/pages/DadosETLPage';
import DashBackupPage from '@/domains/congresso/pages/DashBackupPage';
import DiagnosticoPage from '@/pages/diagnostico';
import DiagnosticoSenadorPage from '@/pages/diagnostico-senador';
import TesteSenadorPage from '@/pages/teste-senador';

// Criar uma instância do QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
    },
  },
});

// Configuração do monitoramento
const monitoringConfig = {
  sentry: {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE),
    replaysSessionSampleRate: Number(import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE),
    replaysOnErrorSampleRate: Number(import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE),
  },
  datadog: {
    applicationId: import.meta.env.VITE_DATADOG_APPLICATION_ID,
    clientToken: import.meta.env.VITE_DATADOG_CLIENT_TOKEN,
    options: {
      site: import.meta.env.VITE_DATADOG_SITE,
      service: import.meta.env.VITE_DATADOG_SERVICE,
      env: import.meta.env.VITE_DATADOG_ENV,
      sessionSampleRate: 100,
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      defaultPrivacyLevel: 'mask-user-input' as const,
    },
  },
  analytics: {
    amplitude: {
      apiKey: import.meta.env.VITE_AMPLITUDE_API_KEY,
    },
    posthog: {
      apiKey: import.meta.env.VITE_POSTHOG_API_KEY,
      apiHost: import.meta.env.VITE_POSTHOG_API_HOST,
    },
  },
  logger: {
    level: import.meta.env.VITE_LOGGER_LEVEL as 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal',
    enabled: import.meta.env.VITE_LOGGER_ENABLED === 'true',
    transport: {
      level: import.meta.env.VITE_LOGGER_TRANSMIT_LEVEL as 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal',
      url: import.meta.env.VITE_LOGGER_TRANSMIT_URL,
    },
  },
};

// Configuração das rotas
const rootRoute = new RootRoute({
  component: AppLayout,
});

const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const senadoRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/senado',
  component: SenadoPage,
});

const senadoMapaVotacoesRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/senado/mapa-votacoes',
  component: SenadoMapaVotacoes,
});

const senadoProposicoesRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/senado/proposicoes',
  component: SenadoProposicoes,
});

const senadoRankingRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/senado/ranking',
  component: SenadoRanking,
});

const senadorPerfilRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/senador/$id',
  component: SenadorPerfilPage,
});

const adminRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminPage,
});

const buscarPoliticosRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/buscar-politicos',
  component: BuscarPoliticos,
});

const chartsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/charts',
  component: ChartsPage,
});

const criarPeticaoRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/criar-peticao',
  component: CriarPeticao,
});

const mapaPoliticoRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/mapa-politico',
  component: MapaPolitico,
});

const peticoesRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/peticoes',
  component: PetitionsPage,
});

const perfilRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/perfil',
  component: ProfilePage,
});

const projetosDeLeiRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/projetos-de-lei',
  component: ProjetosDeLei,
});

const testeDashboardRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/teste-dashboard',
  component: TesteDashboard,
});

const testeDashboardSimplesRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/teste-dashboard-simples',
  component: TesteDashboardSimples,
});

const novoTesteDashboardRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/novo-teste-dashboard',
  component: NovoTesteDashboard,
});

const dadosETLRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/senado/dados-etl',
  component: DadosETLPage,
});

const dashBackupRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/dashbackup',
  component: DashBackupPage,
});

const diagnosticoRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/diagnostico',
  component: DiagnosticoPage,
});

const diagnosticoSenadorRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/diagnostico-senador',
  component: DiagnosticoSenadorPage,
});

const testeSenadorRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/teste-senador',
  component: TesteSenadorPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  senadoRoute,
  senadoMapaVotacoesRoute,
  senadoProposicoesRoute,
  senadoRankingRoute,
  senadorPerfilRoute,
  adminRoute,
  buscarPoliticosRoute,
  chartsRoute,
  criarPeticaoRoute,
  mapaPoliticoRoute,
  peticoesRoute,
  perfilRoute,
  projetosDeLeiRoute,
  testeDashboardRoute,
  testeDashboardSimplesRoute,
  novoTesteDashboardRoute,
  dadosETLRoute,
  dashBackupRoute,
  diagnosticoRoute,
  diagnosticoSenadorRoute,
  testeSenadorRoute,
]);

const router = new Router({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <DarkModeProvider>
        <DashboardStyleProvider>
          <MonitoringProvider config={monitoringConfig}>
            <RouterProvider router={router} />
          </MonitoringProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </DashboardStyleProvider>
      </DarkModeProvider>
    </QueryClientProvider>
  );
};

export default App;
