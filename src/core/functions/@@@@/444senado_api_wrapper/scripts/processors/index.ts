/**
 * Exportações centralizadas dos processadores ETL
 */

// Processadores principais
export { PerfilSenadoresProcessor } from './perfil-senadores.processor';
export { DiscursosProcessor } from './discursos.processor';
export { BlocosProcessor } from './blocos.processor';

// Novos processadores refatorados
export { ComissoesProcessor } from './comissoes.processor';
export { LiderancasProcessor } from './liderancas.processor';
export { MesasProcessor } from './mesas.processor';
export { SenadoresProcessor } from './senadores.processor';
export { MateriasProcessor } from './materias.processor';
export { VotacoesProcessor } from './votacoes.processor';

// Template para novos processadores
export { TemplateProcessor } from './template.processor';

// Re-export do núcleo ETL
export { ETLProcessor } from '../core/etl-processor';
