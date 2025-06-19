import * as React from 'react';
import { Router, RouterProvider, Route, RootRoute } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { MonitoringProvider } from '@/app/monitoring';
import { DarkModeProvider } from './contexts/Theme';
import { AuthProvider } from '@/domains/usuario/hooks/useAuth.tsx';
import { DashboardStyleProvider } from '@/domains/republica/core/contexts/DashboardStyleContext';
import AppLayout from '@/app/layouts/app/AppLayout';

// Importações das páginas do Senado
import SenadoPage from '@/domains/republica/congresso/senado/pages/SenadoPage';
import SenadoMapaVotacoes from '@/domains/republica/congresso/senado/pages/SenadoMapaVotacoes';
import SenadoProposicoes from '@/domains/republica/congresso/senado/pages/SenadoProposicoes';
import SenadoRanking from '@/domains/republica/congresso/senado/pages/SenadoRanking';
import SenadorPerfilPage from '@/domains/republica/congresso/senado/pages/SenadorPerfilPage';

// Importações das páginas da Câmara
import { deputadosRoute, deputadoPerfilRoute, partidoPerfilRoute, blocoPerfilRoute, deputadosDadosETLRoute } from '@/domains/republica/congresso/camara/routes';

// Importações das páginas adicionais
import AdminPage from '@/domains/admin/pages/AdminCongressoPage'; // Caminho corrigido
import BuscarPoliticos from '@/domains/republica/core/pages/BuscarPoliticos';
import ChartsPage from '@/domains/republica/core/pages/ChartsPage';
import CriarPeticao from '@/domains/republica/core/pages/CriarPeticao';
import HomePage from '@/domains/republica/core/pages/HomePage';
import MapaPolitico from '@/domains/republica/core/pages/MapaPolitico';
import PetitionsPage from '@/domains/republica/core/pages/PetitionsPage';
import ProfilePage from '@/domains/usuario/pages/ProfilePage'; // Caminho corrigido
import CriarPerfilPage from '@/domains/usuario/pages/CriarPerfilPage';
import ProjetosDeLei from '@/domains/republica/core/pages/ProjetosDeLei';
import DadosETLPage from '@/domains/republica/core/pages/DadosETLPage';
import DiagnosticoPage from '@/domains/admin/pages/diagnostico';
import DiagnosticoSenadorPage from '@/domains/admin/pages/diagnostico-senador';
import TesteSenadorPage from '@/domains/admin/pages/teste-senador';

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
export const rootRoute = new RootRoute({
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

const criarPerfilRoute = new Route({
	getParentRoute: () => rootRoute,
	path: '/usuario/criar-perfil',
	component: CriarPerfilPage,
});

const projetosDeLeiRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/projetos-de-lei',
  component: ProjetosDeLei,
});

const dadosETLRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/senado/dados-etl',
  component: DadosETLPage,
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

// As rotas dos deputados foram movidas para src/domains/republica/congresso/camara/routes.ts

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
  criarPerfilRoute,
  projetosDeLeiRoute,
  dadosETLRoute,
  diagnosticoRoute,
  diagnosticoSenadorRoute,
  testeSenadorRoute,
  deputadosRoute,
  deputadoPerfilRoute,
  partidoPerfilRoute,
  blocoPerfilRoute,
  deputadosDadosETLRoute,
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
            <AuthProvider>
              <RouterProvider router={router} />
            </AuthProvider>
          </MonitoringProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </DashboardStyleProvider>
      </DarkModeProvider>
    </QueryClientProvider>
  );
};

export default App;
