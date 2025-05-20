// Exportar componentes principais unificados
export { DashboardUnificado, DashboardUnificadoUF } from './DashboardMain';

// Exportar componentes estáticos (sem recarga)
export { StaticDashboard } from './StaticDashboard';
export { StaticDashboardContainer } from './StaticDashboardContainer';

// Exportar componentes auxiliares
export {
  DashboardCard,
  DashboardHeader,
  TabSelector,
  CardDetailView,
  ErrorMessage
} from './DashboardComponents';

// Exportar componentes de depuração e teste
export { FlagDashboardDebug, TestDashboard } from './DashboardDebug';

// Exportar configurações
export * from './dashboardConfig';
