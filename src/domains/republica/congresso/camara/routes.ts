import { Route } from '@tanstack/react-router';
import { rootRoute } from '@/app/App';
import DeputadosPage from './pages/DeputadosPage';
import DeputadoPerfilPage from './pages/DeputadoPerfilPage';
import PartidoPerfilPage from './pages/PartidoPerfilPage';
import BlocoPerfilPage from './pages/BlocoPerfilPage';
import DadosETLPage from '@/domains/republica/core/pages/DadosETLPage';

export const deputadosRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/deputados',
  component: DeputadosPage,
});

export const deputadoPerfilRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/deputado/$id',
  component: DeputadoPerfilPage,
});

export const partidoPerfilRoute = new Route({
    getParentRoute: () => rootRoute,
    path: '/partido/$id',
    component: PartidoPerfilPage,
});

export const blocoPerfilRoute = new Route({
    getParentRoute: () => rootRoute,
    path: '/bloco/$id/legislatura/$legislatura',
    component: BlocoPerfilPage,
});

export const deputadosDadosETLRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/deputados/dados-etl',
  component: DadosETLPage, // Reutilizando a página ETL por enquanto
});
