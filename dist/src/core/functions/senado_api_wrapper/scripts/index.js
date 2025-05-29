"use strict";
/**
 * Sistema ETL do Senado Federal - v2.0
 *
 * Exportações centralizadas de todos os componentes do sistema ETL refatorado.
 * Arquitetura modular baseada no padrão Template Method.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugSystemInfo = exports.ETL_CLI_OPTIONS_COUNT = exports.ETL_PROCESSORS_COUNT = exports.ETL_VERSION = exports.SYSTEM_INFO = exports.executarTestes = exports.processarDiscursos = exports.processarBlocos = exports.processarVotacoes = exports.processarMateriasLegislativas = exports.processarSenadores = exports.processarMesas = exports.processarLiderancas = exports.processarComissoes = exports.processarPerfilSenadores = exports.TemplateProcessor = exports.DiscursosProcessor = exports.BlocosProcessor = exports.VotacoesProcessor = exports.MateriasProcessor = exports.SenadoresProcessor = exports.MesasProcessor = exports.LiderancasProcessor = exports.ComissoesProcessor = exports.PerfilSenadoresProcessor = exports.exportToJson = exports.LogLevel = exports.logger = exports.ETLCommandParser = exports.getDestinoConfig = exports.configurarVariaveisAmbiente = exports.etlConfig = exports.ETLProcessor = void 0;
const tslib_1 = require("tslib");
// === CORE ETL ===
var etl_processor_1 = require("./core/etl-processor");
Object.defineProperty(exports, "ETLProcessor", { enumerable: true, get: function () { return etl_processor_1.ETLProcessor; } });
// === TIPOS ===
tslib_1.__exportStar(require("./types/etl.types"), exports);
// === CONFIGURAÇÕES ===
var etl_config_1 = require("./config/etl.config");
Object.defineProperty(exports, "etlConfig", { enumerable: true, get: function () { return etl_config_1.etlConfig; } });
var environment_config_1 = require("./config/environment.config");
Object.defineProperty(exports, "configurarVariaveisAmbiente", { enumerable: true, get: function () { return environment_config_1.configurarVariaveisAmbiente; } });
Object.defineProperty(exports, "getDestinoConfig", { enumerable: true, get: function () { return environment_config_1.getDestinoConfig; } });
// === UTILS ===
var etl_cli_1 = require("./utils/cli/etl-cli");
Object.defineProperty(exports, "ETLCommandParser", { enumerable: true, get: function () { return etl_cli_1.ETLCommandParser; } });
var logging_1 = require("./utils/logging");
Object.defineProperty(exports, "logger", { enumerable: true, get: function () { return logging_1.logger; } });
Object.defineProperty(exports, "LogLevel", { enumerable: true, get: function () { return logging_1.LogLevel; } });
var common_1 = require("./utils/common");
Object.defineProperty(exports, "exportToJson", { enumerable: true, get: function () { return common_1.exportToJson; } });
tslib_1.__exportStar(require("./utils/api"), exports);
tslib_1.__exportStar(require("./utils/date"), exports);
tslib_1.__exportStar(require("./utils/storage"), exports);
// === PROCESSADORES ===
var processors_1 = require("./processors");
// Processador principal (modelo perfeito)
Object.defineProperty(exports, "PerfilSenadoresProcessor", { enumerable: true, get: function () { return processors_1.PerfilSenadoresProcessor; } });
// Novos processadores refatorados
Object.defineProperty(exports, "ComissoesProcessor", { enumerable: true, get: function () { return processors_1.ComissoesProcessor; } });
Object.defineProperty(exports, "LiderancasProcessor", { enumerable: true, get: function () { return processors_1.LiderancasProcessor; } });
Object.defineProperty(exports, "MesasProcessor", { enumerable: true, get: function () { return processors_1.MesasProcessor; } });
Object.defineProperty(exports, "SenadoresProcessor", { enumerable: true, get: function () { return processors_1.SenadoresProcessor; } });
Object.defineProperty(exports, "MateriasProcessor", { enumerable: true, get: function () { return processors_1.MateriasProcessor; } });
Object.defineProperty(exports, "VotacoesProcessor", { enumerable: true, get: function () { return processors_1.VotacoesProcessor; } });
// Processadores já funcionais
Object.defineProperty(exports, "BlocosProcessor", { enumerable: true, get: function () { return processors_1.BlocosProcessor; } });
Object.defineProperty(exports, "DiscursosProcessor", { enumerable: true, get: function () { return processors_1.DiscursosProcessor; } });
// Template para novos processadores
Object.defineProperty(exports, "TemplateProcessor", { enumerable: true, get: function () { return processors_1.TemplateProcessor; } });
// === SCRIPTS INITIATORS ===
var processar_perfilsenadores_1 = require("./initiators/processar_perfilsenadores");
Object.defineProperty(exports, "processarPerfilSenadores", { enumerable: true, get: function () { return processar_perfilsenadores_1.processarPerfilSenadores; } });
var processar_comissoes_1 = require("./initiators/processar_comissoes");
Object.defineProperty(exports, "processarComissoes", { enumerable: true, get: function () { return processar_comissoes_1.processarComissoes; } });
var processar_liderancas_1 = require("./initiators/processar_liderancas");
Object.defineProperty(exports, "processarLiderancas", { enumerable: true, get: function () { return processar_liderancas_1.processarLiderancas; } });
var processar_mesas_1 = require("./initiators/processar_mesas");
Object.defineProperty(exports, "processarMesas", { enumerable: true, get: function () { return processar_mesas_1.processarMesas; } });
var processar_senadores_1 = require("./initiators/processar_senadores");
Object.defineProperty(exports, "processarSenadores", { enumerable: true, get: function () { return processar_senadores_1.processarSenadores; } });
var processar_materias_1 = require("./initiators/processar_materias");
Object.defineProperty(exports, "processarMateriasLegislativas", { enumerable: true, get: function () { return processar_materias_1.processarMateriasLegislativas; } });
var processar_votacoes_1 = require("./initiators/processar_votacoes");
Object.defineProperty(exports, "processarVotacoes", { enumerable: true, get: function () { return processar_votacoes_1.processarVotacoes; } });
var processar_blocos_1 = require("./initiators/processar_blocos");
Object.defineProperty(exports, "processarBlocos", { enumerable: true, get: function () { return processar_blocos_1.processarBlocos; } });
var processar_discursos_1 = require("./initiators/processar_discursos");
Object.defineProperty(exports, "processarDiscursos", { enumerable: true, get: function () { return processar_discursos_1.processarDiscursos; } });
// === MÓDULOS DE EXTRAÇÃO ===
tslib_1.__exportStar(require("./extracao/perfilsenadores"), exports);
tslib_1.__exportStar(require("./extracao/comissoes"), exports);
tslib_1.__exportStar(require("./extracao/liderancas"), exports);
tslib_1.__exportStar(require("./extracao/mesas"), exports);
tslib_1.__exportStar(require("./extracao/senadores"), exports);
tslib_1.__exportStar(require("./extracao/materias"), exports);
tslib_1.__exportStar(require("./extracao/votacoes"), exports);
tslib_1.__exportStar(require("./extracao/blocos"), exports);
// === MÓDULOS DE TRANSFORMAÇÃO ===
tslib_1.__exportStar(require("./transformacao/perfilsenadores"), exports);
tslib_1.__exportStar(require("./transformacao/comissoes"), exports);
tslib_1.__exportStar(require("./transformacao/liderancas"), exports);
tslib_1.__exportStar(require("./transformacao/mesas"), exports);
tslib_1.__exportStar(require("./transformacao/senadores"), exports);
tslib_1.__exportStar(require("./transformacao/materias"), exports);
tslib_1.__exportStar(require("./transformacao/votacoes"), exports);
tslib_1.__exportStar(require("./transformacao/blocos"), exports);
// === MÓDULOS DE CARREGAMENTO ===
tslib_1.__exportStar(require("./carregamento/perfilsenadores"), exports);
tslib_1.__exportStar(require("./carregamento/comissoes"), exports);
tslib_1.__exportStar(require("./carregamento/liderancas"), exports);
tslib_1.__exportStar(require("./carregamento/mesas"), exports);
tslib_1.__exportStar(require("./carregamento/senadores"), exports);
tslib_1.__exportStar(require("./carregamento/materias"), exports);
tslib_1.__exportStar(require("./carregamento/votacoes"), exports);
tslib_1.__exportStar(require("./carregamento/blocos"), exports);
// === SISTEMA DE TESTES ===
var test_etl_system_1 = require("./test-etl-system");
Object.defineProperty(exports, "executarTestes", { enumerable: true, get: function () { return test_etl_system_1.executarTestes; } });
// === INFORMAÇÕES DO SISTEMA ===
exports.SYSTEM_INFO = {
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
exports.ETL_VERSION = '2.0.0';
exports.ETL_PROCESSORS_COUNT = 9;
exports.ETL_CLI_OPTIONS_COUNT = 15;
// === HELPER PARA DEBUG ===
const debugSystemInfo = () => {
    console.log('🏛️ Sistema ETL do Senado Federal v2.0');
    console.log('📦 Processadores disponíveis:', exports.SYSTEM_INFO.processors);
    console.log('🔧 Arquitetura:', exports.SYSTEM_INFO.architecture);
    console.log('✨ Status:', exports.SYSTEM_INFO.status);
    console.log('');
    console.log('📋 Comandos disponíveis:');
    exports.SYSTEM_INFO.availableProcessors.forEach(proc => console.log(`   ${proc}`));
    console.log('');
    console.log('💡 Para testar: npm run test-etl');
    console.log('💡 Para usar: npm run senado:[processador] -- --help');
};
exports.debugSystemInfo = debugSystemInfo;
//# sourceMappingURL=index.js.map