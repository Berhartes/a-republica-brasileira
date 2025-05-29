"use strict";
/**
 * Utilitários Comuns e Ferramentas Auxiliares
 *
 * Este módulo contém utilitários comuns, ferramentas de exportação e outras
 * funcionalidades auxiliares que são usadas em múltiplos contextos.
 *
 * @example
 * ```typescript
 * import { exportarDadosAvancados, OpcoesExportacao } from '../utils/common';
 *
 * const opcoes: OpcoesExportacao = {
 *   formato: 'json',
 *   comprimir: true,
 *   nivelDetalhamento: 'completo'
 * };
 *
 * await exportarDadosAvancados(dados, opcoes, Date.now());
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.criarDadosResumidos = exports.gerarEstatisticasGerais = exports.verificarConsistencia = exports.calcularCompletude = exports.criarEstruturaDiretorios = exports.exportarObjeto = exports.exportarParaCSV = exports.exportarParaJSON = exports.exportarDados = exports.exportItemsAsIndividualFiles = exports.exportToJson = exports.exportarDadosAvancados = exports.exportarDadosBrutos = exports.exportarDadosFirestore = void 0;
// Exportadores de dados
var data_exporter_1 = require("./data-exporter");
Object.defineProperty(exports, "exportarDadosFirestore", { enumerable: true, get: function () { return data_exporter_1.exportarDadosFirestore; } });
Object.defineProperty(exports, "exportarDadosBrutos", { enumerable: true, get: function () { return data_exporter_1.exportarDadosBrutos; } });
Object.defineProperty(exports, "exportarDadosAvancados", { enumerable: true, get: function () { return data_exporter_1.exportarDadosAvancados; } });
Object.defineProperty(exports, "exportToJson", { enumerable: true, get: function () { return data_exporter_1.exportToJson; } });
Object.defineProperty(exports, "exportItemsAsIndividualFiles", { enumerable: true, get: function () { return data_exporter_1.exportItemsAsIndividualFiles; } });
var exportacao_avanc_1 = require("./exportacao-avanc");
Object.defineProperty(exports, "exportarDados", { enumerable: true, get: function () { return exportacao_avanc_1.exportarDados; } });
Object.defineProperty(exports, "exportarParaJSON", { enumerable: true, get: function () { return exportacao_avanc_1.exportarParaJSON; } });
Object.defineProperty(exports, "exportarParaCSV", { enumerable: true, get: function () { return exportacao_avanc_1.exportarParaCSV; } });
Object.defineProperty(exports, "exportarObjeto", { enumerable: true, get: function () { return exportacao_avanc_1.exportarObjeto; } });
Object.defineProperty(exports, "criarEstruturaDiretorios", { enumerable: true, get: function () { return exportacao_avanc_1.criarEstruturaDiretorios; } });
Object.defineProperty(exports, "calcularCompletude", { enumerable: true, get: function () { return exportacao_avanc_1.calcularCompletude; } });
Object.defineProperty(exports, "verificarConsistencia", { enumerable: true, get: function () { return exportacao_avanc_1.verificarConsistencia; } });
Object.defineProperty(exports, "gerarEstatisticasGerais", { enumerable: true, get: function () { return exportacao_avanc_1.gerarEstatisticasGerais; } });
Object.defineProperty(exports, "criarDadosResumidos", { enumerable: true, get: function () { return exportacao_avanc_1.criarDadosResumidos; } });
//# sourceMappingURL=index.js.map