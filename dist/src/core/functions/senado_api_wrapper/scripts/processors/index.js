"use strict";
/**
 * Exportações centralizadas dos processadores ETL
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ETLProcessor = exports.TemplateProcessor = exports.VotacoesProcessor = exports.MateriasProcessor = exports.SenadoresProcessor = exports.MesasProcessor = exports.LiderancasProcessor = exports.ComissoesProcessor = exports.BlocosProcessor = exports.DiscursosProcessor = exports.PerfilSenadoresProcessor = void 0;
// Processadores principais
var perfil_senadores_processor_1 = require("./perfil-senadores.processor");
Object.defineProperty(exports, "PerfilSenadoresProcessor", { enumerable: true, get: function () { return perfil_senadores_processor_1.PerfilSenadoresProcessor; } });
var discursos_processor_1 = require("./discursos.processor");
Object.defineProperty(exports, "DiscursosProcessor", { enumerable: true, get: function () { return discursos_processor_1.DiscursosProcessor; } });
var blocos_processor_1 = require("./blocos.processor");
Object.defineProperty(exports, "BlocosProcessor", { enumerable: true, get: function () { return blocos_processor_1.BlocosProcessor; } });
// Novos processadores refatorados
var comissoes_processor_1 = require("./comissoes.processor");
Object.defineProperty(exports, "ComissoesProcessor", { enumerable: true, get: function () { return comissoes_processor_1.ComissoesProcessor; } });
var liderancas_processor_1 = require("./liderancas.processor");
Object.defineProperty(exports, "LiderancasProcessor", { enumerable: true, get: function () { return liderancas_processor_1.LiderancasProcessor; } });
var mesas_processor_1 = require("./mesas.processor");
Object.defineProperty(exports, "MesasProcessor", { enumerable: true, get: function () { return mesas_processor_1.MesasProcessor; } });
var senadores_processor_1 = require("./senadores.processor");
Object.defineProperty(exports, "SenadoresProcessor", { enumerable: true, get: function () { return senadores_processor_1.SenadoresProcessor; } });
var materias_processor_1 = require("./materias.processor");
Object.defineProperty(exports, "MateriasProcessor", { enumerable: true, get: function () { return materias_processor_1.MateriasProcessor; } });
var votacoes_processor_1 = require("./votacoes.processor");
Object.defineProperty(exports, "VotacoesProcessor", { enumerable: true, get: function () { return votacoes_processor_1.VotacoesProcessor; } });
// Template para novos processadores
var template_processor_1 = require("./template.processor");
Object.defineProperty(exports, "TemplateProcessor", { enumerable: true, get: function () { return template_processor_1.TemplateProcessor; } });
// Re-export do núcleo ETL
var etl_processor_1 = require("../core/etl-processor");
Object.defineProperty(exports, "ETLProcessor", { enumerable: true, get: function () { return etl_processor_1.ETLProcessor; } });
//# sourceMappingURL=index.js.map