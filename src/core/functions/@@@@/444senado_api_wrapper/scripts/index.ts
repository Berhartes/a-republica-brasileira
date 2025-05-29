/**
 * Sistema ETL do Senado Federal - v2.0
 * 
 * Exportações centralizadas de todos os componentes do sistema ETL refatorado.
 * Arquitetura modular baseada no padrão Template Method.
 */

// === CORE ETL ===
export { ETLProcessor } from './core/etl-processor';

// === TIPOS ===
export * from './types/etl.types';

// === CONFIGURAÇÕES ===
export { etlConfig } from './config/etl.config';
export { configurarVariaveisAmbiente, getDestinoConfig } from './config/environment.config';

// === UTILS ===
export { ETLCommandParser } from './utils/cli/etl-cli';
export { logger, LogLevel } from './utils/logging';
export { exportToJson } from './utils/common';
export * from './utils/api';
export * from './utils/date';
export * from './utils/storage';

// === PROCESSADORES ===
export {
  // Processador principal (modelo perfeito)
  PerfilSenadoresProcessor,
  
  // Novos processadores refatorados
  ComissoesProcessor,
  LiderancasProcessor,
  MesasProcessor,
  SenadoresProcessor,
  MateriasProcessor,
  VotacoesProcessor,
  
  // Processadores já funcionais
  BlocosProcessor,
  DiscursosProcessor,
  
  // Template para novos processadores
  TemplateProcessor
} from './processors';

// === SCRIPTS INITIATORS ===
export { processarPerfilSenadores } from './initiators/processar_perfilsenadores';
export { processarComissoes } from './initiators/processar_comissoes';
export { processarLiderancas } from './initiators/processar_liderancas';
export { processarMesas } from './initiators/processar_mesas';
export { processarSenadores } from './initiators/processar_senadores';
export { processarMateriasLegislativas } from './initiators/processar_materias';
export { processarVotacoes } from './initiators/processar_votacoes';
export { processarBlocos } from './initiators/processar_blocos';
export { processarDiscursos } from './initiators/processar_discursos';

// === MÓDULOS DE EXTRAÇÃO ===
export * from './extracao/perfilsenadores';
export * from './extracao/comissoes';
export * from './extracao/liderancas';
export * from './extracao/mesas';
export * from './extracao/senadores';
export * from './extracao/materias';
export * from './extracao/votacoes';
export * from './extracao/blocos';

// === MÓDULOS DE TRANSFORMAÇÃO ===
export * from './transformacao/perfilsenadores';
export * from './transformacao/comissoes';
export * from './transformacao/liderancas';
export * from './transformacao/mesas';
export * from './transformacao/senadores';
export * from './transformacao/materias';
export * from './transformacao/votacoes';
export * from './transformacao/blocos';

// === MÓDULOS DE CARREGAMENTO ===
export * from './carregamento/perfilsenadores';
export * from './carregamento/comissoes';
export * from './carregamento/liderancas';
export * from './carregamento/mesas';
export * from './carregamento/senadores';
export * from './carregamento/materias';
export * from './carregamento/votacoes';
export * from './carregamento/blocos';

// === SISTEMA DE TESTES ===
export { executarTestes } from './test-etl-system';

// === INFORMAÇÕES DO SISTEMA ===
export const SYSTEM_INFO = {
  name: 'Sistema ETL do Senado Federal',
  version: '2.0.0',
  architecture: 'Modular ETL with Template Method Pattern',
  processors: 9,
  refactoredDate: new Date().toISOString(),
  status: 'Production Ready',
  features: [
    'Unified CLI with 15+ options',
    'Template Method ETL Pattern',
    'Multi-destination support (Firestore/Emulator/PC)',
    'Professional logging and monitoring',
    'Robust validation and error handling',
    'TypeScript 100% with strong typing',
    'Automated testing system',
    'Complete documentation'
  ],
  availableProcessors: [
    'senado:perfil      - Perfis completos de senadores',
    'senado:comissoes   - Comissões parlamentares',
    'senado:liderancas  - Lideranças parlamentares',
    'senado:mesas       - Mesas diretoras',
    'senado:senadores   - Senadores em exercício',
    'senado:materias    - Matérias legislativas',
    'senado:votacoes    - Votações de senadores',
    'senado:blocos      - Blocos parlamentares',
    'senado:discursos   - Discursos de senadores'
  ]
};

// === CONSTANTES ÚTEIS ===
export const ETL_VERSION = '2.0.0';
export const ETL_PROCESSORS_COUNT = 9;
export const ETL_CLI_OPTIONS_COUNT = 15;

// === HELPER PARA DEBUG ===
export const debugSystemInfo = () => {
  console.log('🏛️ Sistema ETL do Senado Federal v2.0');
  console.log('📦 Processadores disponíveis:', SYSTEM_INFO.processors);
  console.log('🔧 Arquitetura:', SYSTEM_INFO.architecture);
  console.log('✨ Status:', SYSTEM_INFO.status);
  console.log('');
  console.log('📋 Comandos disponíveis:');
  SYSTEM_INFO.availableProcessors.forEach(proc => console.log(`   ${proc}`));
  console.log('');
  console.log('💡 Para testar: npm run test-etl');
  console.log('💡 Para usar: npm run senado:[processador] -- --help');
};
